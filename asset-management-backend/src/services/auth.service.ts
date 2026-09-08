import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, Department, AuditLog, AuthSession } from '../models';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../utils/errorHandler';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JWTPayload } from '../utils/jwt.utils';
import jwtConfig from '../config/jwt';
import envConfig from '../config/env';

// Short-lived token issued after password verification when 2FA is enabled.
const TEMP_TOKEN_EXPIRY = '5m';
const TEMP_TOKEN_PURPOSE = '2fa_pending';

// Brute-force protection: lock account after this many consecutive wrong passwords.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  fullname?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
}

export interface TotpPendingResponse {
  requires_2fa: true;
  temp_token: string;
}


class AuthService {
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username: data.username } });
    if (existingUsername) {
      throw new ConflictError('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email: data.email } });
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const password_hash = await User.hashPassword(data.password);

    // Public registration: LUÔN role 'staff', không department_id
    // (department_head/director/admin chỉ được tạo bởi quản trị viên qua user management)
    const user = await User.create({
      username: data.username,
      email: data.email,
      fullname: data.fullname,
      password_hash,
      role: 'staff',
      department_id: null,
      is_active: true,
    });

    return this._issueTokens(user);
  }

  async login(data: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse | TotpPendingResponse> {
    if (!data?.username || typeof data.password !== 'string') {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Find user by username — include totp_enabled so 2FA check works; exclude secret (not needed here)
    const user = await User.findOne({ 
      where: { username: String(data.username).trim() },
      attributes: { exclude: ['totp_secret'] },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Check account lockout (per-username protection, not bypassable by changing IP)
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(
        `Tài khoản bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`
      );
    }

    // Verify password (guard: bcrypt can throw if password_hash is invalid)
    let isPasswordValid = false;
    try {
      if (!user.password_hash) {
        throw new UnauthorizedError('Invalid credentials');
      }
      isPasswordValid = await user.comparePassword(data.password);
    } catch (err: any) {
      if (err?.statusCode === 401) throw err;
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!isPasswordValid) {
      // Increment failed attempts; lock account when threshold is reached
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const updates: Partial<{ failed_login_attempts: number; locked_until: Date | null }> = {
        failed_login_attempts: newAttempts,
      };
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000);
      }
      await user.update(updates);

      // Log failed attempt to audit trail
      try {
        await AuditLog.create({
          user_id: user.id,
          action: 'login',
          table_name: 'users',
          record_id: user.id,
          new_value: { success: false, attempts: newAttempts, locked: newAttempts >= MAX_FAILED_ATTEMPTS },
          ip_address: ipAddress,
          user_agent: userAgent,
        });
      } catch (_e) { /* never let audit failures block the auth response */ }

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        throw new UnauthorizedError(
          `Đăng nhập sai ${MAX_FAILED_ATTEMPTS} lần liên tiếp. Tài khoản bị khóa ${LOCKOUT_DURATION_MINUTES} phút.`
        );
      }
      throw new UnauthorizedError('Invalid credentials');
    }

    // Successful password — reset lockout counter
    await user.update({ failed_login_attempts: 0, locked_until: null });

    // Log successful login to audit trail
    try {
      await AuditLog.create({
        user_id: user.id,
        action: 'login',
        table_name: 'users',
        record_id: user.id,
        new_value: { success: true },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (_e) { /* never let audit failures block the auth response */ }

    // If 2FA is enabled, return a short-lived temp token; secret is verified in validateTotpLogin
    if (user.totp_enabled) {
      const tempToken = jwt.sign(
        { id: user.id, purpose: TEMP_TOKEN_PURPOSE },
        jwtConfig.secret,
        { expiresIn: TEMP_TOKEN_EXPIRY }
      );
      return { requires_2fa: true, temp_token: tempToken };
    }

    // No 2FA — issue tokens directly
    return await this._issueTokens(user, ipAddress, userAgent);
  }

  async getCurrentUser(userId: number): Promise<Partial<User>> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'type'] }],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.toJSON();
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid old password');
    }

    // Hash new password
    const password_hash = await User.hashPassword(newPassword);

    // Update password
    await user.update({ password_hash });

    // A password change invalidates every existing device session.
    await AuthSession.update({ revoked_at: new Date() }, { where: { user_id: userId, revoked_at: null } });
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const session = await AuthSession.findByPk(payload.sid);
      const submittedHash = this._hashToken(refreshToken);

      if (!session || session.user_id !== payload.id || session.revoked_at || session.expires_at <= new Date()) {
        throw new Error('Inactive session');
      }
      if (!crypto.timingSafeEqual(Buffer.from(session.refresh_token_hash), Buffer.from(submittedHash))) {
        // Do not revoke here: two tabs of the same browser can refresh at nearly
        // the same time. The stale request is rejected without killing the
        // newly rotated session used by the other tab.
        throw new Error('Refresh token mismatch');
      }

      // Reload identity/role from DB instead of trusting stale token claims.
      const user = await User.findByPk(session.user_id);
      if (!user || !user.is_active) {
        await session.update({ revoked_at: new Date() });
        throw new Error('Inactive user');
      }

      const claims = this._claimsFor(user, session.id);
      const newAccessToken = generateAccessToken(claims);
      const newRefreshToken = generateRefreshToken(claims);
      const decoded = jwt.decode(newRefreshToken) as jwt.JwtPayload;
      await session.update({
        refresh_token_hash: this._hashToken(newRefreshToken),
        expires_at: new Date((decoded.exp || 0) * 1000),
      });
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async logout(userId: number, sessionId?: string): Promise<void> {
    if (!sessionId) return;
    await AuthSession.update(
      { revoked_at: new Date() },
      { where: { id: sessionId, user_id: userId, revoked_at: null } }
    );
  }

  // ── TOTP / Google Authenticator methods ────────────────────────────────────

  /** Generate a new TOTP secret and return the QR code data-URL (not yet saved). */
  async generateTotpSetup(userId: number): Promise<{ qrCodeUrl: string; secret: string }> {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found');

    const secret = speakeasy.generateSecret({
      name: `Quản lý tài sản (${user.username})`,
      length: 20,
    });

    // Persist the secret (not enabled yet — must be confirmed first)
    await user.update({ totp_secret: secret.base32, totp_enabled: false });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
    return { qrCodeUrl, secret: secret.base32 };
  }

  /** Verify the 6-digit TOTP code and enable 2FA for the user. */
  async enableTotp(userId: number, token: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found');
    if (!user.totp_secret) throw new ValidationError('2FA setup not started. Please start setup first.');

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token,
      window: 1, // allow 30s drift
    });

    if (!verified) throw new UnauthorizedError('Mã xác minh không đúng. Vui lòng thử lại.');

    await user.update({ totp_enabled: true });
  }

  /** Disable 2FA for the user (requires current password for safety). */
  async disableTotp(userId: number, password: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found');

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new UnauthorizedError('Mật khẩu không đúng.');

    await user.update({ totp_secret: null, totp_enabled: false });
  }

  /** Complete the 2FA login: validate temp_token + TOTP code, then return real tokens. */
  async validateTotpLogin(tempToken: string, totpCode: string): Promise<AuthResponse> {
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, jwtConfig.secret) as any;
    } catch {
      throw new UnauthorizedError('Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (decoded.purpose !== TEMP_TOKEN_PURPOSE) {
      throw new UnauthorizedError('Token không hợp lệ.');
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'type'] }],
    });
    if (!user || !user.totp_enabled || !user.totp_secret) {
      throw new UnauthorizedError('Không thể xác thực.');
    }

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });

    if (!verified) throw new UnauthorizedError('Mã xác minh không đúng. Vui lòng thử lại.');

    return this._issueTokens(user);
  }

  /** Internal: update last_login and issue JWT pair. */
  private async _issueTokens(user: User, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      await user.update({ last_login: new Date() });
    } catch (_e) {
      // Bỏ qua nếu cột last_login không tồn tại hoặc lỗi DB nhỏ
    }

    const sessionId = crypto.randomUUID();
    const payload = this._claimsFor(user, sessionId);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;

    await AuthSession.create({
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: this._hashToken(refreshToken),
      expires_at: new Date((decoded.exp || 0) * 1000),
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  private _claimsFor(user: User, sessionId: string): JWTPayload {
    return {
      id: user.id,
      username: user.username,
      email: user.email || '',
      role: user.role,
      department_id: user.department_id,
      fullname: user.fullname,
      sid: sessionId,
      token_type: 'access',
    };
  }

  private _hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export default new AuthService();
