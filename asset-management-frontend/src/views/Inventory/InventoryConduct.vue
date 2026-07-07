<template>
  <div class="inventory-conduct">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          :icon="ArrowLeft"
          @click="goBack"
        >
          Quay lại
        </el-button>
        <h2>Thực hiện kiểm kê</h2>
      </div>
      <div class="header-right">
        <el-button 
          :loading="markingMissing" 
          :disabled="!hasUnscannedAssets"
          type="warning"
          @click="markUnscannedAsMissing"
        >
          <el-icon><Warning /></el-icon>
          Đánh dấu tài sản chưa quét là Thiếu
        </el-button>
        <el-button
          :loading="saving"
          :disabled="!hasChanges"
          @click="saveAsDraft"
        >
          <el-icon><DocumentCopy /></el-icon>
          Lưu nháp
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submitReport"
        >
          <el-icon><Select /></el-icon>
          Nộp báo cáo
        </el-button>
      </div>
    </div>

    <!-- Round Info - Enhanced -->
    <el-card
      v-if="round"
      class="round-info"
    >
      <div class="round-info-header">
        <div class="round-info-main">
          <h3 class="round-name">
            {{ round.round_name }}
          </h3>
          <div class="round-details">
            <div class="detail-item">
              <el-icon class="detail-icon">
                <Calendar />
              </el-icon>
              <span class="detail-label">Năm:</span>
              <span class="detail-value">{{ round.round_year }}</span>
            </div>
            <div class="detail-item">
              <el-icon class="detail-icon">
                <Timer />
              </el-icon>
              <span class="detail-label">Thời gian:</span>
              <span class="detail-value">{{ formatDate(round.start_date) }} - {{ formatDate(round.end_date) }}</span>
            </div>
            <div class="detail-item">
              <el-icon class="detail-icon">
                <OfficeBuilding />
              </el-icon>
              <span class="detail-label">Phòng ban:</span>
              <span class="detail-value">{{ departmentName }}</span>
            </div>
          </div>
        </div>
        <div class="round-status-badge">
          <el-tag 
            :type="getReportStatusType(report?.status)" 
            size="large"
          >
            {{ getReportStatusLabel(report?.status) }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- Summary Stats - Enhanced Dashboard -->
    <div class="summary-stats">
      <el-card class="stat-card">
        <div class="stat-value">
          {{ totalAssets }}
        </div>
        <div class="stat-label">
          Tổng tài sản
        </div>
        <div class="stat-progress">
          <el-progress 
            :percentage="totalAssets > 0 ? Math.round((checkedCount / totalAssets) * 100) : 0" 
            :status="checkedCount === totalAssets ? 'success' : ''"
            :stroke-width="6"
          />
        </div>
      </el-card>
      <el-card class="stat-card success">
        <div class="stat-value">
          {{ matchedCount }}
        </div>
        <div class="stat-label">
          Khớp (Còn tồn tại)
        </div>
        <div class="stat-percentage">
          {{ totalAssets > 0 ? Math.round((matchedCount / totalAssets) * 100) : 0 }}%
        </div>
      </el-card>
      <el-card class="stat-card danger">
        <div class="stat-value">
          {{ missingCount }}
        </div>
        <div class="stat-label">
          Thiếu (Mất)
        </div>
        <div class="stat-percentage">
          {{ totalAssets > 0 ? Math.round((missingCount / totalAssets) * 100) : 0 }}%
        </div>
      </el-card>
      <el-card class="stat-card warning">
        <div class="stat-value">
          {{ needsRepairCount }}
        </div>
        <div class="stat-label">
          Cần sửa chữa
        </div>
        <div class="stat-percentage">
          {{ totalAssets > 0 ? Math.round((needsRepairCount / totalAssets) * 100) : 0 }}%
        </div>
      </el-card>
      <el-card class="stat-card danger">
        <div class="stat-value">
          {{ damagedCount }}
        </div>
        <div class="stat-label">
          Hỏng/Thanh lý
        </div>
        <div class="stat-percentage">
          {{ totalAssets > 0 ? Math.round((damagedCount / totalAssets) * 100) : 0 }}%
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-value">
          {{ checkedCount }}/{{ totalAssets }}
        </div>
        <div class="stat-label">
          Đã kiểm
        </div>
        <div class="stat-progress">
          <el-progress 
            :percentage="totalAssets > 0 ? Math.round((checkedCount / totalAssets) * 100) : 0" 
            :status="checkedCount === totalAssets ? 'success' : 'warning'"
            :stroke-width="6"
          />
        </div>
      </el-card>
      <el-card class="stat-card warning">
        <div class="stat-value">
          {{ unscannedCount }}
        </div>
        <div class="stat-label">
          Chưa quét QR
        </div>
        <div
          v-if="unscannedCount > 0"
          class="stat-hint"
        >
          <el-icon><Warning /></el-icon>
          Sẽ đánh dấu "Thiếu" khi nộp
        </div>
      </el-card>
    </div>

    <!-- Barcode Scanner Input -->
    <el-card
      v-if="round"
      class="scanner-card"
    >
      <div class="scanner-container">
        <div class="scanner-input-row">
          <el-input
            ref="scannerInputRef"
            v-model="scannedCode"
            placeholder="Quét mã QR/Barcode hoặc nhập mã tài sản (Enter để tìm)"
            :prefix-icon="Search"
            clearable
            size="large"
            class="scanner-input"
            @keyup.enter="handleScanCode"
            @clear="scannedCode = ''"
          >
            <template #append>
              <el-button
                :loading="scanning"
                type="primary"
                @click="handleScanCode"
              >
                <el-icon><Search /></el-icon>
                Tìm
              </el-button>
            </template>
          </el-input>
          <el-button 
            :icon="Camera" 
            type="success" 
            size="large" 
            class="camera-btn"
            :disabled="scanning"
            @click="openCameraScanner"
          >
            Mở Camera
          </el-button>
        </div>
        <div class="scanner-hint">
          <el-icon><InfoFilled /></el-icon>
          <span v-if="hasScannableAssets">
            Quét mã QR/Barcode trên tài sản để kiểm kê nhanh. Nhấn "Mở Camera" để quét từ điện thoại.
            <strong>Lưu ý:</strong> Tài sản có đơn vị tính m², ha, km² không cần quét QR, vui lòng kiểm kê thủ công.
          </span>
          <span v-else>
            <strong>Lưu ý:</strong> Tất cả tài sản trong danh sách có đơn vị tính là diện tích (m², ha, km²) nên không cần quét mã QR. 
            Vui lòng kiểm kê thủ công bằng cách click vào từng tài sản trong danh sách.
          </span>
        </div>
      </div>
    </el-card>

    <!-- Camera Scanner Dialog -->
    <el-dialog
      v-model="showCameraDialog"
      title="Quét QR Code từ Camera"
      width="90%"
      :close-on-click-modal="false"
      class="camera-dialog"
      @close="stopCameraScanner"
    >
      <div class="camera-scanner-container">
        <div
          :id="'qr-reader'"
          :key="cameraKey"
          class="qr-reader"
        />
        <div
          v-if="cameraScanning"
          class="camera-status"
        >
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>Đang quét QR code...</span>
        </div>
        <div
          v-if="cameraError"
          class="camera-error"
        >
          <el-alert
            type="error"
            :closable="false"
            show-icon
          >
            <template #title>
              <div style="white-space: pre-line;">
                {{ cameraError }}
              </div>
            </template>
          </el-alert>
        </div>
      </div>
      <template #footer>
        <el-button @click="stopCameraScanner">
          Đóng
        </el-button>
        <el-button
          v-if="hasMultipleCameras"
          type="primary"
          @click="switchCamera"
        >
          Đổi Camera
        </el-button>
      </template>
    </el-dialog>

    <!-- Asset List for Inventory -->
    <el-card class="asset-list-card">
      <template #header>
        <div class="card-header">
          <span>Danh sách tài sản cần kiểm kê</span>
          <div class="filter-actions">
            <el-input
              v-model="searchText"
              placeholder="Tìm kiếm tài sản..."
              :prefix-icon="Search"
              clearable
              style="width: 250px"
            />
            <el-select
              v-model="filterStatus"
              placeholder="Lọc trạng thái"
              clearable
              style="width: 150px"
            >
              <el-option
                label="Chưa kiểm"
                value="unchecked"
              />
              <el-option
                label="Đã kiểm"
                value="checked"
              />
              <el-option
                label="Khớp"
                value="matched"
              />
              <el-option
                label="Thiếu"
                value="missing"
              />
              <el-option
                label="Cần sửa"
                value="needs_repair"
              />
              <el-option
                label="Hỏng"
                value="damaged"
              />
              <el-option
                label="Chờ thanh lý"
                value="pending_disposal"
              />
            </el-select>
          </div>
        </div>
      </template>

      <div class="responsive-table">
        <el-table
          v-loading="loading"
          :data="filteredAssets"
          stripe
          @row-click="handleRowClick"
        >
          <el-table-column
            type="index"
            label="STT"
            width="60"
            align="center"
          />
          <el-table-column
            prop="asset_code"
            label="Mã tài sản"
            width="120"
          />
          <el-table-column
            prop="category_code"
            label="Mã loại TS"
            width="100"
          />
          <el-table-column
            prop="name"
            label="Tên tài sản"
            min-width="200"
          >
            <template #default="{ row }">
              {{ row.name }}
              <el-tag
                v-if="row.status === 'pending_disposal'"
                type="danger"
                size="small"
                style="margin-left: 4px"
              >
                Chờ thanh lý
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="unit"
            label="ĐVT"
            width="80"
            align="center"
          >
            <template #default="{ row }">
              <span>{{ row.unit || '-' }}</span>
              <el-tag
                v-if="!canScanAsset(row)"
                type="info"
                size="small"
                style="margin-left: 4px"
              >
                Không QR
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="SL sổ sách"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              {{ row.quantity || 1 }}
            </template>
          </el-table-column>
          <el-table-column
            label="SL thực tế"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <span
                v-if="row.inventory_detail"
                :class="getQuantityClass(row)"
              >
                {{ row.inventory_detail.actual_quantity }}
              </span>
              <span
                v-else
                class="text-muted"
              >-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="Chênh lệch"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <span
                v-if="row.inventory_detail"
                :class="getDifferenceClass(row)"
              >
                {{ formatDifference(getCalculatedDifference(row)) }}
              </span>
              <span
                v-else
                class="text-muted"
              >-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="Nguyên giá"
            width="130"
            align="right"
          >
            <template #default="{ row }">
              {{ formatCurrency(row.original_value) }}
            </template>
          </el-table-column>
          <el-table-column
            label="Giá trị còn lại"
            width="130"
            align="right"
          >
            <template #default="{ row }">
              {{ formatCurrency(row.current_value) }}
            </template>
          </el-table-column>
          <el-table-column
            label="Tình trạng"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                v-if="row.inventory_detail"
                :type="getConditionType(row.inventory_detail.asset_condition)"
                size="small"
              >
                {{ getConditionLabel(row.inventory_detail.asset_condition) }}
              </el-tag>
              <span
                v-else
                class="text-muted"
              >-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="Kết quả"
            width="130"
            align="center"
          >
            <template #default="{ row }">
              <div v-if="row.inventory_detail">
                <el-tag
                  :type="getStatusType(row.inventory_detail.check_status)"
                  size="small"
                >
                  {{ getCheckStatusLabel(row.inventory_detail.check_status) }}
                </el-tag>
                <el-tag
                  v-if="row.inventory_detail.scan_method === 'manual_confirm'"
                  type="warning"
                  size="small"
                  style="margin-top: 2px; display: block;"
                  title="Xác nhận thủ công — QR không quét được"
                >
                  ⚠️ Thủ công
                </el-tag>
              </div>
              <el-tag
                v-else
                type="info"
                size="small"
              >
                Chưa kiểm
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- Kiểm kê theo nhóm (bạch items) -->
    <el-card
      v-if="batchGroups.length > 0"
      style="margin-top: 16px;"
    >
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-weight:600;">
            <el-icon style="margin-right:6px;vertical-align:-2px;"><Box /></el-icon>
            Kiểm kê theo nhóm — Công cụ dụng cụ
          </span>
          <div>
            <el-tag
              v-if="batchUnconfirmedCount > 0"
              type="warning"
              style="margin-right:8px;"
            >
              {{ batchUnconfirmedCount }} nhóm chưa xác nhận
            </el-tag>
            <el-tag
              v-else
              type="success"
            >
              Đã xác nhận hết
            </el-tag>
          </div>
        </div>
      </template>
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom:12px;"
        description="Tài sản dạng công cụ dụng cụ được kiểm kê theo nhóm. Chỉ cần đếm tổng số lượng rồi nhấn Xác nhận — không cần quét QR từng món."
      />
      <el-table
        :data="batchGroups"
        border
        stripe
      >
        <el-table-column
          prop="category_code"
          label="Mã loại"
          width="110"
        />
        <el-table-column
          prop="category_name"
          label="Tên danh mục"
          min-width="200"
        />
        <el-table-column
          prop="unit"
          label="ĐVT"
          width="70"
          align="center"
        />
        <el-table-column
          label="SL sổ sách"
          prop="book_quantity"
          width="105"
          align="center"
        />
        <el-table-column
          label="SL thực tế"
          width="140"
          align="center"
        >
          <template #default="{ row }">
            <el-input-number
              v-model="batchInputs[row.category_id].actual_quantity"
              :min="0"
              :max="row.book_quantity + 50"
              size="small"
              style="width:108px;"
              :disabled="row.confirmed"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="Tình trạng"
          width="158"
        >
          <template #default="{ row }">
            <el-select
              v-model="batchInputs[row.category_id].condition"
              size="small"
              :disabled="row.confirmed"
            >
              <el-option value="good" label="Đang dùng tốt" />
              <el-option value="usable" label="Còn dùng được" />
              <el-option value="needs_repair" label="Cần sửa" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column
          label="Ghi chú"
          min-width="130"
        >
          <template #default="{ row }">
            <el-input
              v-model="batchInputs[row.category_id].notes"
              size="small"
              :disabled="row.confirmed"
              placeholder="Ghi chú..."
            />
          </template>
        </el-table-column>
        <el-table-column
          label="Kết quả"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.confirmed"
              type="success"
              size="small"
            >
              Đã xác nhận
            </el-tag>
            <el-tag
              v-else
              type="info"
              size="small"
            >
              Chưa kiểm
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          width="100"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="!row.confirmed"
              type="primary"
              size="small"
              :loading="batchSaving === row.category_id"
              @click="confirmBatchGroup(row)"
            >
              Xác nhận
            </el-button>
            <el-button
              v-else
              size="small"
              @click="resetBatchGroup(row)"
            >
              Sửa lại
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Check Asset Dialog -->
    <el-dialog
      v-model="showCheckDialog"
      title="Kiểm kê tài sản"
      width="600"
      @close="onCheckDialogClose"
    >
      <div
        v-if="selectedAsset"
        class="check-dialog-content"
      >
        <div class="asset-info">
          <el-descriptions
            :column="2"
            border
          >
            <el-descriptions-item label="Mã tài sản">
              {{ selectedAsset.asset_code }}
            </el-descriptions-item>
            <el-descriptions-item label="Mã loại">
              {{ selectedAsset.category_code }}
            </el-descriptions-item>
            <el-descriptions-item
              label="Tên tài sản"
              :span="2"
            >
              {{ selectedAsset.name }}
            </el-descriptions-item>
            <el-descriptions-item label="Đơn vị tính">
              {{ selectedAsset.unit || 'Cái' }}
            </el-descriptions-item>
            <el-descriptions-item label="SL theo sổ sách">
              {{ selectedAsset.quantity || 1 }}
            </el-descriptions-item>
            <el-descriptions-item label="Nguyên giá">
              {{ formatCurrency(selectedAsset.original_value) }}
            </el-descriptions-item>
            <el-descriptions-item label="Giá trị còn lại">
              {{ formatCurrency(selectedAsset.current_value) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-divider>Kết quả kiểm kê</el-divider>

        <!-- Thông báo tài sản chờ thanh lý -->
        <el-alert
          v-if="selectedAsset && selectedAsset.status === 'pending_disposal'"
          type="error"
          :closable="false"
          style="margin-bottom: 16px"
          show-icon
        >
          <template #title>
            <strong>⚠️ Tài sản đang chờ thanh lý / tiêu hủy</strong>
          </template>
          <p style="margin: 4px 0 0 0; color: #606266; font-size: 13px">
            Tài sản này đã được đề nghị thanh lý (chi phí sửa chữa vượt quá giá trị). Kết quả kiểm kê sẽ tự động đưa vào danh sách đề nghị thanh lý.
          </p>
        </el-alert>

        <!-- Thông báo cho tài sản đã quét QR -->
        <el-alert
          v-if="selectedAsset && canScanAsset(selectedAsset) && selectedAsset.inventory_detail && !isManualConfirm"
          type="success"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #title>
            <strong>✓ Tài sản đã được quét QR - Chắc chắn còn tồn tại và khớp với sổ sách</strong>
          </template>
          <p style="margin: 8px 0 0 0; color: #606266;">
            Số lượng và kết quả kiểm kê đã được xác nhận khi quét QR, không thể chỉnh sửa. 
            Bạn chỉ có thể chỉnh sửa <strong>tình trạng tài sản</strong> (tốt, cần sửa, hỏng...).
          </p>
        </el-alert>

        <!-- Xác nhận thủ công - QR không quét được -->
        <el-alert
          v-if="isManualConfirm && selectedAsset && !selectedAsset.inventory_detail"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #title>
            <strong>⚠️ Xác nhận thủ công — Mã QR không quét được</strong>
          </template>
          <p style="margin: 8px 0 0 0; color: #606266;">
            Hành động này được ghi lại để kiểm tra. Vui lòng chọn lý do bên dưới.
            Số lượng sẽ tự động khớp với sổ sách. Chỉ cần xác nhận tình trạng tài sản.
          </p>
        </el-alert>

        <!-- Xác nhận thủ công - hiện thị khi đã có inventory_detail có scan_method = manual_confirm -->
        <el-alert
          v-if="selectedAsset && selectedAsset.inventory_detail && selectedAsset.inventory_detail.scan_method === 'manual_confirm'"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #title>
            <strong>⚠️ Tài sản này được xác nhận thủ công (QR không quét được)</strong>
          </template>
          <p style="margin: 8px 0 0 0; color: #606266;">
            Lý do: {{ manualReasonOptions.find(o => o.value === selectedAsset.inventory_detail?.manual_reason)?.label || selectedAsset.inventory_detail?.manual_reason || 'Không rõ' }}
          </p>
        </el-alert>

        <!-- Thông báo cho tài sản chưa quét QR (không nên xảy ra nhưng để phòng) -->
        <el-alert
          v-if="selectedAsset && canScanAsset(selectedAsset) && !selectedAsset.inventory_detail && !isManualConfirm"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #title>
            <span>Tài sản này có mã QR. Vui lòng quét mã QR trước khi kiểm kê.</span>
          </template>
        </el-alert>

        <el-form
          :model="checkForm"
          label-width="140px"
        >
          <el-form-item
            label="Số lượng thực tế"
            required
          >
            <el-input-number 
              v-model="checkForm.actual_quantity" 
              :min="0" 
              :max="999999" 
              :precision="canScanAsset(selectedAsset) ? 0 : 2"
              :step="canScanAsset(selectedAsset) ? 1 : 0.01"
              :disabled="selectedAsset && canScanAsset(selectedAsset) && selectedAsset.inventory_detail"
            />
            <span
              v-if="selectedAsset && !canScanAsset(selectedAsset)"
              class="hint"
              style="margin-left: 10px"
            >
              (Tài sản diện tích - có thể nhập số thập phân)
            </span>
            <span
              v-if="selectedAsset && canScanAsset(selectedAsset) && selectedAsset.inventory_detail"
              class="hint"
              style="margin-left: 10px; color: #909399"
            >
              (Đã quét QR - Số lượng không thể chỉnh sửa)
            </span>
          </el-form-item>
          <el-form-item
            label="Tình trạng tài sản"
            required
          >
            <el-select
              v-model="checkForm.asset_condition"
              style="width: 100%"
            >
              <el-option
                value="good"
                label="0 - Tốt: Còn sử dụng được và đang sử dụng"
              />
              <el-option
                value="usable"
                label="1 - Sử dụng được: Còn sử dụng được nhưng chưa sử dụng"
              />
              <el-option
                value="needs_repair"
                label="2 - Cần sửa chữa: Còn sửa được → Đưa vào quy trình sửa chữa"
              />
              <el-option
                value="damaged"
                label="3 - Hỏng nặng: Sửa KHÔNG được → Đưa vào thanh lý"
              />
            </el-select>
            <div style="margin-top: 8px; font-size: 12px; color: #909399; line-height: 1.5;">
              <strong>Lưu ý:</strong> 
              <ul style="margin: 4px 0 0 20px; padding: 0;">
                <li><strong>Cần sửa chữa</strong>: Tài sản còn giá trị sử dụng nếu sửa → Đưa vào quy trình sửa chữa/bảo dưỡng</li>
                <li><strong>Hỏng nặng</strong>: Tài sản hỏng không thể sửa hoặc chi phí sửa > giá trị → Đưa thẳng vào thanh lý</li>
              </ul>
            </div>
          </el-form-item>
          <el-form-item
            label="Kết quả kiểm kê"
            required
          >
            <el-select 
              v-model="checkForm.check_status" 
              style="width: 100%"
              :disabled="selectedAsset && canScanAsset(selectedAsset) && selectedAsset.inventory_detail"
            >
              <el-option
                value="matched"
                label="Khớp với sổ sách"
              />
              <el-option
                value="missing"
                label="Thiếu (không tìm thấy)"
              />
              <el-option
                value="damaged"
                label="Hư hỏng cần xử lý"
              />
            </el-select>
            <span
              v-if="selectedAsset && canScanAsset(selectedAsset) && selectedAsset.inventory_detail"
              class="hint"
              style="margin-left: 10px; color: #909399"
            >
              (Đã quét QR - Kết quả "Khớp" không thể chỉnh sửa, chỉ có thể chỉnh sửa tình trạng)
            </span>
          </el-form-item>
          <el-form-item label="Ghi chú">
            <el-input
              v-model="checkForm.notes"
              type="textarea"
              :rows="3"
              placeholder="Ghi chú thêm về tài sản..."
            />
          </el-form-item>
          <!-- Lý do không quét được QR: chỉ hiện khi xác nhận thủ công mới -->
          <el-form-item
            v-if="isManualConfirm && !selectedAsset?.inventory_detail"
            label="Lý do không quét QR"
            required
          >
            <el-select
              v-model="checkForm.manual_reason"
              placeholder="Chọn lý do..."
              style="width: 100%"
            >
              <el-option
                v-for="opt in manualReasonOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="() => { showCheckDialog = false; isFromScan = false; isManualConfirm = false; }">
          Hủy
        </el-button>
        <el-button
          type="primary"
          :loading="savingCheck"
          @click="saveCheck"
        >
          Lưu kết quả
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, DocumentCopy, Select, Search, InfoFilled, Camera, Loading, Calendar, Timer, OfficeBuilding, Warning, Box } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';
import inventoryService, { type InventoryRound, type InventoryReport } from '@/services/inventory.service';
import { assetService } from '@/services/asset.service';
import { assetCategoryService } from '@/services/assetCategory.service';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Data
const loading = ref(false);
const saving = ref(false);
const submitting = ref(false);
const savingCheck = ref(false);
const markingMissing = ref(false);

const round = ref<InventoryRound | null>(null);
const report = ref<InventoryReport | null>(null);
const assets = ref<any[]>([]);
const hasChanges = ref(false);

const searchText = ref('');
const filterStatus = ref('');

// ─── Batch tracking ──────────────────────────────────────────────────────────
const categoriesMap = ref<Map<number, any>>(new Map());
const batchInputs = ref<Record<number, { actual_quantity: number; condition: string; notes: string }>>({});
const batchSaving = ref<number | null>(null);
// ─────────────────────────────────────────────────────────────────────────────

// Barcode Scanner
const scannedCode = ref('');
const scanning = ref(false);
const scannerInputRef = ref();

// Camera Scanner
const showCameraDialog = ref(false);
const cameraScanning = ref(false);
const cameraError = ref('');
const html5QrCode = ref<Html5Qrcode | null>(null);
const hasMultipleCameras = ref(false);
const availableCameras = ref<any[]>([]);
const currentCameraIndex = ref(0);
const cameraKey = ref(0); // Thay đổi key = Vue xóa DOM và tạo lại hoàn toàn

// Check Dialog
const showCheckDialog = ref(false);
const selectedAsset = ref<any>(null);
const isFromScan = ref(false); // Track if dialog opened from QR scan
const isManualConfirm = ref(false); // QR not scannable → manual confirmation with audit trail
const manualReasonOptions = [
  { value: 'qr_faded', label: 'Mã QR bị mờ / rách / hỏng' },
  { value: 'inaccessible', label: 'Tài sản ở vị trí khó tiếp cận' },
  { value: 'scanner_error', label: 'Thiết bị quét lỗi / hết pin' },
  { value: 'other', label: 'Lý do khác' },
];
const checkForm = ref({
  actual_quantity: 1,
  asset_condition: 'good',
  check_status: 'matched',
  notes: '',
  manual_reason: '',
});

// Computed
const departmentName = computed(() => {
  return authStore.user?.department?.name || 'Chưa xác định';
});

const totalAssets = computed(() => assets.value.length);

const checkedCount = computed(() => {
  return assets.value.filter(a => a.inventory_detail).length;
});

const matchedCount = computed(() => {
  return assets.value.filter(a => a.inventory_detail?.check_status === 'matched').length;
});

const missingCount = computed(() => {
  return assets.value.filter(a => a.inventory_detail?.check_status === 'missing').length;
});

const needsRepairCount = computed(() => {
  return assets.value.filter(a => a.inventory_detail?.check_status === 'needs_repair').length;
});

const damagedCount = computed(() => {
  return assets.value.filter(a => a.inventory_detail?.check_status === 'damaged').length;
});

const canSubmit = computed(() => {
  // Cho phép submit khi draft hoặc bị từ chối (gửi lại)
  const canSubmitStatus = report.value?.status === 'draft' || 
                          report.value?.status === 'rejected_by_head' || 
                          report.value?.status === 'rejected_by_admin';
  return checkedCount.value > 0 && canSubmitStatus;
});

// Kiểm tra có tài sản chưa quét (có thể quét QR nhưng chưa được quét)
const hasUnscannedAssets = computed(() => {
  return assets.value.some(asset => {
    // Chỉ tính tài sản có thể quét QR
    if (!canScanAsset(asset)) return false;
    // Bỏ qua tài sản kiểm theo nhóm (batch)
    if (isBatchAsset(asset)) return false;
    // Chưa có inventory_detail hoặc chưa được đánh dấu
    return !asset.inventory_detail;
  });
});

// Số lượng tài sản chưa quét QR
const unscannedCount = computed(() => {
  return assets.value.filter(asset => {
    if (!canScanAsset(asset)) return false;
    if (isBatchAsset(asset)) return false; // batch handled separately
    return !asset.inventory_detail;
  }).length;
});

// Danh sách đơn vị tính không cần quét QR (tài sản diện tích, không đếm được)
const nonScannableUnits = ['m2', 'm²', 'ha', 'km2', 'km²', 'cm2', 'cm²'];

// Kiểm tra xem tài sản có thể quét QR không
const canScanAsset = (asset: any) => {
  if (!asset || !asset.unit) return true; // Nếu không có unit, cho phép quét
  const unit = asset.unit.toLowerCase().trim();
  return !nonScannableUnits.includes(unit);
};

// Kiểm tra có tài sản nào có thể quét QR không
const hasScannableAssets = computed(() => {
  return assets.value.some(asset => canScanAsset(asset) && !isBatchAsset(asset));
});

// ─── Batch computed / methods ─────────────────────────────────────────────────
const isBatchAsset = (asset: any): boolean => {
  if (!asset?.category_id) return false;
  return categoriesMap.value.get(asset.category_id)?.tracking_type === 'batch';
};

const batchGroups = computed(() => {
  const groups = new Map<number, {
    category_id: number; category_name: string; category_code: string;
    unit: string; book_quantity: number; assets: any[]; confirmed: boolean;
  }>();

  for (const asset of assets.value) {
    if (!isBatchAsset(asset)) continue;
    const catId = asset.category_id;
    if (!catId) continue;
    const cat = categoriesMap.value.get(catId);
    if (!groups.has(catId)) {
      if (!batchInputs.value[catId]) {
        batchInputs.value[catId] = { actual_quantity: 0, condition: 'good', notes: '' };
      }
      groups.set(catId, {
        category_id: catId,
        category_name: cat?.name || asset.category || 'Không rõ',
        category_code: asset.category_code || cat?.code || '',
        unit: asset.unit || cat?.unit || 'Cái',
        book_quantity: 0,
        assets: [],
        confirmed: false,
      });
    }
    const group = groups.get(catId)!;
    group.book_quantity += (asset.quantity || 1);
    group.assets.push(asset);
  }

  for (const group of groups.values()) {
    group.confirmed = group.assets.length > 0 && group.assets.every(a => !!a.inventory_detail);
    if (group.confirmed && batchInputs.value[group.category_id]?.actual_quantity === 0) {
      batchInputs.value[group.category_id].actual_quantity =
        group.assets.reduce((s, a) => s + (a.inventory_detail?.actual_quantity ?? 0), 0);
    }
  }
  return Array.from(groups.values());
});

const batchUnconfirmedCount = computed(() => batchGroups.value.filter(g => !g.confirmed).length);

const confirmBatchGroup = async (group: { category_id: number; category_name: string; book_quantity: number; assets: any[]; unit: string }) => {
  const input = batchInputs.value[group.category_id];
  if (!input || input.actual_quantity === undefined || input.actual_quantity < 0) {
    ElMessage.warning('Vui lòng nhập số lượng thực tế (được phép là 0)');
    return;
  }
  batchSaving.value = group.category_id;
  try {
    let remaining = Math.round(input.actual_quantity);
    for (const asset of group.assets) {
      const bookQty = asset.quantity || 1;
      const isMatched = remaining > 0;
      const actualQty = isMatched ? Math.min(bookQty, remaining) : 0;
      if (isMatched) remaining -= actualQty;
      const checkData = {
        actual_quantity: actualQty,
        check_status: isMatched ? 'matched' : 'missing',
        asset_condition: input.condition,
        notes: (input.notes ? input.notes + ' — ' : '') + 'Kiểm theo nhóm',
        suggest_repair: input.condition === 'needs_repair',
        suggest_disposal: false,
      };
      await inventoryService.saveCheck(report.value!.id, asset.id, checkData);
      asset.inventory_detail = { ...checkData };
    }
    const missing = group.book_quantity - Math.round(input.actual_quantity);
    ElMessage.success(
      missing > 0
        ? `Nhóm “${group.category_name}”: ${input.actual_quantity}/${group.book_quantity} — thiếu ${missing} ${group.unit}`
        : `Nhóm “${group.category_name}”: đủ ${input.actual_quantity}/${group.book_quantity}`
    );
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || 'Lỗi khi xác nhận nhóm');
  } finally {
    batchSaving.value = null;
  }
};

const resetBatchGroup = (group: { category_id: number; assets: any[] }) => {
  for (const asset of group.assets) asset.inventory_detail = null;
  batchInputs.value[group.category_id].actual_quantity = 0;
};

const loadCategories = async () => {
  try {
    const res = await assetCategoryService.getAll(true);
    const map = new Map<number, any>();
    for (const cat of res.data) {
      map.set(cat.id, cat);
      if (cat.tracking_type === 'batch' && !batchInputs.value[cat.id]) {
        batchInputs.value[cat.id] = { actual_quantity: 0, condition: 'good', notes: '' };
      }
    }
    categoriesMap.value = map;
  } catch {
    // non-critical — batch section just won’t appear if categories fail to load
  }
};
// ─── End batch ────────────────────────────────────────────────────────────────

const filteredAssets = computed(() => {
  // Exclude batch assets — they appear in the batch section below
  let result = assets.value.filter(a => !isBatchAsset(a));

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(a => 
      a.name?.toLowerCase().includes(search) ||
      a.asset_code?.toLowerCase().includes(search) ||
      a.category_code?.toLowerCase().includes(search)
    );
  }

  if (filterStatus.value) {
    if (filterStatus.value === 'unchecked') {
      result = result.filter(a => !a.inventory_detail);
    } else if (filterStatus.value === 'checked') {
      result = result.filter(a => a.inventory_detail);
    } else if (filterStatus.value === 'pending_disposal') {
      result = result.filter(a => a.status === 'pending_disposal');
    } else {
      result = result.filter(a => a.inventory_detail?.check_status === filterStatus.value);
    }
  }

  return result;
});

