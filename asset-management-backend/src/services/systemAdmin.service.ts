import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { sequelize } from '../config/database';
import { SYSTEM_ADMIN_PASSWORD, SYSTEM_ADMIN_USERNAME } from '../config/adminCredentials';
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
  available: boolean;
  version?: string;
  containers?: DockerContainer[];
  error?: string;
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
        version,
        containers,
      };
    } catch (error) {
      logger.warn('Docker not available:', error);
      return {
        available: false,
        error: 'Docker không khả dụng hoặc chưa được cài đặt',
      };
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
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.sql`;
      const backupPath = `./backups/${filename}`;

      const config = sequelize.config;
      const command = `docker exec asset-management-postgres pg_dump -U ${config.username} ${config.database} > ${backupPath}`;

      await execAsync(command);
      logger.info(`Backup created: ${filename}`);

      return {
        success: true,
        message: 'Backup đã được tạo thành công',
        filename,
      };
    } catch (error) {
      logger.error('Backup creation failed:', error);
      return {
        success: false,
        message: 'Không thể tạo backup',
      };
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    try {
      const { stdout } = await execAsync('ls -la ./backups/*.sql 2>/dev/null || echo ""');
      if (!stdout.trim()) return [];

      const lines = stdout.trim().split('\n').filter((l) => l.includes('.sql'));
      return lines.map((line) => {
        const parts = line.split(/\s+/);
        return {
          name: parts[parts.length - 1].replace('./backups/', ''),
          size: parts[4] || '0',
          created: `${parts[5]} ${parts[6]} ${parts[7]}`,
          path: parts[parts.length - 1],
        };
      });
    } catch {
      return [];
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
        message: `Dữ liệu nghiệp vụ và phòng ban đã xóa. Đăng nhập: ${SYSTEM_ADMIN_USERNAME} / ${SYSTEM_ADMIN_PASSWORD} (đã đặt lại mật khẩu admin, tắt 2FA). Users khác và asset_categories giữ nguyên.`,
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
        message: `Seed data đã được thêm. Tài khoản ${SYSTEM_ADMIN_USERNAME} đã đặt lại mật khẩu ${SYSTEM_ADMIN_PASSWORD}.`,
      };
    } catch (error) {
      logger.error('Seeding failed:', error);
      return {
        success: false,
        message: 'Không thể seed database',
      };
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
