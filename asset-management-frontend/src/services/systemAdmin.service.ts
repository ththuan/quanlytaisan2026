import api from './api';

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: string;
  freeMemory: string;
  uptime: string;
  nodeVersion: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
}

export interface DockerInfo {
  available: boolean;
  /** false = backend trong container, không gọi được docker CLI (bình thường nếu chưa mount socket) */
  dockerCliAvailable?: boolean;
  runningInContainer?: boolean;
  version?: string;
  containers?: DockerContainer[];
  error?: string;
  message?: string;
}

export interface DatabaseInfo {
  connected: boolean;
  version?: string;
  database?: string;
  host?: string;
  port?: number;
  tables?: number;
  size?: string;
  error?: string;
}

export interface BackupInfo {
  name: string;
  size: string;
  created: string;
  path: string;
}

export interface HealthCheck {
  status: string;
  database: boolean;
  docker: boolean;
  uptime: string;
  memory: {
    used: string;
    total: string;
    percentage: number;
  };
}

/** Backend trả về { success, data }. Unwrap để lấy đúng payload. */
function unwrap<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
}

const systemAdminService = {
  async getHealthCheck(): Promise<HealthCheck> {
    const response = await api.get('/system-admin/health');
    return unwrap<HealthCheck>(response);
  },

  async getSystemInfo(): Promise<SystemInfo> {
    const response = await api.get('/system-admin/system');
    return unwrap<SystemInfo>(response);
  },

  async getDockerInfo(): Promise<DockerInfo> {
    const response = await api.get('/system-admin/docker');
    return unwrap<DockerInfo>(response);
  },

  async getDatabaseInfo(): Promise<DatabaseInfo> {
    const response = await api.get('/system-admin/database');
    return unwrap<DatabaseInfo>(response);
  },

  async restartContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/system-admin/docker/${containerName}/restart`);
    return unwrap<{ success: boolean; message: string }>(response);
  },

  async stopContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/system-admin/docker/${containerName}/stop`);
    return unwrap<{ success: boolean; message: string }>(response);
  },

  async startContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/system-admin/docker/${containerName}/start`);
    return unwrap<{ success: boolean; message: string }>(response);
  },

  async getContainerLogs(
    containerName: string,
    lines: number = 100
  ): Promise<{ success: boolean; logs?: string; error?: string }> {
    const response = await api.get(`/system-admin/docker/${containerName}/logs`, {
      params: { lines },
    });
    return unwrap<{ success: boolean; logs?: string; error?: string }>(response);
  },

  async createBackup(): Promise<{ success: boolean; message: string; filename?: string }> {
    const response = await api.post('/system-admin/backup');
    return unwrap<{ success: boolean; message: string; filename?: string }>(response);
  },

  async listBackups(): Promise<BackupInfo[]> {
    const response = await api.get('/system-admin/backups');
    return unwrap<BackupInfo[]>(response) ?? [];
  },

  async downloadBackup(filename: string): Promise<Blob> {
    const response = await api.get(
      `/system-admin/backups/${encodeURIComponent(filename)}/download`,
      { responseType: 'blob' }
    );
    return response as unknown as Blob;
  },

  async restoreBackup(filename: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/system-admin/restore', { filename });
    return unwrap<{ success: boolean; message: string }>(response);
  },

  async resetBusinessData(): Promise<{ success: boolean; message: string }> {
    // Reset may wait for active database transactions and can legitimately take
    // longer than the shared 10-second API timeout.
    const response = await api.post(
      '/system-admin/reset-data',
      { confirm: 'RESET_DATA' },
      { timeout: 120000 }
    );
    return unwrap<{ success: boolean; message: string }>(response);
  },

  async runMigrations(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/system-admin/migrate');
    return unwrap<{ success: boolean; message: string }>(response);
  },

  async seedDatabase(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/system-admin/seed');
    return unwrap<{ success: boolean; message: string }>(response);
  },
};

export default systemAdminService;