// Methods
const goBack = () => {
  router.push('/inventory');
};

const fetchData = async () => {
  loading.value = true;
  try {
    const roundId = route.query.round_id as string | undefined;
    const reportId = route.query.report_id as string | undefined;

    // Validate that we have at least one ID
    if (!roundId && !reportId) {
      ElMessage.error('Thiếu thông tin đợt kiểm kê hoặc báo cáo. Vui lòng quay lại trang danh sách.');
      router.push('/inventory');
      return;
    }

    // Validate department
    if (!authStore.user?.department_id) {
      ElMessage.error('Bạn chưa được phân công vào phòng ban nào');
      router.push('/inventory');
      return;
    }

    if (reportId) {
      // Continue existing report
      try {
        const parsedReportId = parseInt(reportId);
        if (isNaN(parsedReportId)) {
          ElMessage.error('Mã báo cáo không hợp lệ');
          router.push('/inventory');
          return;
        }
        
        report.value = await inventoryService.getReportById(parsedReportId);
        if (!report.value) {
          throw new Error('Không tìm thấy báo cáo');
        }
        
        // Determine which round_id to use - prioritize query param, fallback to report.round_id, then try active round
        let targetRoundId: number | null = null;
        
        // First, try to use roundId from query params (most reliable)
        if (roundId) {
          const parsedRoundId = parseInt(roundId);
          if (!isNaN(parsedRoundId) && parsedRoundId > 0) {
            targetRoundId = parsedRoundId;
          }
        }
        
        // If no valid roundId from query, try report.round_id
        if (!targetRoundId) {
          if (report.value.round_id && !isNaN(report.value.round_id) && report.value.round_id > 0) {
            targetRoundId = report.value.round_id;
          }
        }
        
        // If we still don't have a valid round_id, try to get active round as last resort
        if (!targetRoundId) {
          try {
            const activeRound = await inventoryService.getActiveRound();
            if (activeRound && activeRound.id) {
              // Verify that the active round is still in progress
              if (activeRound.status === 'in_progress') {
                targetRoundId = activeRound.id;
                // Sử dụng console.info thay vì console.warn để không làm người dùng lo lắng
                console.info('Báo cáo thiếu round_id, đã tự động khôi phục từ đợt kiểm kê đang hoạt động:', targetRoundId);
                ElMessage.warning({
                  message: 'Báo cáo thiếu thông tin đợt kiểm kê, đã tự động sử dụng đợt kiểm kê đang hoạt động',
                  duration: 5000,
                  showClose: true
                });
              } else {
                console.warn('Đợt kiểm kê đang hoạt động đã hoàn thành, không thể sử dụng');
              }
            }
          } catch (activeRoundError) {
            console.warn('Không thể lấy đợt kiểm kê đang hoạt động:', activeRoundError);
          }
        }
        
        // Final check - if still no valid round_id, we cannot proceed
        if (!targetRoundId) {
          throw new Error('Báo cáo không có thông tin đợt kiểm kê hợp lệ và không tìm thấy đợt kiểm kê đang hoạt động. Vui lòng quay lại và chọn đợt kiểm kê từ danh sách.');
        }
        
        // Fetch round using the determined round_id
        try {
          round.value = await inventoryService.getRoundById(targetRoundId);
          if (!round.value) {
            throw new Error('Không tìm thấy đợt kiểm kê với ID: ' + targetRoundId);
          }
          
          // Log recovery information for debugging
          if (!report.value.round_id || report.value.round_id !== targetRoundId) {
            if (roundId && report.value.round_id && report.value.round_id !== targetRoundId) {
              console.warn('Báo cáo có round_id khác với query param, sử dụng round_id từ query param');
            } else if (!report.value.round_id) {
              console.info('Đã khôi phục round_id cho báo cáo từ:', 
                roundId ? 'query param' : 'active round', 
                'round_id:', targetRoundId);
            }
          }
        } catch (roundError: any) {
          console.error('Error fetching round:', roundError);
          // If we got targetRoundId from active round but fetch failed, 
          // the round might have been deleted or is invalid
          throw new Error('Không thể tải thông tin đợt kiểm kê: ' + (roundError.message || 'Lỗi không xác định'));
        }
      } catch (error: any) {
        console.error('Error fetching report:', error);
        ElMessage.error(error.response?.data?.message || error.message || 'Không thể tải thông tin báo cáo');
        router.push('/inventory');
        return;
      }
    } else if (roundId) {
      // Start new report - validate roundId first
      const parsedRoundId = parseInt(roundId);
      if (isNaN(parsedRoundId)) {
        ElMessage.error('Mã đợt kiểm kê không hợp lệ');
        router.push('/inventory');
        return;
      }

      try {
        // Fetch round first
        round.value = await inventoryService.getRoundById(parsedRoundId);
        if (!round.value) {
          throw new Error('Không tìm thấy đợt kiểm kê');
        }

        // Check if round is still active
        if (round.value.status === 'completed') {
          ElMessage.warning('Đợt kiểm kê này đã hoàn thành');
          router.push('/inventory');
          return;
        }

        // Create or get existing report
        try {
          const existingReports = await inventoryService.getReports({
            round_id: parsedRoundId,
            department_id: authStore.user.department_id,
            limit: 1,
          });
          
          if (existingReports.data && existingReports.data.length > 0) {
            report.value = existingReports.data[0];
          } else {
            // Create new report
            report.value = await inventoryService.createReport({
              round_id: parsedRoundId,
              department_id: authStore.user.department_id,
            });
          }
        } catch (error: any) {
          console.error('Error getting/creating report:', error);
          ElMessage.error(error.response?.data?.message || 'Không thể tạo báo cáo kiểm kê');
          // Don't return here, we can still show the round info
        }
      } catch (error: any) {
        console.error('Error fetching round:', error);
        ElMessage.error(error.response?.data?.message || 'Không thể tải thông tin đợt kiểm kê');
        router.push('/inventory');
        return;
      }
    }

    // Fetch assets for inventory - only if we have both round and report
    if (round.value && report.value) {
      // Validate round.id before fetching assets
      if (!round.value.id || isNaN(round.value.id) || round.value.id <= 0) {
        ElMessage.error('Thông tin đợt kiểm kê không hợp lệ');
        assets.value = [];
        return;
      }
      
      // Validate department_id
      if (!authStore.user?.department_id) {
        ElMessage.error('Bạn chưa được phân công vào phòng ban nào');
        assets.value = [];
        return;
      }
      
      try {
        // Load tất cả tài sản cho kiểm kê (không giới hạn số lượng)
        const assetsData = await inventoryService.getAssetsForInventory({
          department_id: authStore.user.department_id,
          round_id: round.value.id,
          limit: 10000, // Load tất cả tài sản (giới hạn tối đa 10000)
        });
        
        // Merge with existing inventory details
        if (report.value.details && Array.isArray(report.value.details)) {
          const detailsMap = new Map(report.value.details.map((d: any) => [d.asset_id, d]));
          assets.value = assetsData.map(asset => ({
            ...asset,
            inventory_detail: detailsMap.get(asset.id) || null,
          }));
        } else {
          assets.value = assetsData.map(asset => ({ ...asset, inventory_detail: null }));
        }
      } catch (error: any) {
        console.error('Error fetching assets:', error);
        ElMessage.error(error.response?.data?.message || 'Không thể tải danh sách tài sản');
        // Set empty array to prevent further errors
        assets.value = [];
      }
    } else {
      // If we don't have both, show empty state
      assets.value = [];
      if (!round.value) {
        ElMessage.warning('Không tìm thấy thông tin đợt kiểm kê');
      }
      if (!report.value) {
        ElMessage.warning('Chưa có báo cáo kiểm kê. Vui lòng thử lại.');
      }
    }
  } catch (error: any) {
    console.error('Error fetching data:', error);
    ElMessage.error(error.response?.data?.message || 'Không thể tải dữ liệu kiểm kê');
    // Redirect to inventory list on critical error
    setTimeout(() => {
      router.push('/inventory');
    }, 2000);
  } finally {
    loading.value = false;
  }
};

