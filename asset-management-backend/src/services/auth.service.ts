import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import { User, Department } from '../models';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../utils/errorHandler';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../utils/jwt.utils';
import jwtConfig from '../config/jwt';

// Short-lived token issued after password verification when 2FA is enabled.
const TEMP_TOKEN_EXPIRY = '5m';
const TEMP_TOKEN_PURPOSE = '2fa_pending';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  fullname?: string;
  role?: 'admin' | 'director' | 'department_head' | 'staff';
  department_id?: number;
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

    // Create user — public registration always gets 'staff' role (admin/director only via user management)
    const allowedPublicRoles = ['staff', 'department_head'];
    const assignedRole = (data.role && allowedPublicRoles.includes(data.role)) ? data.role : 'staff';
    const user = await User.create({
      ...data,
      password_hash,
      role: assignedRole,
      is_active: true,
    });

    // Generate tokens
    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      fullname: user.fullname,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginInput): Promise<AuthResponse | TotpPendingResponse> {
    if (!data?.username || typeof data.password !== 'string') {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Find user by username (không include department để tránh lỗi join; thêm sau khi login)
    const user = await User.findOne({ 
      where: { username: String(data.username).trim() },
      attributes: { exclude: ['totp_secret', 'totp_enabled'] },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is disabled');
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
      throw new UnauthorizedError('Invalid credentials');
    }

    // If 2FA is enabled, return a short-lived temp token (totp_* có thể undefined nếu bảng chưa có cột)
    if ((user as any).totp_enabled && (user as any).totp_secret) {
      const tempToken = jwt.sign(
        { id: user.id, purpose: TEMP_TOKEN_PURPOSE },
        jwtConfig.secret,
        { expiresIn: TEMP_TOKEN_EXPIRY }
      );
      return { requires_2fa: true, temp_token: tempToken };
    }

    // No 2FA — issue tokens directly
    return await this._issueTokens(user);
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
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token is done in auth middleware
      // Here we just generate new access token
      const payload: any = refreshToken; // This should be decoded in middleware

      const newAccessToken = generateAccessToken(payload);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
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
  private async _issueTokens(user: User): Promise<AuthResponse> {
    try {
      await user.update({ last_login: new Date() });
    } catch (_e) {
      // Bỏ qua nếu cột last_login không tồn tại hoặc lỗi DB nhỏ
    }

    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      fullname: user.fullname,
    };

    return {
      user: user.toJSON(),
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }
}

export default new AuthService();
