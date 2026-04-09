<template>
  <div class="system-admin-page">
    <div class="page-header">
      <div class="header-left">
        <h1>Quản trị hệ thống</h1>
        <p class="subtitle">
          Quản lý Docker, Database, Backup và cấu hình hệ thống
        </p>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :icon="Refresh"
          :loading="loading"
          @click="refreshAll"
        >
          Làm mới
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="loadError"
      type="error"
      :title="loadError"
      show-icon
      closable
      class="load-error-alert"
      @close="loadError = null"
    />

    <!-- Health Overview -->
    <el-row
      :gutter="16"
      class="health-cards"
    >
      <el-col
        :xs="12"
        :sm="6"
        :md="6"
      >
        <el-card
          class="stat-card"
          :class="healthData?.status === 'healthy' ? 'success' : 'danger'"
        >
          <div class="stat-icon">
            <el-icon :size="32">
              <Monitor />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">
              {{ healthData?.status === 'healthy' ? 'Hoạt động' : 'Lỗi' }}
            </div>
            <div class="stat-label">
              Trạng thái hệ thống
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col
        :xs="12"
        :sm="6"
        :md="6"
      >
        <el-card
          class="stat-card"
          :class="healthData?.database ? 'success' : 'danger'"
        >
          <div class="stat-icon">
            <el-icon :size="32">
              <Coin />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">
              {{ healthData?.database ? 'Kết nối' : 'Mất kết nối' }}
            </div>
            <div class="stat-label">
              Database
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col
        :xs="12"
        :sm="6"
        :md="6"
      >
        <el-card
          class="stat-card"
          :class="healthData?.docker ? 'success' : 'warning'"
        >
          <div class="stat-icon">
            <el-icon :size="32">
              <Box />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">
              {{ healthData?.docker ? 'Khả dụng' : 'Không có' }}
            </div>
            <div class="stat-label">
              Docker
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col
        :xs="12"
        :sm="6"
        :md="6"
      >
        <el-card class="stat-card info">
          <div class="stat-icon">
            <el-icon :size="32">
              <Timer />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">
              {{ healthData?.uptime || '-' }}
            </div>
            <div class="stat-label">
              Uptime
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Memory Usage -->
    <el-card
      v-if="healthData?.memory"
      class="memory-card"
    >
      <template #header>
        <div class="card-header">
          <span>Bộ nhớ hệ thống</span>
        </div>
      </template>
      <el-progress
        :percentage="healthData.memory.percentage"
        :color="getMemoryColor(healthData.memory.percentage)"
        :stroke-width="20"
        :format="() => `${healthData?.memory?.used} / ${healthData?.memory?.total}`"
      />
    </el-card>

    <el-row :gutter="16">
      <!-- System Info -->
      <el-col
        :xs="24"
        :md="12"
      >
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Monitor /></el-icon> Thông tin hệ thống</span>
            </div>
          </template>
          <el-descriptions
            v-if="systemInfo"
            :column="1"
            border
          >
            <el-descriptions-item label="Hostname">
              {{ systemInfo.hostname }}
            </el-descriptions-item>
            <el-descriptions-item label="Platform">
              {{ systemInfo.platform }}
            </el-descriptions-item>
            <el-descriptions-item label="Architecture">
              {{ systemInfo.arch }}
            </el-descriptions-item>
            <el-descriptions-item label="CPU Cores">
              {{ systemInfo.cpus }}
            </el-descriptions-item>
            <el-descriptions-item label="Total Memory">
              {{ systemInfo.totalMemory }}
            </el-descriptions-item>
            <el-descriptions-item label="Free Memory">
              {{ systemInfo.freeMemory }}
            </el-descriptions-item>
            <el-descriptions-item label="Node.js">
              {{ systemInfo.nodeVersion }}
            </el-descriptions-item>
          </el-descriptions>
          <el-empty
            v-else
            description="Không có dữ liệu"
          />
        </el-card>
      </el-col>

      <!-- Database Info -->
      <el-col
        :xs="24"
        :md="12"
      >
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Coin /></el-icon> Thông tin Database</span>
            </div>
          </template>
          <el-descriptions
            v-if="databaseInfo?.connected"
            :column="1"
            border
          >
            <el-descriptions-item label="Trạng thái">
              <el-tag type="success">
                Đã kết nối
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Database">
              {{ databaseInfo.database }}
            </el-descriptions-item>
            <el-descriptions-item label="Host">
              {{ databaseInfo.host }}:{{ databaseInfo.port }}
            </el-descriptions-item>
            <el-descriptions-item label="Số bảng">
              {{ databaseInfo.tables }}
            </el-descriptions-item>
            <el-descriptions-item label="Kích thước">
              {{ databaseInfo.size }}
            </el-descriptions-item>
            <el-descriptions-item label="Version">
              {{ databaseInfo.version?.split(' ')[0] }}
            </el-descriptions-item>
          </el-descriptions>
          <el-alert
            v-else
            type="error"
            :closable="false"
          >
            {{ databaseInfo?.error || 'Không thể kết nối database' }}
          </el-alert>
        </el-card>
      </el-col>
    </el-row>

    <!-- Docker Containers (chỉ khi có docker CLI/socket trong process backend) -->
    <el-card
      v-if="dockerInfo?.available && dockerInfo.dockerCliAvailable !== false"
      class="docker-card"
    >
      <template #header>
        <div class="card-header">
          <span><el-icon><Box /></el-icon> Docker Containers</span>
          <el-tag size="small">
            {{ dockerInfo.version }}
          </el-tag>
        </div>
      </template>
      <div class="responsive-table">
        <el-table
          :data="dockerInfo.containers"
          stripe
        >
          <el-table-column
            prop="name"
            label="Tên Container"
            min-width="180"
          />
          <el-table-column
            prop="image"
            label="Image"
            min-width="200"
          />
          <el-table-column
            prop="state"
            label="Trạng thái"
            width="120"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.state === 'running' ? 'success' : 'danger'"
                size="small"
              >
                {{ row.state }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            label="Chi tiết"
            min-width="150"
          />
          <el-table-column
            label="Thao tác"
            width="280"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button-group>
                <el-button
                  size="small"
                  type="success"
                  :icon="VideoPlay"
                  :disabled="row.state === 'running'"
                  :loading="containerLoading[row.name]"
                  @click="startContainer(row.name)"
                >
                  Start
                </el-button>
                <el-button
                  size="small"
                  type="warning"
                  :icon="RefreshRight"
                  :loading="containerLoading[row.name]"
                  @click="restartContainer(row.name)"
                >
                  Restart
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  :icon="VideoPause"
                  :disabled="row.state !== 'running'"
                  :loading="containerLoading[row.name]"
                  @click="stopContainer(row.name)"
                >
                  Stop
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-alert
      v-else-if="dockerInfo?.available && dockerInfo.dockerCliAvailable === false"
      type="info"
      :closable="false"
      class="docker-alert"
      show-icon
    >
      <template #title>
        Đang chạy trong Docker (không điều khiển CLI từ container)
      </template>
      {{ dockerInfo.message }}
    </el-alert>

    <el-alert
      v-else-if="dockerInfo && !dockerInfo.available"
      type="warning"
      :closable="false"
      class="docker-alert"
    >
      <template #title>
        Docker không khả dụng
      </template>
      {{ dockerInfo.error }}
    </el-alert>

    <!-- Dangerous Actions -->
    <el-card class="danger-card">
      <template #header>
        <div class="card-header danger">
          <span><el-icon><Warning /></el-icon> Thao tác nguy hiểm</span>
        </div>
      </template>
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        Các thao tác dưới đây có thể ảnh hưởng đến dữ liệu hệ thống. Hãy cẩn thận!
      </el-alert>

      <el-row :gutter="16">
        <el-col
          :xs="24"
          :sm="12"
          :md="6"
        >
          <el-card
            shadow="hover"
            class="action-card"
          >
            <div class="action-icon backup">
              <el-icon :size="40">
                <FolderAdd />
              </el-icon>
            </div>
            <h4>Backup Database</h4>
            <p>Tạo bản sao lưu database hiện tại</p>
            <el-button
              type="primary"
              :loading="actionLoading.backup"
              @click="createBackup"
            >
              Tạo Backup
            </el-button>
          </el-card>
        </el-col>

        <el-col
          :xs="24"
          :sm="12"
          :md="6"
        >
          <el-card
            shadow="hover"
            class="action-card"
          >
            <div class="action-icon migrate">
              <el-icon :size="40">
                <Upload />
              </el-icon>
            </div>
            <h4>Run Migrations</h4>
            <p>Chạy database migrations</p>
            <el-button
              type="info"
              :loading="actionLoading.migrate"
              @click="runMigrations"
            >
              Chạy Migrations
            </el-button>
          </el-card>
        </el-col>

        <el-col
          :xs="24"
          :sm="12"
          :md="6"
        >
          <el-card
            shadow="hover"
            class="action-card"
          >
            <div class="action-icon seed">
              <el-icon :size="40">
                <Document />
              </el-icon>
            </div>
            <h4>Seed Database</h4>
            <p>Thêm dữ liệu mẫu vào database</p>
            <el-button
              type="success"
              :loading="actionLoading.seed"
              @click="seedDatabase"
            >
              Seed Data
            </el-button>
          </el-card>
        </el-col>

        <el-col
          :xs="24"
          :sm="12"
          :md="6"
        >
          <el-card
            shadow="hover"
            class="action-card danger"
          >
            <div class="action-icon reset">
              <el-icon :size="40">
                <Delete />
              </el-icon>
            </div>
            <h4>Reset Data</h4>
            <p>Xóa toàn bộ dữ liệu nghiệp vụ và phòng ban</p>
            <el-button
              type="danger"
              :loading="actionLoading.reset"
              @click="showResetDialog = true"
            >
              Reset Data
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- Backups List -->
    <el-card class="backups-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><Folder /></el-icon> Danh sách Backup</span>
          <el-button
            size="small"
            :icon="Refresh"
            :loading="loadingBackups"
            @click="fetchBackups"
          >
            Làm mới
          </el-button>
        </div>
      </template>
      <el-empty
        v-if="backups.length === 0"
        description="Chưa có file backup nào. Nhấn 'Tạo Backup' để tạo bản sao lưu đầu tiên."
        :image-size="80"
      />
      <el-table
        v-else
        :data="backups"
        stripe
      >
        <el-table-column
          prop="name"
          label="Tên file"
          min-width="260"
        />
        <el-table-column
          prop="size"
          label="Kích thước"
          width="120"
        />
        <el-table-column
          prop="created"
          label="Ngày tạo"
          width="180"
        />
        <el-table-column
          label="Thạo tác"
          width="140"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              type="warning"
              :icon="RefreshLeft"
              :loading="restoringFile === row.name"
              @click="confirmRestore(row.name)"
            >
              Khôi phục
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Restore Confirmation Dialog -->
    <el-dialog
      v-model="showRestoreDialog"
      title="Xác nhận Khôi phục Database"
      width="500px"
    >
      <el-alert
        type="error"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          CẢNH BÁO: Khôi phục sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại!
        </template>
        Dữ liệu trong database sẽ được thay thế bằng snapshot từ file backup.
        Thao tác này không thể hoàn tác. Hãy chắc chắn bạn muốn tiếp tục.
      </el-alert>
      <div style="margin-bottom: 12px">
        <strong>File backup:</strong> <code>{{ restoreFilename }}</code>
      </div>
      <el-form>
        <el-form-item label="Nhập 'RESTORE' để xác nhận:">
          <el-input
            v-model="restoreConfirmText"
            placeholder="RESTORE"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRestoreDialog = false">
          Hủy
        </el-button>
        <el-button
          type="warning"
          :disabled="restoreConfirmText !== 'RESTORE'"
          :loading="restoringFile !== null"
          @click="doRestore"
        >
          Xác nhận Khôi phục
        </el-button>
      </template>
    </el-dialog>

    <!-- Reset Confirmation Dialog -->
    <el-dialog
      v-model="showResetDialog"
      title="Xác nhận Reset Data"
      width="500px"
    >
      <el-alert
        type="error"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          CẢNH BÁO: Thao tác này không thể hoàn tác!
        </template>
        Tất cả dữ liệu nghiệp vụ sẽ bị xóa bao gồm: <strong>phòng ban</strong>, tài sản, bảo trì, điều chuyển, kiểm kê, thanh lý, v.v.
        <br><br>
        <strong>GIỮ NGUYÊN:</strong> users, asset_categories
      </el-alert>
      <el-form>
        <el-form-item label="Nhập 'RESET_DATA' để xác nhận:">
          <el-input
            v-model="resetConfirmText"
            placeholder="RESET_DATA"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResetDialog = false">
          Hủy
        </el-button>
        <el-button
          type="danger"
          :disabled="resetConfirmText !== 'RESET_DATA'"
          :loading="actionLoading.reset"
          @click="resetBusinessData"
        >
          Xác nhận Reset
        </el-button>
      </template>
    </el-dialog>

    <!-- Container Logs Dialog -->
    <el-dialog
      v-model="showLogsDialog"
      :title="`Logs: ${selectedContainer}`"
      width="80%"
    >
      <pre class="logs-content">{{ containerLogs }}</pre>
      <template #footer>
        <el-button @click="showLogsDialog = false">
          Đóng
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Refresh,
  Monitor,
  Coin,
  Box,
  Timer,
  Warning,
  FolderAdd,
  Upload,
  Document,
  Delete,
  Folder,
  VideoPlay,
  VideoPause,
  RefreshRight,
  RefreshLeft,
} from '@element-plus/icons-vue';
import systemAdminService, {
  type SystemInfo,
  type DockerInfo,
  type DatabaseInfo,
  type BackupInfo,
  type HealthCheck,
} from '@/services/systemAdmin.service';
import { invalidateGlobalDepartmentCache } from '@/composables/useDepartments';
import { useDepartmentStore } from '@/stores/department.store';