// Xử lý click vào row trong bảng
const handleRowClick = (row: any) => {
  const isAreaAsset = !canScanAsset(row);
  
  // Tài sản diện tích (m²): luôn cho phép mở dialog để kiểm kê thủ công
  if (isAreaAsset) {
    openCheckDialog(row, false);
    return;
  }
  
  // Tài sản có QR: chỉ cho phép mở dialog nếu đã quét QR (để chỉnh sửa tình trạng)
  if (row.inventory_detail) {
    // Đã quét QR rồi → cho phép chỉnh sửa tình trạng
    openCheckDialog(row, false);
  } else {
    // Chưa quét QR → hỏi người dùng: quét QR hay xác nhận thủ công
    ElMessageBox.confirm(
      `Tài sản "${row.name || row.asset_code}" chưa được quét QR. Bạn muốn làm gì?`,
      'Chọn phương thức kiểm kê',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: 'QR không quét được — Xác nhận thủ công',
        cancelButtonText: 'Quét mã QR',
        type: 'warning',
      }
    ).then(() => {
      // confirmButton: QR không quét được → mở dialog xác nhận thủ công
      openCheckDialog(row, false, true);
    }).catch((action: string) => {
      if (action === 'cancel') {
        // cancelButton: focus về ô quét QR
        nextTick(() => { scannerInputRef.value?.focus(); });
      }
      // close (X) → không làm gì
    });
  }
};

