import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { sequelize } from '../config/database';
import { SYSTEM_ADMIN_USERNAME } from '../config/adminCredentials';
import logger from '../utils/logger';
import { ensureDefaultAdminAccount } from '../utils/ensureDefaultAdminAccount';

const execAsync = promisify(exec);

interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: string;
  freeMemory: string;
  uptime: string;
  nodeVersion: string;
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
}

interface DockerInfo {
  /** true nếu gọi được docker CLI, hoặc tiến trình đang chạy trong container (Docker vẫn “đang dùng” ở tầng host) */
  available: boolean;
  /** false khi chỉ phát hiện container runtime, không list/start/stop được từ API này */
  dockerCliAvailable?: boolean;
  runningInContainer?: boolean;
  version?: string;
  containers?: DockerContainer[];
  error?: string;
  /** Gợi ý khi backend trong container nhưng không có docker.sock / CLI */
  message?: string;
}

interface DatabaseInfo {
  connected: boolean;
  version?: string;
  database?: string;
  host?: string;
  port?: number;
  tables?: number;
  size?: string;
  error?: string;
}

interface BackupInfo {
  name: string;
  size: string;
  created: string;
  path: string;
  mtimeMs: number;
}

class SystemAdminService {
  async getSystemInfo(): Promise<SystemInfo> {
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: this.formatBytes(os.totalmem()),
      freeMemory: this.formatBytes(os.freemem()),
      uptime: `${days}d ${hours}h ${minutes}m`,
      nodeVersion: process.version,
    };
  }

  async getDockerInfo(): Promise<DockerInfo> {
    try {
      const { stdout: versionOutput } = await execAsync('docker --version');
      const version = versionOutput.trim();

      const { stdout: psOutput } = await execAsync(
        'docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.Ports}}|{{.CreatedAt}}"'
      );

      const containers: DockerContainer[] = psOutput
        .trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [id, name, image, status, state, ports, created] = line.split('|');
          return { id, name, image, status, state, ports, created };
        });

      return {
        available: true,
        dockerCliAvailable: true,
        runningInContainer: this.isRunningInContainer(),
        version,
        containers,
      };
    } catch (error) {
      logger.warn('Docker CLI not reachable from this process:', error);
      if (this.isRunningInContainer()) {
        return {
          available: true,
          dockerCliAvailable: false,
          runningInContainer: true,
          containers: [],
          version: 'Container runtime (Docker/Podman)',
          message:
            'Backend đang chạy trong container. Trong setup mặc định không có lệnh `docker` và không mount socket Docker — điều này bình thường; Docker trên máy host vẫn chạy stack của bạn. Để xem danh sách container trong màn hình này (chỉ môi trường tin cậy): thêm Docker CLI vào image và mount `/var/run/docker.sock` từ host.',
        };
      }
      return {
        available: false,
        dockerCliAvailable: false,
        error: 'Docker không khả dụng hoặc chưa được cài đặt trên máy chạy backend',
      };
    }
  }

  /** Phát hiện tiến trình Node đang chạy bên trong container (khác với có thể gọi docker CLI). */
  private isRunningInContainer(): boolean {
    try {
      if (fs.existsSync('/.dockerenv')) return true;
      const cg = fs.readFileSync('/proc/self/cgroup', 'utf8');
      return /docker|kubepods|containerd|crio/i.test(cg);
    } catch {
      return false;
    }
  }

  async getDatabaseInfo(): Promise<DatabaseInfo> {
    try {
      const [versionResult] = await sequelize.query('SELECT version()');
      const version = (versionResult as { version: string }[])[0]?.version || 'Unknown';

      const [tablesResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tables = parseInt((tablesResult as { count: string }[])[0]?.count || '0');

      const [sizeResult] = await sequelize.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      const size = (sizeResult as { size: string }[])[0]?.size || 'Unknown';

      const config = sequelize.config;

      return {
        connected: true,
        version,
        database: config.database,
        host: config.host,
        port: typeof config.port === 'string' ? parseInt(config.port) : config.port,
        tables,
        size,
      };
    } catch (error) {
      logger.error('Database info error:', error);
      return {
        connected: false,
        error: 'Không thể kết nối database',
      };
    }
  }

  async restartContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`docker restart ${containerName}`);
      logger.info(`Container ${containerName} restarted successfully`);
      return {
        success: true,
        message: `Container ${containerName} đã được khởi động lại`,
      };
    } catch (error) {
      logger.error(`Failed to restart container ${containerName}:`, error);
      return {
        success: false,
        message: `Không thể khởi động lại container ${containerName}`,
      };
    }
  }

  async stopContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`docker stop ${containerName}`);
      logger.info(`Container ${containerName} stopped successfully`);
      return {
        success: true,
        message: `Container ${containerName} đã được dừng`,
      };
    } catch (error) {
      logger.error(`Failed to stop container ${containerName}:`, error);
      return {
        success: false,
        message: `Không thể dừng container ${containerName}`,
      };
    }
  }

  async startContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`docker start ${containerName}`);
      logger.info(`Container ${containerName} started successfully`);
      return {
        success: true,
        message: `Container ${containerName} đã được khởi động`,
      };
    } catch (error) {
      logger.error(`Failed to start container ${containerName}:`, error);
      return {
        success: false,
        message: `Không thể khởi động container ${containerName}`,
      };
    }
  }

  async getContainerLogs(
    containerName: string,
    lines: number = 100
  ): Promise<{ success: boolean; logs?: string; error?: string }> {
    try {
      const { stdout } = await execAsync(`docker logs --tail ${lines} ${containerName}`);
      return {
        success: true,
        logs: stdout,
      };
    } catch (error) {
      logger.error(`Failed to get logs for container ${containerName}:`, error);
      return {
        success: false,
        error: `Không thể lấy logs của container ${containerName}`,
      };
    }
  }

  async createBackup(): Promise<{ success: boolean; message: string; filename?: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const backupDir = './backups';
    const backupPath = path.resolve(backupDir, filename);

    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const config = sequelize.config;
      const host = (config.host as string) || 'postgres';
      const port = config.port || 5432;
      const username = config.username as string;
      const database = config.database as string;
      const password = (config.password as string) || '';

      // Sử dụng pg_dump kết nối trực tiếp tới postgres qua mạng (không cần docker CLI)
      // -f: ghi trực tiếp vào file, kông dùng shell redirect (tránh file 0 bytes)
      const command = `pg_dump -h ${host} -p ${port} -U ${username} --clean --if-exists --no-owner --no-acl -f "${backupPath}" ${database}`;
      const env = { ...process.env, PGPASSWORD: password };

      await execAsync(command, { env, maxBuffer: 100 * 1024 * 1024 });

      // Kiểm tra file thực sự có dữ liệu
      if (!fs.existsSync(backupPath) || fs.statSync(backupPath).size === 0) {
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        return { success: false, message: 'Backup thất bại: pg_dump không tạo được dữ liệu' };
      }

      logger.info(`Backup created: ${filename}`);
      return {
        success: true,
        message: 'Backup đã được tạo thành công',
        filename,
      };
    } catch (error) {
      logger.error('Backup creation failed:', error);
      // Dọn file nếu pg_dump thất bại giữa chừng
      try { if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath); } catch { /* ignore */ }
      return {
        success: false,
        message: 'Không thể tạo backup',
      };
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    try {
      const backupDir = './backups';
      if (!fs.existsSync(backupDir)) return [];

      const files = fs.readdirSync(backupDir).filter((f) => /^backup_[\w\-]+\.sql$/.test(f));
      return files
        .map((name) => {
          const filePath = `${backupDir}/${name}`;
          const stat = fs.statSync(filePath);
          return {
            name,
            size: this.formatBytes(stat.size),
            created: stat.mtime.toLocaleString('vi-VN'),
            path: filePath,
            mtimeMs: stat.mtimeMs,
          };
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs);
    } catch {
      return [];
    }
  }

  /** Trả về đường dẫn tuyệt đối của file backup nếu tên hợp lệ và file tồn tại, ngược lại null. */
  getBackupPath(filename: string): string | null {
    if (!filename || !/^backup_[\w\-]+\.sql$/.test(filename)) return null;
    const filePath = path.resolve('./backups', filename);
    if (!fs.existsSync(filePath)) return null;
    return filePath;
  }

  /** Xóa các file backup cũ hơn `retentionDays` ngày. Trả về số file đã xóa. */
  async deleteOldBackups(retentionDays: number = 7): Promise<number> {
    try {
      const backupDir = './backups';
      if (!fs.existsSync(backupDir)) return 0;

      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      const files = fs.readdirSync(backupDir).filter((f) => /^backup_[\w\-]+\.sql$/.test(f));
      let deleted = 0;
      for (const name of files) {
        const filePath = path.join(backupDir, name);
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
          logger.info(`Old backup deleted: ${name}`);
          deleted++;
        }
      }
      return deleted;
    } catch (error) {
      logger.error('Failed to delete old backups:', error);
      return 0;
    }
  }

  async resetBusinessData(): Promise<{ success: boolean; message: string }> {
    try {
      const tables = [
        'asset_disposal_items',
        'asset_disposal_cases',
        'inventory_report_details',
        'inventory_reports',
        'inventory_rounds',
        'request_approvals',
        'audit_logs',
        'maintenance_damage_images',
        'maintenance_requests',
        'asset_transfers',
        'procurement_documents',
        'procurement_items',
        'procurements',
        'stock_issue_lines',
        'stock_issues',
        'stock_receipt_lines',
        'stock_receipts',
        'stock_items',
        'annual_reports',
        'assets',
      ];

      // Một transaction: gỡ FK users → departments, rồi truncate mọi bảng nghiệp vụ + departments (PostgreSQL tự sắp thứ tự FK)
      await sequelize.transaction(async (t) => {
        await sequelize.query('UPDATE users SET department_id = NULL', { transaction: t });
        await sequelize.query(
          `TRUNCATE TABLE ${tables.join(', ')}, departments RESTART IDENTITY CASCADE`,
          { transaction: t }
        );
      });

      await ensureDefaultAdminAccount();
      logger.info(
        `Business data reset OK; admin reset to ${SYSTEM_ADMIN_USERNAME} / fixed password`
      );

      return {
        success: true,
        message: `Dữ liệu nghiệp vụ và phòng ban đã xóa. Tài khoản ${SYSTEM_ADMIN_USERNAME} đã đặt lại mật khẩu (theo ADMIN_PASSWORD trong .env) và tắt 2FA. Users khác và asset_categories giữ nguyên.`,
      };
    } catch (error) {
      logger.error('Reset business data failed:', error);
      return {
        success: false,
        message: 'Không thể xóa dữ liệu nghiệp vụ',
      };
    }
  }

  async runMigrations(): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout } = await execAsync('npm run migrate');
      logger.info('Migrations completed:', stdout);
      return {
        success: true,
        message: 'Migrations đã chạy thành công',
      };
    } catch (error) {
      logger.error('Migration failed:', error);
      return {
        success: false,
        message: 'Không thể chạy migrations',
      };
    }
  }

  async seedDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout } = await execAsync('npm run seed');
      logger.info('Seeding completed:', stdout);
      await ensureDefaultAdminAccount();
      return {
        success: true,
        message: `Seed data đã được thêm. Tài khoản ${SYSTEM_ADMIN_USERNAME} đã đặt lại mật khẩu (theo ADMIN_PASSWORD trong .env).`,
      };
    } catch (error) {
      logger.error('Seeding failed:', error);
      return {
        success: false,
        message: 'Không thể seed database',
      };
    }
  }

  async restoreBackup(filename: string): Promise<{ success: boolean; message: string }> {
    // Strict validation to prevent path traversal
    if (!filename || !/^backup_[\w\-]+\.sql$/.test(filename)) {
      return { success: false, message: 'Tên file backup không hợp lệ' };
    }
    try {
      const backupPath = path.resolve('./backups', filename);
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: `File backup không tồn tại: ${filename}` };
      }

      // Kiểm tra file không rỗng trước khi restore
      if (fs.statSync(backupPath).size === 0) {
        return { success: false, message: 'File backup rỗng (0 bytes), không thể khôi phục' };
      }

      const config = sequelize.config;
      const host = (config.host as string) || 'postgres';
      const port = config.port || 5432;
      const username = config.username as string;
      const database = config.database as string;
      const password = (config.password as string) || '';

      // Sử dụng psql kết nối trực tiếp (không cần docker CLI)
      // -f: đọc từ file thay vì stdin redirect, tránh giới hạn buffer
      const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupPath}"`;
      const env = { ...process.env, PGPASSWORD: password };
      const { stderr } = await execAsync(command, { env, maxBuffer: 100 * 1024 * 1024 });
      if (stderr) logger.warn(`Restore stderr: ${stderr}`);
      logger.info(`Database restored from backup: ${filename}`);
      return { success: true, message: `Khôi phục database thành công từ: ${filename}` };
    } catch (error) {
      logger.error('Restore failed:', error);
      return { success: false, message: 'Không thể khôi phục backup. Kiểm tra file backup còn tồn tại và Docker đang chạy.' };
    }
  }

  async getHealthCheck(): Promise<{
    status: string;
    database: boolean;
    docker: boolean;
    uptime: string;
    memory: { used: string; total: string; percentage: number };
  }> {
    const dbInfo = await this.getDatabaseInfo();
    const dockerInfo = await this.getDockerInfo();
    const systemInfo = await this.getSystemInfo();

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    return {
      status: dbInfo.connected ? 'healthy' : 'unhealthy',
      database: dbInfo.connected,
      docker: dockerInfo.available,
      uptime: systemInfo.uptime,
      memory: {
        used: this.formatBytes(usedMem),
        total: this.formatBytes(totalMem),
        percentage: memPercentage,
      },
    };
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new SystemAdminService();