const departmentStore = useDepartmentStore();

const loading = ref(false);
const healthData = ref<HealthCheck | null>(null);
const systemInfo = ref<SystemInfo | null>(null);
const dockerInfo = ref<DockerInfo | null>(null);
const databaseInfo = ref<DatabaseInfo | null>(null);
const backups = ref<BackupInfo[]>([]);
const loadingBackups = ref(false);

const containerLoading = reactive<Record<string, boolean>>({});
const actionLoading = reactive({
  backup: false,
  migrate: false,
  seed: false,
  reset: false,
});

const showResetDialog = ref(false);
const resetConfirmText = ref('');
const showLogsDialog = ref(false);
const selectedContainer = ref('');
const containerLogs = ref('');
const showRestoreDialog = ref(false);
const restoreFilename = ref('');
const restoreConfirmText = ref('');
const restoringFile = ref<string | null>(null);

const getMemoryColor = (percentage: number) => {
  if (percentage < 60) return '#67c23a';
  if (percentage < 80) return '#e6a23c';
  return '#f56c6c';
};

const loadError = ref<string | null>(null);

const fetchHealthCheck = async () => {
  try {
    healthData.value = await systemAdminService.getHealthCheck();
  } catch (error) {
    console.error('Failed to fetch health check:', error);
  }
};