const openCheckDialog = (row: any, fromScan: boolean = false, manualConfirm: boolean = false) => {
  selectedAsset.value = row;
  isFromScan.value = fromScan;
  isManualConfirm.value = manualConfirm;
  
  if (row.inventory_detail) {
    // Đã có kết quả kiểm kê → cho phép chỉnh sửa
    checkForm.value = {
      actual_quantity: row.inventory_detail.actual_quantity,
      asset_condition: row.inventory_detail.asset_condition,
      check_status: row.inventory_detail.check_status,
      notes: row.inventory_detail.notes || '',
      manual_reason: row.inventory_detail.manual_reason || '',
    };
  } else {
    // Chưa có kết quả kiểm kê
    const isAreaAsset = !canScanAsset(row);
    // Manual confirm: use book quantity; area asset: use book quantity; otherwise default 1
    const defaultQuantity = (manualConfirm || isAreaAsset) ? (row.quantity || 1) : 1;
    
    checkForm.value = {
      actual_quantity: defaultQuantity,
      asset_condition: row.status === 'pending_disposal' ? 'damaged' : 'good',
      check_status: 'matched',
      notes: row.status === 'pending_disposal' ? 'Tài sản chờ thanh lý - đề nghị đưa vào hồ sơ thanh lý trong đợt này' : '',
      manual_reason: '',
    };
  }
  showCheckDialog.value = true;
};