const fetchSystemInfo = async () => {
  try {
    systemInfo.value = await systemAdminService.getSystemInfo();
  } catch (error) {
    console.error('Failed to fetch system info:', error);
  }
};

const fetchDockerInfo = async () => {
  try {
    dockerInfo.value = await systemAdminService.getDockerInfo();
  } catch (error) {
    console.error('Failed to fetch docker info:', error);
  }
};

const fetchDatabaseInfo = async () => {
  try {
    databaseInfo.value = await systemAdminService.getDatabaseInfo();
  } catch (error) {
    console.error('Failed to fetch database info:', error);
  }
};

const fetchBackups = async () => {
  loadingBackups.value = true;
  try {
    backups.value = await systemAdminService.listBackups();
  } catch (error) {
    console.error('Failed to fetch backups:', error);
  } finally {
    loadingBackups.value = false;
  }
};

const refreshAll = async () => {
  loading.value = true;
  loadError.value = null;
  try {
    await Promise.all([
      fetchHealthCheck(),
      fetchSystemInfo(),
      fetchDockerInfo(),
      fetchDatabaseInfo(),
      fetchBackups(),
    ]);
    if (!healthData.value && !systemInfo.value && !databaseInfo.value) {
      loadError.value = 'Không nhận được thông tin từ server. Kiểm tra: 1) Tài khoản có quyền admin, 2) Backend đang chạy, 3) URL API (VITE_API_BASE_URL).';
      ElMessage.error('Không nhận được dữ liệu trang quản trị.');
    } else {
      ElMessage.success('Đã làm mới dữ liệu');
    }
  } catch (err) {
    const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Không thể tải thông tin';
    loadError.value = msg;
    ElMessage.error('Không nhận được thông tin từ server. Kiểm tra quyền admin hoặc kết nối API.');
  } finally {
    loading.value = false;
  }
};