const handleScanCode = async () => {
  if (!scannedCode.value.trim()) {
    ElMessage.warning('Vui lòng nhập hoặc quét mã tài sản');
    return;
  }

  scanning.value = true;
  try {
    const scannedValue = scannedCode.value.trim();
    let assetData: any;

    // Thử decode như QR code JSON trước
    try {
      const qrData = JSON.parse(scannedValue);
      if (qrData.asset_code) {
        // Đây là QR code JSON, sử dụng decode API
        const decodeResult = await assetService.decodeQRCode(scannedValue);
        assetData = decodeResult.data?.asset;
        
        // Validate số lượng từ QR code
        if (qrData.quantity !== 1) {
          ElMessage.warning({
            message: `Cảnh báo: QR code có số lượng ${qrData.quantity}, nhưng hệ thống chỉ hỗ trợ số lượng = 1`,
            duration: 2000,
            showClose: true,
            offset: 60
          });
        }
        
        // Không hiển thị thông báo ở đây để tránh che camera
        // Thông báo sẽ hiển thị sau khi save thành công
      } else {
        throw new Error('Invalid QR code format');
      }
    } catch {
      // Không phải JSON - có thể là URL format (https://domain/scan/ASSET_CODE) hoặc mã thô
      let codeToLookup = scannedValue;
      if (scannedValue.startsWith('http://') || scannedValue.startsWith('https://')) {
        const urlParts = scannedValue.split('/');
        const scanIndex = urlParts.indexOf('scan');
        codeToLookup = scanIndex !== -1 && urlParts[scanIndex + 1]
          ? urlParts[scanIndex + 1]
          : urlParts[urlParts.length - 1];
      }
      assetData = await inventoryService.findAssetByCode(codeToLookup);
    }
    
    // Kiểm tra xem tài sản có cần quét QR không
    if (!canScanAsset(assetData)) {
      const unit = assetData.unit || 'm2';
      ElMessage.warning({
        message: `Tài sản có đơn vị tính "${unit}" không cần quét QR. Vui lòng kiểm kê thủ công.`,
        duration: 3000,
        showClose: true,
        offset: 60
      });
      // Vẫn mở dialog để người dùng có thể kiểm kê thủ công
    }
    
    // Tìm tài sản trong danh sách assets hiện tại
    let foundAsset = assets.value.find(a => a.id === assetData.id);
    
    if (!foundAsset) {
      // Nếu không tìm thấy trong danh sách, thêm vào
      foundAsset = {
        ...assetData,
        inventory_detail: null,
      };
      assets.value.push(foundAsset);
    }
    
    // Đảm bảo quantity = 1
    if (foundAsset.quantity !== 1) {
      foundAsset.quantity = 1;
    }
    
    // Kiểm tra xem tài sản có thể quét QR không
    const canScan = canScanAsset(foundAsset);
    
    // Nếu tài sản có thể quét QR và quét thành công → tự động lưu với trạng thái "Khớp"
    if (canScan) {
      // Tự động lưu kết quả kiểm kê với trạng thái "Khớp"
      if (!report.value) {
        ElMessage.error('Không tìm thấy báo cáo kiểm kê');
        scannedCode.value = '';
        return;
      }
      
      try {
        // Lấy số lượng từ tài sản (thường là 1 cho tài sản có QR)
        const bookQuantity = foundAsset.quantity || 1;
        
        // Khi quét QR thành công → tự động lưu với trạng thái "Khớp" và số lượng = sổ sách
        // Đây là bằng chứng chắc chắn tài sản còn tồn tại, không thể chỉnh sửa số lượng và kết quả
        // Chỉ có thể chỉnh sửa tình trạng tài sản (tốt, cần sửa, hỏng...)
        // Giá trị thực tế không cần nhập vì hao mòn đã được tính tự động theo năm
        const autoSaveData = {
          asset_id: foundAsset.id,
          actual_quantity: bookQuantity, // Phải = số lượng sổ sách (chứng minh tài sản còn tồn tại)
          asset_condition: 'good', // Mặc định: Tốt - Còn sử dụng được và đang sử dụng
          check_status: 'matched', // Chắc chắn khớp với sổ sách (đã quét QR = tài sản còn tồn tại)
          scan_method: 'qr_scan', // Phương thức: quét mã QR
          notes: 'Đã quét QR code - Tài sản còn tồn tại tại đơn vị. Số lượng và kết quả kiểm kê không thể chỉnh sửa.',
        };
        
        let detail;
        if (foundAsset.inventory_detail) {
          // Update existing
          detail = await inventoryService.updateDetail(
            report.value.id,
            foundAsset.inventory_detail.id,
            autoSaveData
          );
        } else {
          // Add new
          detail = await inventoryService.addDetail(report.value.id, autoSaveData);
        }
        
        // Update local state
        const index = assets.value.findIndex(a => a.id === foundAsset.id);
        if (index !== -1) {
          assets.value[index].inventory_detail = detail;
        }
        
        hasChanges.value = true;
          ElMessage.success({
            message: `✓ ${foundAsset.name || foundAsset.asset_code} - Khớp sổ sách`,
            duration: 2000,
            showClose: true,
            offset: 60
          });
      } catch (error: any) {
        console.error('Error auto-saving scan result:', error);
        // Nếu lỗi, mở dialog để người dùng nhập thủ công
        openCheckDialog(foundAsset, true);
      }
    } else {
      // Tài sản không cần quét QR → mở dialog để nhập thủ công
      openCheckDialog(foundAsset, true);
    }
    
    // Xóa mã đã quét và focus lại input
    scannedCode.value = '';
    await nextTick();
    scannerInputRef.value?.focus();
    
  } catch (error: any) {
    ElMessage.error({
      message: error.response?.data?.message || 'Không tìm thấy tài sản với mã này',
      duration: 2000,
      showClose: true,
      offset: 60
    });
    // Xóa mã và focus lại input
    scannedCode.value = '';
    await nextTick();
    scannerInputRef.value?.focus();
  } finally {
    scanning.value = false;
  }
};

const saveCheck = async () => {
  if (!report.value || !selectedAsset.value) return;

  const isAreaAsset = !canScanAsset(selectedAsset.value);
  const isScannedAsset = !isAreaAsset && selectedAsset.value.inventory_detail;

  // Validate manual confirm: require a reason
  if (isManualConfirm.value && !selectedAsset.value.inventory_detail && !checkForm.value.manual_reason) {
    ElMessage.error('Vui lòng chọn lý do không quét được mã QR');
    return;
  }

  savingCheck.value = true;
  try {
    // Với tài sản đã quét QR: chỉ cho phép cập nhật tình trạng, giữ nguyên số lượng và kết quả
    const isPendingDisposal = selectedAsset.value.status === 'pending_disposal';

    // Determine scan_method for audit trail
    let scanMethod: string;
    if (isManualConfirm.value) {
      scanMethod = 'manual_confirm';
    } else if (isFromScan.value) {
      scanMethod = 'qr_scan';
    } else if (isAreaAsset) {
      scanMethod = 'area_manual';
    } else {
      scanMethod = 'qr_scan'; // editing an already-scanned asset
    }

    const data: any = {
      asset_id: selectedAsset.value.id,
      asset_condition: checkForm.value.asset_condition, // Luôn cho phép chỉnh sửa tình trạng
      scan_method: scanMethod,
    };

    if (isManualConfirm.value && !selectedAsset.value.inventory_detail) {
      data.manual_reason = checkForm.value.manual_reason;
    }
    // NGUYÊN TẮC: Không thể vừa sửa chữa vừa thanh lý
    // - needs_repair: Tài sản CÒN SỬA ĐƯỢC → suggest_repair = true, suggest_disposal = false
    // - damaged: Tài sản HỎNG NẶNG, SỬA KHÔNG ĐƯỢC → suggest_disposal = true, suggest_repair = false
    if (isPendingDisposal) {
      // Tài sản đã được đánh dấu chờ thanh lý từ trước
      data.suggest_disposal = true;
      data.suggest_repair = false;
      data.disposal_reason = data.disposal_reason || 'Chi phí sửa chữa vượt quá giá trị tài sản';
    } else if (checkForm.value.asset_condition === 'needs_repair') {
      // Cần sửa chữa: CÒN SỬA ĐƯỢC
      data.suggest_repair = true;
      data.suggest_disposal = false;
    } else if (checkForm.value.asset_condition === 'damaged') {
      // Hỏng nặng: SỬA KHÔNG ĐƯỢC → thanh lý
      data.suggest_disposal = true;
      data.suggest_repair = false;
      data.disposal_reason = 'Tài sản hỏng nặng, không thể sửa chữa hoặc chi phí sửa chữa vượt quá giá trị';
    } else {
      // Tốt hoặc sử dụng được: không cần sửa, không cần thanh lý
      data.suggest_repair = false;
      data.suggest_disposal = false;
    }

    if (isScannedAsset) {
      // Tài sản đã quét QR: CHẮC CHẮN còn tồn tại và khớp với sổ sách
      // KHÔNG THỂ chỉnh sửa số lượng và kết quả kiểm kê (đã được xác nhận khi quét QR)
      // CHỈ CÓ THỂ chỉnh sửa tình trạng tài sản (tốt, cần sửa, hỏng...)
      data.actual_quantity = selectedAsset.value.inventory_detail.actual_quantity; // Giữ nguyên (không thể thay đổi)
      data.check_status = 'matched'; // Luôn là "Khớp" (không thể thay đổi)
      // Cho phép cập nhật ghi chú (nhưng không được thay đổi số lượng và kết quả)
      data.notes = checkForm.value.notes || selectedAsset.value.inventory_detail.notes;
    } else {
      // Tài sản diện tích hoặc chưa quét: cho phép chỉnh sửa tất cả
      data.actual_quantity = checkForm.value.actual_quantity;
      data.check_status = checkForm.value.check_status;
      data.notes = checkForm.value.notes;
    }

    let detail;
    if (selectedAsset.value.inventory_detail) {
      // Update existing
      detail = await inventoryService.updateDetail(
        report.value.id,
        selectedAsset.value.inventory_detail.id,
        data
      );
    } else {
      // Add new
      detail = await inventoryService.addDetail(report.value.id, data);
    }

    // Update local state
    const index = assets.value.findIndex(a => a.id === selectedAsset.value.id);
    if (index !== -1) {
      assets.value[index].inventory_detail = detail;
    }

    hasChanges.value = true;
    showCheckDialog.value = false;
    isFromScan.value = false;
    isManualConfirm.value = false;
    ElMessage.success('Đã lưu kết quả kiểm kê');
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    savingCheck.value = false;
  }
};