const startContainer = async (name: string) => {
  containerLoading[name] = true;
  try {
    const result = await systemAdminService.startContainer(name);
    if (result.success) {
      ElMessage.success(result.message);
      await fetchDockerInfo();
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error('Không thể khởi động container');
  } finally {
    containerLoading[name] = false;
  }
};

const stopContainer = async (name: string) => {
  try {
    await ElMessageBox.confirm(`Bạn có chắc muốn dừng container ${name}?`, 'Xác nhận', {
      type: 'warning',
    });
    containerLoading[name] = true;
    const result = await systemAdminService.stopContainer(name);
    if (result.success) {
      ElMessage.success(result.message);
      await fetchDockerInfo();
    } else {
      ElMessage.error(result.message);
    }
  } catch {
    // User cancelled
  } finally {
    containerLoading[name] = false;
  }
};

const restartContainer = async (name: string) => {
  try {
    await ElMessageBox.confirm(`Bạn có chắc muốn khởi động lại container ${name}?`, 'Xác nhận', {
      type: 'warning',
    });
    containerLoading[name] = true;
    const result = await systemAdminService.restartContainer(name);
    if (result.success) {
      ElMessage.success(result.message);
      await fetchDockerInfo();
    } else {
      ElMessage.error(result.message);
    }
  } catch {
    // User cancelled
  } finally {
    containerLoading[name] = false;
  }
};

const createBackup = async () => {
  actionLoading.backup = true;
  try {
    const result = await systemAdminService.createBackup();
    if (result.success) {
      ElMessage.success(result.message);
      await fetchBackups();
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error('Không thể tạo backup');
  } finally {
    actionLoading.backup = false;
  }
};

const runMigrations = async () => {
  try {
    await ElMessageBox.confirm('Bạn có chắc muốn chạy migrations?', 'Xác nhận', {
      type: 'warning',
    });
    actionLoading.migrate = true;
    const result = await systemAdminService.runMigrations();
    if (result.success) {
      ElMessage.success(result.message);
    } else {
      ElMessage.error(result.message);
    }
  } catch {
    // User cancelled
  } finally {
    actionLoading.migrate = false;
  }
};

const seedDatabase = async () => {
  try {
    await ElMessageBox.confirm('Bạn có chắc muốn thêm dữ liệu mẫu?', 'Xác nhận', {
      type: 'warning',
    });
    actionLoading.seed = true;
    const result = await systemAdminService.seedDatabase();
    if (result.success) {
      ElMessage.success(result.message);
      invalidateGlobalDepartmentCache();
      departmentStore.$patch({ departments: [], departmentTree: [], currentDepartment: null });
      try {
        await departmentStore.fetchDepartments({ limit: 1000 });
        await departmentStore.fetchDepartmentTree();
      } catch {
        /* ignore */
      }
    } else {
      ElMessage.error(result.message);
    }
  } catch {
    // User cancelled
  } finally {
    actionLoading.seed = false;
  }
};

const confirmRestore = (filename: string) => {
  restoreFilename.value = filename;
  restoreConfirmText.value = '';
  showRestoreDialog.value = true;
};

const doRestore = async () => {
  if (restoreConfirmText.value !== 'RESTORE') return;
  restoringFile.value = restoreFilename.value;
  try {
    const result = await systemAdminService.restoreBackup(restoreFilename.value);
    if (result.success) {
      ElMessage.success(result.message);
      showRestoreDialog.value = false;
    } else {
      ElMessage.error(result.message);
    }
  } catch {
    ElMessage.error('Không thể khôi phục backup');
  } finally {
    restoringFile.value = null;
    restoreConfirmText.value = '';
  }
};

const resetBusinessData = async () => {
  actionLoading.reset = true;
  try {
    const result = await systemAdminService.resetBusinessData();
    if (result.success) {
      ElMessage.success(result.message);
      invalidateGlobalDepartmentCache();
      departmentStore.$patch({ departments: [], departmentTree: [], currentDepartment: null });
      try {
        await departmentStore.fetchDepartments({ limit: 1000 });
        await departmentStore.fetchDepartmentTree();
      } catch {
        /* ignore */
      }
      showResetDialog.value = false;
      resetConfirmText.value = '';
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error('Không thể reset data');
  } finally {
    actionLoading.reset = false;
  }
};

onMounted(() => {
  refreshAll();
});
</script>

<style scoped>
.system-admin-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.page-header .subtitle {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.health-cards {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-card.success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1px solid #6ee7b7;
}

.stat-card.danger {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #fca5a5;
}

.stat-card.warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
}

.stat-card.info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #93c5fd;
}

.stat-icon {
  margin-right: 16px;
  color: #374151;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
}

.memory-card {
  margin-bottom: 24px;
}

.info-card,
.docker-card,
.danger-card,
.backups-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-header.danger {
  color: #dc2626;
}

.load-error-alert {
  margin-bottom: 16px;
}

.docker-alert {
  margin-bottom: 24px;
}

.action-card {
  text-align: center;
  padding: 24px 16px;
  height: 100%;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-4px);
}

.action-card.danger {
  border-color: #fecaca;
}

.action-card h4 {
  margin: 16px 0 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.action-card p {
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: #6b7280;
}

.action-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon.backup {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
}

.action-icon.migrate {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4f46e5;
}

.action-icon.seed {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

.action-icon.reset {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.logs-content {
  background: #1f2937;
  color: #d1d5db;
  padding: 16px;
  border-radius: 8px;
  max-height: 500px;
  overflow: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.responsive-table {
  overflow-x: auto;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
  }

  .stat-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .action-card {
    margin-bottom: 16px;
  }
}
</style>