const markUnscannedAsMissing = async () => {
  if (!report.value) {
    ElMessage.error('Không tìm thấy báo cáo kiểm kê');
    return;
  }
  
  // Tìm các tài sản chưa quét (có thể quét QR nhưng chưa có inventory_detail)
  const unscannedAssets = assets.value.filter(asset => {
    if (!canScanAsset(asset)) return false; // Bỏ qua tài sản không cần quét QR
    return !asset.inventory_detail; // Chưa có kết quả kiểm kê
  });
  
  if (unscannedAssets.length === 0) {
    ElMessage.info('Không có tài sản nào chưa quét');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn đánh dấu ${unscannedAssets.length} tài sản chưa quét là "Thiếu"?\n\nLưu ý: Chỉ đánh dấu các tài sản có thể quét QR nhưng chưa được quét.`,
      'Xác nhận đánh dấu tài sản thiếu',
      { 
        confirmButtonText: 'Đánh dấu', 
        cancelButtonText: 'Hủy', 
        type: 'warning' 
      }
    );
    
    markingMissing.value = true;
    let successCount = 0;
    let errorCount = 0;
    
    for (const asset of unscannedAssets) {
      try {
        const data = {
          asset_id: asset.id,
          actual_quantity: 0,
          asset_condition: 'damaged', // Hư hỏng nặng (tài sản mất)
          check_status: 'missing',
          notes: 'Tài sản chưa được quét QR - đánh dấu là thiếu',
        };
        
        const detail = await inventoryService.addDetail(report.value.id, data);
        
        // Update local state
        const index = assets.value.findIndex(a => a.id === asset.id);
        if (index !== -1) {
          assets.value[index].inventory_detail = detail;
        }
        
        successCount++;
      } catch (error: any) {
        console.error(`Error marking asset ${asset.id} as missing:`, error);
        errorCount++;
      }
    }
    
    hasChanges.value = true;
    
    if (errorCount === 0) {
      ElMessage.success(`Đã đánh dấu ${successCount} tài sản là "Thiếu"`);
    } else {
      ElMessage.warning(`Đã đánh dấu ${successCount} tài sản, ${errorCount} tài sản gặp lỗi`);
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('Có lỗi xảy ra khi đánh dấu tài sản');
    }
  } finally {
    markingMissing.value = false;
  }
};

const saveAsDraft = async () => {
  // Already saved through individual checks
  ElMessage.success('Đã lưu bản nháp');
  hasChanges.value = false;
};

const submitReport = async () => {
  if (!report.value) return;

  try {
    // Tự động đánh dấu tài sản có QR chưa quét là "Thiếu" trước khi nộp
    const unscannedAssets = assets.value.filter(asset => {
      if (!canScanAsset(asset)) return false; // Bỏ qua tài sản không cần quét QR
      return !asset.inventory_detail; // Chưa có kết quả kiểm kê
    });

    if (unscannedAssets.length > 0) {
      const confirmed = await ElMessageBox.confirm(
        `Có ${unscannedAssets.length} tài sản có mã QR chưa được quét. Hệ thống sẽ tự động đánh dấu các tài sản này là "Thiếu" (mất).\n\nBạn có chắc chắn muốn nộp báo cáo kiểm kê? Sau khi nộp, bạn sẽ không thể chỉnh sửa.`,
        'Xác nhận nộp báo cáo',
        { 
          confirmButtonText: 'Có, tôi chắc chắn muốn nộp', 
          cancelButtonText: 'Hủy', 
          type: 'warning',
          dangerouslyUseHTMLString: false
        }
      );

      if (!confirmed) {
        submitting.value = false;
        return;
      }

      // Tự động đánh dấu các tài sản chưa quét là "Thiếu"
      submitting.value = true;
      let markedCount = 0;
      
      for (const asset of unscannedAssets) {
        try {
          const data = {
            asset_id: asset.id,
            actual_quantity: 0,
            asset_condition: 'damaged', // Hư hỏng nặng (tài sản mất)
            check_status: 'missing',
            notes: 'Tài sản có mã QR nhưng không quét được - coi như mất',
          };
          
          await inventoryService.addDetail(report.value.id, data);
          
          // Update local state
          const index = assets.value.findIndex(a => a.id === asset.id);
          if (index !== -1) {
            const detail = await inventoryService.getReportById(report.value.id);
            if (detail.details) {
              const assetDetail = detail.details.find((d: any) => d.asset_id === asset.id);
              if (assetDetail) {
                assets.value[index].inventory_detail = assetDetail;
              }
            }
          }
          
          markedCount++;
        } catch (error: any) {
          console.error(`Error marking asset ${asset.id} as missing:`, error);
        }
      }

      if (markedCount > 0) {
        ElMessage.info(`Đã tự động đánh dấu ${markedCount} tài sản chưa quét là "Thiếu"`);
      }
    } else {
      // Nếu không có tài sản chưa quét, vẫn cần xác nhận
      const confirmed = await ElMessageBox.confirm(
        `Bạn có chắc chắn muốn nộp báo cáo kiểm kê?\n\nSau khi nộp, bạn sẽ không thể chỉnh sửa. Vui lòng kiểm tra lại kỹ trước khi nộp.`,
        'Xác nhận nộp báo cáo',
        { 
          confirmButtonText: 'Có, tôi chắc chắn muốn nộp', 
          cancelButtonText: 'Hủy', 
          type: 'warning' 
        }
      );
      if (!confirmed) {
        submitting.value = false;
        return;
      }
    }

    // Nộp báo cáo
    await inventoryService.submitReport(report.value.id);
    if (report.value.status === 'rejected_by_head' || report.value.status === 'rejected_by_admin') {
      ElMessage.success('Đã gửi lại báo cáo kiểm kê thành công');
    } else {
      ElMessage.success('Đã nộp báo cáo kiểm kê thành công');
    }
    router.push('/inventory');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  } finally {
    submitting.value = false;
  }
};

// Helpers
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

// Tính chênh lệch theo logic mới:
// - Nếu check_status = 'missing' → chênh lệch = -1 (coi như mất)
// - Nếu check_status = 'damaged' → chênh lệch = 0 (vẫn coi như còn, chỉ cần sửa chữa)
// - Nếu check_status = 'matched' → chênh lệch = actual_quantity - quantity (sổ sách)
const getCalculatedDifference = (row: any) => {
  if (!row.inventory_detail) return null;
  
  const checkStatus = row.inventory_detail.check_status;
  const bookQuantity = row.quantity || 1;
  const actualQuantity = row.inventory_detail.actual_quantity;
  
  if (checkStatus === 'missing') {
    // Không có quét QR hoặc mất → chênh lệch = -1
    return -1;
  } else if (checkStatus === 'damaged') {
    // Cần sửa chữa → vẫn coi như còn → chênh lệch = 0
    return 0;
  } else {
    // Khớp → chênh lệch = actual_quantity - quantity (sổ sách)
    return actualQuantity - bookQuantity;
  }
};

const formatDifference = (diff: number | null) => {
  if (diff === null) return '-';
  if (diff === 0) return '0';
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const getQuantityClass = (row: any) => {
  if (!row.inventory_detail) return '';
  const diff = getCalculatedDifference(row);
  if (diff === null) return '';
  if (diff === 0) return 'text-success';
  return diff > 0 ? 'text-warning' : 'text-danger';
};

const getDifferenceClass = (row: any) => {
  if (!row.inventory_detail) return '';
  const diff = getCalculatedDifference(row);
  if (diff === null) return '';
  if (diff === 0) return 'text-success';
  return diff > 0 ? 'text-warning' : 'text-danger';
};

const getConditionType = (condition: string) => {
  const types: Record<string, string> = {
    good: 'success',
    usable: 'primary',
    needs_repair: 'warning',
    damaged: 'danger',
    disposed: 'info',
  };
  return types[condition] || 'info';
};

const getConditionLabel = (condition: string) => {
  const labels: Record<string, string> = {
    good: 'Tốt',
    usable: 'Sử dụng được',
    needs_repair: 'Cần sửa',
    damaged: 'Hỏng',
    disposed: 'Đã thanh lý',
  };
  return labels[condition] || condition;
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    matched: 'success',
    missing: 'danger',
    surplus: 'warning',
    damaged: 'danger',
    needs_repair: 'warning',
  };
  return types[status] || 'info';
};

const getCheckStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    matched: 'Khớp',
    missing: 'Thiếu',
    surplus: 'Thừa',
    damaged: 'Hỏng',
    needs_repair: 'Cần sửa',
  };
  return labels[status] || status;
};

const getReportStatusType = (status: string | undefined) => {
  if (!status) return 'info';
  const types: Record<string, string> = {
    draft: 'warning',
    pending: 'warning',
    approved_by_head: 'primary',
    approved_by_admin: 'success',
    completed: 'success',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
  };
  return types[status] || 'info';
};

const getReportStatusLabel = (status: string | undefined) => {
  if (!status) return 'Chưa xác định';
  const labels: Record<string, string> = {
    draft: 'Đang thực hiện',
    pending: 'Đã nộp - Chờ duyệt',
    approved_by_head: 'Trưởng Đơn vị đã duyệt',
    approved_by_admin: 'Quản trị viên đã duyệt',
    completed: 'Hoàn thành',
    rejected_by_head: 'Trưởng Đơn vị từ chối - Cần chỉnh sửa',
    rejected_by_admin: 'Quản trị viên từ chối - Cần chỉnh sửa',
  };
  return labels[status] || status;
};

// Camera Scanner Functions
const startCameraWithIndex = async (index: number) => {
  const devices = availableCameras.value;
  if (!devices.length) return;
  
  const qrCodeInstance = html5QrCode.value!;
  const config = {
    fps: 15,
    // Khung quét 75% chiều nhỏ nhất - đủ lớn và nhạy
    qrbox: (w: number, h: number) => {
      const size = Math.floor(Math.min(w, h) * 0.75);
      return { width: size, height: size };
    },
    disableFlip: false,
    // Chỉ scan QR_CODE - không scan barcode/DataMatrix/... nhanh hơn nhiều lần
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true,
    },
  };
  
  const cameraId = devices[index]?.id;
  await qrCodeInstance.start(
    cameraId || { facingMode: 'environment' },
    config,
    onQRCodeScanned,
    onCameraError
  );
  cameraScanning.value = true;
};

const openCameraScanner = async () => {
  showCameraDialog.value = true;
  cameraError.value = '';
  await nextTick();
  
  // Kiểm tra Secure Context (HTTPS/localhost)
  if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    cameraError.value = 'Truy cập Camera yêu cầu môi trường an toàn (HTTPS hoặc localhost). \n\n' +
                       'Cách khắc phục: \n' +
                       '1. Sử dụng HTTPS (nếu có)\n' +
                       '2. Nếu đang test trên điện thoại, truy cập: chrome://flags/#unsafely-treat-insecure-origin-as-secure và thêm địa chỉ IP này vào danh sách.';
    cameraScanning.value = false;
    return;
  }
  
  try {
    const devices = await Html5Qrcode.getCameras();
    availableCameras.value = devices;
    hasMultipleCameras.value = devices.length > 1;
    
    // Ưu tiên camera sau (environment/back/rear)
    const backIdx = devices.findIndex((d: any) => 
      d.label.toLowerCase().includes('back') || 
      d.label.toLowerCase().includes('rear') ||
      d.label.toLowerCase().includes('environment')
    );
    currentCameraIndex.value = backIdx >= 0 ? backIdx : 0;
    
    const qrCodeInstance = new Html5Qrcode('qr-reader');
    html5QrCode.value = qrCodeInstance;
    
    await startCameraWithIndex(currentCameraIndex.value);
  } catch (error: any) {
    console.error('Error starting camera:', error);
    let msg = error.message || error.toString();
    
    if (msg.includes('secure context')) {
      cameraError.value = 'Truy cập Camera chỉ được hỗ trợ trong môi trường an toàn (HTTPS hoặc localhost).';
    } else if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
      cameraError.value = 'Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt.';
    } else {
      cameraError.value = 'Không thể mở camera: ' + msg;
    }
    cameraScanning.value = false;
  }
};

const onQRCodeScanned = async (decodedText: string) => {
  if (scanning.value) return; // Đang xử lý, bỏ qua
  
  try {
    // Tạm dừng camera để tránh quét lặp cùng mã
    if (html5QrCode.value) {
      try {
        await html5QrCode.value.pause();
      } catch (e) {
        console.warn('Pause error:', e);
      }
    }
    
    scanning.value = true;
    scannedCode.value = decodedText;
    
    // Xử lý mã QR và mở dialog kiểm kê (nếu cần)
    await handleScanCode();
    
    // Nếu không mở dialog kiểm kê (tức là đã auto-save thành công)
    // thì tự động resume camera sau 1.5 giây để quét tiếp
    if (!showCheckDialog.value && showCameraDialog.value) {
      setTimeout(async () => {
        // Chỉ resume nếu camera dialog vẫn đang mở và không có dialog kiểm kê nào hiện lên
        if (html5QrCode.value && !showCheckDialog.value && showCameraDialog.value) {
          try {
            await html5QrCode.value.resume();
            scanning.value = false;
            scannedCode.value = '';
          } catch (e) {
            console.error('Error resuming camera:', e);
            await restartCamera(); // Fallback nếu không resume được
          }
        }
      }, 1500);
    }
    
  } catch (error: any) {
    console.error('Error processing scanned code:', error);
    ElMessage.error({
      message: 'Lỗi khi xử lý mã QR: ' + (error.message || 'Không xác định'),
      duration: 2000,
      showClose: true,
      offset: 60
    });
    // Restart camera để reset state và tiếp tục quét
    scannedCode.value = '';
    scanning.value = false;
    if (showCameraDialog.value) {
      await restartCamera();
    }
  }
};

// Restart camera: tăng cameraKey → Vue xóa hẳn DOM element cũ và tạo mới
const restartCamera = async () => {
  // Dừng instance hiện tại
  if (html5QrCode.value) {
    try { await html5QrCode.value.stop(); } catch { /* ignore */ }
    try { await html5QrCode.value.clear(); } catch { /* ignore */ }
    html5QrCode.value = null;
  }
  // Tăng key → Vue destroy DOM element qr-reader và recreate hoàn toàn mới
  cameraKey.value++;
  // Đợi 2 ticks: tick 1 Vue xóa DOM, tick 2 Vue tạo DOM mới
  await nextTick();
  await nextTick();
  html5QrCode.value = new Html5Qrcode('qr-reader');
  await startCameraWithIndex(currentCameraIndex.value);
};

const onCheckDialogClose = async () => {
  isFromScan.value = false;
  scanning.value = false;
  scannedCode.value = '';
  
  // Khi dialog đóng, nếu camera đang mở và đang bị pause thì resume lại
  if (showCameraDialog.value && html5QrCode.value) {
    try {
      // Đợi một chút để dialog biến mất hoàn toàn
      setTimeout(async () => {
        if (html5QrCode.value) {
          try {
            await html5QrCode.value.resume();
          } catch (e) {
            // Nếu resume lỗi (do instance bị chết trên mobile), thực hiện restart
            await restartCamera();
          }
        }
      }, 300);
    } catch (e) {
      console.warn('onCheckDialogClose resume error:', e);
    }
  }
};

const onCameraError = (errorMessage: string) => {
  // Bỏ qua lỗi bình thường khi camera đang quét mà chưa thấy QR code
  if (
    errorMessage.includes('No QR code found') ||
    errorMessage.includes('NotFoundException') ||
    errorMessage.includes('No MultiFormat readers') ||
    errorMessage.includes('No barcode or QR code detected')
  ) {
    return;
  }
  console.warn('Camera error:', errorMessage);
  cameraError.value = errorMessage;
};

const switchCamera = async () => {
  if (!html5QrCode.value || availableCameras.value.length < 2) return;
  
  try {
    cameraScanning.value = false;
    await html5QrCode.value.stop();
    
    // Cycle sang camera tiếp theo
    currentCameraIndex.value = (currentCameraIndex.value + 1) % availableCameras.value.length;
    
    await startCameraWithIndex(currentCameraIndex.value);
    
    const cam = availableCameras.value[currentCameraIndex.value];
    ElMessage.success({
      message: `Đã chuyển sang: ${cam?.label || 'Camera ' + (currentCameraIndex.value + 1)}`,
      duration: 2000,
      showClose: true,
      offset: 60
    });
  } catch (error) {
    console.error('Error switching camera:', error);
    ElMessage.error({
      message: 'Không thể đổi camera',
      duration: 2000,
      showClose: true,
      offset: 60
    });
  }
};

const stopCameraScanner = async () => {
  try {
    if (html5QrCode.value) {
      await html5QrCode.value.stop();
      await html5QrCode.value.clear();
      html5QrCode.value = null;
    }
  } catch (error) {
    console.error('Error stopping camera:', error);
  } finally {
    showCameraDialog.value = false;
    cameraScanning.value = false;
    cameraError.value = '';
  }
};

onMounted(async () => {
  // Kiểm tra quyền: Admin không được thực hiện kiểm kê trực tiếp
  const isAdmin = authStore.user?.role === 'admin';
  const hasDepartment = !!authStore.user?.department_id;
  const roundId = route.query.round_id as string | undefined;
  const reportId = route.query.report_id as string | undefined;
  
  // Validate route params first
  if (!roundId && !reportId) {
    ElMessage.error('Thiếu thông tin đợt kiểm kê hoặc báo cáo');
    router.push('/inventory');
    return;
  }
  
  if (isAdmin && !reportId) {
    ElMessage.warning('Admin chỉ có thể xem và duyệt báo cáo kiểm kê, không thể thực hiện kiểm kê trực tiếp');
    router.push('/inventory');
    return;
  }
  
  if (!hasDepartment && !reportId) {
    ElMessage.warning('Bạn chưa được phân công vào phòng ban nào');
    router.push('/inventory');
    return;
  }
  
  await loadCategories();
  await fetchData();
  
  // Tự động focus vào input scanner sau khi load xong
  await nextTick();
  scannerInputRef.value?.focus();
});

onUnmounted(() => {
  // Đảm bảo dừng camera khi component bị unmount
  stopCameraScanner();
});
</script>

<style scoped>
.inventory-conduct {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 12px;
}

.round-info {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: none;
}

.round-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.round-info-main {
  flex: 1;
}

.round-name {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.round-details {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-icon {
  color: #409eff;
  font-size: 18px;
}

.detail-label {
  color: #606266;
  font-size: 14px;
}

.detail-value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.round-status-badge {
  flex-shrink: 0;
}

/* Responsive cho Inventory Conduct */
@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-right .el-button {
    flex: 1 1 calc(50% - 6px);
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 20px;
  }

  .header-right .el-button {
    flex: 1 1 100%;
    width: 100%;
  }

  .round-info-header {
    flex-direction: column;
  }
  
  .round-details {
    flex-direction: column;
    gap: 12px;
  }

  .round-name {
    font-size: 18px;
  }
}

.scanner-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.scanner-card :deep(.el-card__body) {
  padding: 20px;
}

.scanner-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scanner-input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.scanner-input {
  flex: 1;
}

.camera-btn {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .scanner-input-row {
    flex-direction: column;
  }
  
  .camera-btn {
    width: 100%;
  }
}

.scanner-input :deep(.el-input__inner) {
  font-size: 16px;
  padding: 12px 15px;
}

.scanner-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.scanner-hint .el-icon {
  font-size: 16px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-card .stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-card.success .stat-value {
  color: #67c23a;
}

.stat-card.warning .stat-value {
  color: #e6a23c;
}

.stat-card.danger .stat-value {
  color: #f56c6c;
}

.stat-card .stat-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-card .stat-percentage {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-card .stat-progress {
  margin-top: 8px;
}

.stat-card .stat-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: #e6a23c;
  margin-top: 8px;
  font-style: italic;
}

/* Summary stats responsive - đã xử lý trong responsive.scss */
@media (max-width: 1200px) {
  .summary-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 16px 12px;
  }

  .stat-card .stat-value {
    font-size: 24px;
  }

  .stat-card .stat-label {
    font-size: 12px;
  }
}

.asset-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.text-muted {
  color: #c0c4cc;
}

.text-success {
  color: #67c23a;
  font-weight: bold;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.check-dialog-content {
  padding: 10px 0;
}

.asset-info {
  margin-bottom: 20px;
}

.hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #ecf5ff !important;
}

/* Camera Scanner Dialog */
.camera-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.camera-scanner-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-height: 400px;
}

#qr-reader {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  overflow: hidden;
}

#qr-reader video {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.camera-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-size: 14px;
}

.camera-error {
  width: 100%;
  max-width: 500px;
}

/* Camera scanner responsive */
@media (max-width: 768px) {
  .scanner-input-row {
    flex-direction: column;
  }

  .scanner-input {
    width: 100%;
  }

  .camera-btn {
    width: 100%;
  }

  .camera-dialog {
    width: 95% !important;
  }
  
  #qr-reader {
    max-width: 100%;
  }

  .camera-scanner-container {
    min-height: 300px;
  }
}
</style>
