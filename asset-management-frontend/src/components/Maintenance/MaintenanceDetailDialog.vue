<template>
  <el-dialog
    :model-value="visible"
    width="900px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="dialog-header">
        <span class="title">{{ maintenanceData?.request_type === 'procurement' ? 'Chi tiết yêu cầu mua sắm/cấp phát' : 'Chi tiết yêu cầu sửa chữa/bảo trì' }}</span>
        <el-button
          :icon="Refresh"
          circle
          size="small"
          :loading="loading"
          style="margin-left: 10px;"
          title="Tải lại dữ liệu"
          @click="fetchMaintenanceData"
        />
      </div>
    </template>
    <div v-loading="loading">
      <!-- Procurement Request Details -->
      <el-descriptions
        v-if="maintenanceData && maintenanceData.request_type === 'procurement'"
        :column="2"
        border
      >
        <el-descriptions-item
          label="Tên thiết bị"
          :span="2"
        >
          <strong>{{ maintenanceData.device_name || '-' }}</strong>
        </el-descriptions-item>
        <el-descriptions-item
          label="Đơn vị sử dụng trực tiếp"
          :span="2"
        >
          {{ maintenanceData.department?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Số lượng">
          {{ maintenanceData.quantity || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Đơn vị tính">
          {{ maintenanceData.unit || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Đơn giá">
          {{ maintenanceData.unit_price ? formatCurrency(maintenanceData.unit_price) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Thành tiền">
          <strong>{{ maintenanceData.total_price ? formatCurrency(maintenanceData.total_price) : formatCurrency((maintenanceData.quantity || 0) * (maintenanceData.unit_price || 0)) }}</strong>
        </el-descriptions-item>
        <el-descriptions-item
          label="Tính năng kỹ thuật"
          :span="2"
        >
          {{ maintenanceData.technical_specs || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Thuyết minh nhu cầu"
          :span="2"
        >
          {{ maintenanceData.justification || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="maintenanceData.product_link"
          label="Link sản phẩm"
          :span="2"
        >
          <el-link
            :href="maintenanceData.product_link"
            target="_blank"
            type="primary"
          >
            {{ maintenanceData.product_link }}
            <i
              class="el-icon-right"
              style="margin-left: 4px;"
            />
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="maintenanceData.product_image"
          label="Hình ảnh sản phẩm"
          :span="2"
        >
          <el-image
            :src="maintenanceData.product_image"
            :preview-src-list="[maintenanceData.product_image]"
            style="width: 200px; height: 200px;"
            fit="contain"
          />
        </el-descriptions-item>
        <el-descriptions-item label="Mức độ ưu tiên">
          <el-tag :type="getUrgencyType(maintenanceData.urgency)">
            {{ getUrgencyText(maintenanceData.urgency) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Trạng thái">
          <el-tag :type="getStatusType(maintenanceData.status)">
            {{ getStatusText(maintenanceData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Người tạo">
          {{ maintenanceData.requester?.fullname || maintenanceData.requester?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Ngày tạo">
          {{ formatDate(createdDate) }}
        </el-descriptions-item>
        <!-- Approval dates -->
        <el-descriptions-item
          v-if="maintenanceData.head_approved_at"
          label="Trưởng Đơn vị duyệt"
        >
          {{ formatDate(maintenanceData.head_approved_at) }}
          <span
            v-if="maintenanceData.headApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.headApprover?.fullname || maintenanceData.headApprover?.username }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="maintenanceData.admin_approved_at"
          label="Quản trị viên duyệt"
        >
          {{ formatDate(maintenanceData.admin_approved_at) }}
          <span
            v-if="maintenanceData.adminApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.adminApprover?.fullname || maintenanceData.adminApprover?.username }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="maintenanceData.director_approved_at"
          label="Giám hiệu duyệt"
        >
          {{ formatDate(maintenanceData.director_approved_at) }}
          <span
            v-if="maintenanceData.directorApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.directorApprover?.fullname || maintenanceData.directorApprover?.username }})
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- Repair Request Details (request_type='repair') -->
      <el-descriptions
        v-if="maintenanceData && maintenanceData.request_type === 'repair'"
        :column="2"
        border
      >
        <el-descriptions-item
          label="Tên tài sản"
          :span="2"
        >
          <strong>{{ maintenanceData.asset?.name || '-' }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="Mã tài sản">
          {{ maintenanceData.asset?.asset_code || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Trạng thái tài sản">
          <el-tag :type="getAssetStatusType(maintenanceData.asset?.status)">
            {{ getAssetStatusText(maintenanceData.asset?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Nguyên giá">
          {{ maintenanceData.asset?.purchase_price ? formatCurrency(Number(maintenanceData.asset.purchase_price)) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Giá trị còn lại">
          {{ formatCurrency(maintenanceData.asset?.residual_value ?? maintenanceData.asset?.current_value) }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Đơn vị sử dụng trực tiếp"
          :span="2"
        >
          {{ maintenanceData.department?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Thuyết minh nhu cầu sửa chữa"
          :span="2"
        >
          {{ maintenanceData.description || maintenanceData.justification || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Hình ảnh minh họa tình trạng hư hỏng"
          :span="2"
        >
          <div
            v-if="hasDamageImages"
            class="damage-images-display"
          >
            <!-- Hiển thị từ association damageImages (ưu tiên) -->
            <template v-if="maintenanceData.damageImages && maintenanceData.damageImages.length > 0">
              <!-- Cảnh báo nếu có ảnh trong DB nhưng file bị mất trên disk -->
              <el-alert
                v-if="missingImagesCount > 0"
                :title="`${missingImagesCount} hình ảnh bị mất (file không tồn tại trên server). Vui lòng upload lại.`"
                type="warning"
                :closable="false"
                show-icon
                style="margin-bottom: 8px;"
              />
              <div
                v-for="image in maintenanceData.damageImages"
                :key="image.id"
                class="damage-image-wrapper"
              >
                <!-- Ảnh hợp lệ: file tồn tại trên disk -->
                <el-image
                  v-if="image.file_exists !== false"
                  :src="resolveImageUrl(image)"
                  :preview-src-list="availableDamageImageUrls"
                  :initial-index="availableDamageImageUrls.indexOf(resolveImageUrl(image))"
                  fit="cover"
                  class="damage-image-display"
                  :preview-teleported="true"
                >
                  <template #error>
                    <div class="damage-image-error">
                      <el-icon size="24">
                        <Picture />
                      </el-icon>
                      <span>Không tải được ảnh</span>
                    </div>
                  </template>
                </el-image>
                <!-- Ảnh bị mất trên disk -->
                <div
                  v-else
                  class="damage-image-missing"
                >
                  <el-icon size="24">
                    <Picture />
                  </el-icon>
                  <span>File kông tồn tại</span>
                  <span style="font-size:11px;color:#c0c4cc;">(ID {{ image.id }})</span>
                </div>
              </div>
            </template>
            <!-- Fallback hiển thị từ damage_images field (JSON array base64) -->
            <template v-else-if="maintenanceData.damage_images">
              <el-image
                v-for="(img, index) in parseImages(maintenanceData.damage_images)"
                :key="index"
                :src="img"
                :preview-src-list="parseImages(maintenanceData.damage_images)"
                :initial-index="index"
                fit="cover"
                class="damage-image-display"
                :preview-teleported="true"
              >
                <template #error>
                  <div class="damage-image-error">
                    <el-icon size="24">
                      <Picture />
                    </el-icon>
                    <span>Không tải được ảnh</span>
                  </div>
                </template>
              </el-image>
            </template>
            <div style="margin-top: 8px; font-size: 12px; color: #909399;">
              ({{ maintenanceData.damageImages?.length || parseImages(maintenanceData.damage_images).length }} hình ảnh hư hỏng)
            </div>
          </div>
          <div
            v-else
            style="color: #909399; padding: 8px; background: #f5f7fa; border-radius: 4px;"
          >
            <el-icon><Picture /></el-icon>
            <span style="margin-left: 4px;">Chưa có hình ảnh hư hỏng được upload.</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="Chi phí dự kiến">
          {{ maintenanceData.estimated_cost ? formatCurrency(Number(maintenanceData.estimated_cost)) : '-' }}
          <div
            v-if="maintenanceData.asset?.purchase_price && maintenanceData.estimated_cost"
            style="margin-top: 4px; font-size: 12px; color: #909399;"
          >
            Tỷ lệ: <strong :style="{ color: (Number(maintenanceData.estimated_cost) / Number(maintenanceData.asset.purchase_price) * 100) > 30 ? '#f56c6c' : '#67c23a' }">
              {{ ((Number(maintenanceData.estimated_cost) / Number(maintenanceData.asset.purchase_price)) * 100).toFixed(2) }}%
            </strong>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="Mức độ ưu tiên">
          <el-tag :type="getUrgencyType(maintenanceData.urgency)">
            {{ getUrgencyText(maintenanceData.urgency) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Trạng thái">
          <el-tag :type="getStatusType(maintenanceData.status)">
            {{ getStatusText(maintenanceData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Người tạo">
          {{ maintenanceData.requester?.fullname || maintenanceData.requester?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Ngày tạo">
          {{ formatDate(createdDate) }}
        </el-descriptions-item>
        <!-- Approval dates -->
        <el-descriptions-item
          v-if="maintenanceData.head_approved_at"
          label="Trưởng Đơn vị duyệt"
        >
          {{ formatDate(maintenanceData.head_approved_at) }}
          <span
            v-if="maintenanceData.headApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.headApprover?.fullname || maintenanceData.headApprover?.username }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="maintenanceData.admin_approved_at"
          label="Quản trị viên duyệt"
        >
          {{ formatDate(maintenanceData.admin_approved_at) }}
          <span
            v-if="maintenanceData.adminApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.adminApprover?.fullname || maintenanceData.adminApprover?.username }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="maintenanceData.director_approved_at"
          label="Giám hiệu duyệt"
        >
          {{ formatDate(maintenanceData.director_approved_at) }}
          <span
            v-if="maintenanceData.directorApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.directorApprover?.fullname || maintenanceData.directorApprover?.username }})
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- Equipment Repair Details (legacy) -->
      <el-descriptions
        v-else-if="maintenanceData && maintenanceData.request_type === 'equipment_repair'"
        :column="2"
        border
      >
        <el-descriptions-item
          label="Tên thiết bị"
          :span="2"
        >
          <strong>{{ maintenanceData.device_name || maintenanceData.asset?.name || '-' }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="Mã tài sản">
          {{ maintenanceData.asset?.asset_code || maintenanceData.asset_code_text || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Serial Number">
          {{ maintenanceData.serial_number || maintenanceData.asset?.serial_number || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Năm sử dụng">
          {{ maintenanceData.year_in_use || maintenanceData.asset?.year_in_use || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Đơn vị tính">
          {{ maintenanceData.unit || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Số lượng">
          {{ maintenanceData.quantity || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Đơn vị sử dụng trực tiếp"
          :span="2"
        >
          {{ maintenanceData.department?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Nguyên giá">
          {{ maintenanceData.asset?.purchase_price ? formatCurrency(Number(maintenanceData.asset.purchase_price)) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Giá trị còn lại">
          {{ formatCurrency(maintenanceData.asset?.residual_value ?? maintenanceData.asset?.current_value) }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Tình trạng hiện tại"
          :span="2"
        >
          {{ maintenanceData.current_condition || maintenanceData.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Thuyết minh nhu cầu sửa chữa"
          :span="2"
        >
          {{ maintenanceData.justification || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Hình ảnh hư hỏng (cho yêu cầu sửa chữa)"
          :span="2"
        >
          <div
            v-if="hasDamageImages"
            class="damage-images-display"
          >
            <el-image
              v-for="image in maintenanceData.damageImages"
              :key="image.id"
              :src="resolveImageUrl(image)"
              :preview-src-list="availableDamageImageUrls"
              :initial-index="availableDamageImageUrls.indexOf(resolveImageUrl(image))"
              fit="cover"
              class="damage-image-display"
              :preview-teleported="true"
            />
            <div style="margin-top: 8px; font-size: 12px; color: #909399;">
              ({{ maintenanceData.damageImages.length }} hình ảnh hư hỏng của thiết bị)
            </div>
          </div>
          <div
            v-else
            style="color: #909399; padding: 8px; background: #f5f7fa; border-radius: 4px;"
          >
            <el-icon><Picture /></el-icon>
            <span style="margin-left: 4px;">Chưa có hình ảnh hư hỏng được upload cho yêu cầu sửa chữa này.</span>
            <div style="margin-top: 4px; font-size: 12px; color: #909399;">
              Hình ảnh hư hỏng (nếu có) sẽ được hiển thị ở đây để mô tả tình trạng thiết bị cần sửa chữa.
              <br v-if="maintenanceData?.status === 'draft' || maintenanceData?.status === 'new'">
              <span
                v-if="maintenanceData?.status === 'draft' || maintenanceData?.status === 'new'"
                style="color: #409eff;"
              >
                Bạn có thể chỉnh sửa yêu cầu để thêm hình ảnh hư hỏng.
              </span>
            </div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="Chi phí dự kiến">
          {{ maintenanceData.estimated_cost || maintenanceData.cost ? formatCurrency(maintenanceData.estimated_cost || maintenanceData.cost) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Mức độ ưu tiên">
          <el-tag :type="getUrgencyType(maintenanceData.urgency)">
            {{ getUrgencyText(maintenanceData.urgency) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Trạng thái">
          <el-tag :type="getStatusType(maintenanceData.status)">
            {{ getStatusText(maintenanceData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Người tạo">
          {{ maintenanceData.requester?.fullname || maintenanceData.requester?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Ngày tạo">
          {{ formatDate(createdDate) }}
        </el-descriptions-item>
        <!-- Approval dates -->
        <el-descriptions-item
          v-if="maintenanceData.head_approved_at"
          label="Trưởng Đơn vị duyệt"
        >
          {{ formatDate(maintenanceData.head_approved_at) }}
          <span
            v-if="maintenanceData.headApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.headApprover?.fullname || maintenanceData.headApprover?.username }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="maintenanceData.admin_approved_at"
          label="Quản trị viên duyệt"
        >
          {{ formatDate(maintenanceData.admin_approved_at) }}
          <span
            v-if="maintenanceData.adminApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.adminApprover?.fullname || maintenanceData.adminApprover?.username }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="maintenanceData.director_approved_at"
          label="Giám hiệu duyệt"
        >
          {{ formatDate(maintenanceData.director_approved_at) }}
          <span
            v-if="maintenanceData.directorApprover"
            style="color: #909399; margin-left: 8px;"
          >
            ({{ maintenanceData.directorApprover?.fullname || maintenanceData.directorApprover?.username }})
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- Facility Repair Details -->
      <el-descriptions
        v-else-if="maintenanceData && maintenanceData.request_type === 'facility_repair'"
        :column="2"
        border
      >
        <el-descriptions-item
          label="Tên cơ sở vật chất"
          :span="2"
        >
          <strong>{{ maintenanceData.facility_name || '-' }}</strong>
        </el-descriptions-item>
        <el-descriptions-item
          label="Đơn vị sử dụng trực tiếp"
          :span="2"
        >
          {{ maintenanceData.department?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Ngày sửa chữa lần cuối">
          {{ maintenanceData.last_repair_date ? formatDate(maintenanceData.last_repair_date) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Nội dung sửa chữa"
          :span="2"
        >
          {{ maintenanceData.repair_content || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Tình trạng hiện tại"
          :span="2"
        >
          {{ maintenanceData.current_condition || maintenanceData.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="Thuyết minh nhu cầu sửa chữa"
          :span="2"
        >
          {{ maintenanceData.justification || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Chi phí dự kiến">
          {{ maintenanceData.estimated_cost || maintenanceData.cost ? formatCurrency(maintenanceData.estimated_cost || maintenanceData.cost) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Mức độ ưu tiên">
          <el-tag :type="getUrgencyType(maintenanceData.urgency)">
            {{ getUrgencyText(maintenanceData.urgency) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Trạng thái">
          <el-tag :type="getStatusType(maintenanceData.status)">
            {{ getStatusText(maintenanceData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Người tạo">
          {{ maintenanceData.requester?.fullname || maintenanceData.requester?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Ngày tạo">
          {{ formatDate(createdDate) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Current Approval Status -->
      <div
        v-if="maintenanceData"
        class="approval-status"
      >
        <h4>Trạng thái phê duyệt của Admin</h4>
        <el-steps
          :active="getApprovalStep(maintenanceData.status)"
          :finish-status="isRejected ? 'error' : 'success'"
          align-center
        >
          <el-step
            :title="stepInfo.admin.title"
            description="Admin"
            :status="stepInfo.admin.status"
            :icon="stepInfo.admin.icon"
          />
          <el-step
            v-if="maintenanceData.status === 'repair_completed' || maintenanceData.status === 'repair_approved'"
            title="Chờ duyệt hoàn thành"
            description="Quản trị viên"
          />
        </el-steps>
      </div>
    </div>

    <!-- Tiến trình xử lý (Processing Timeline) -->
    <div
      v-if="maintenanceData && processTimeline.length > 0"
      class="status-timeline"
    >
      <h4>Tiến trình xử lý</h4>
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in processTimeline"
          :key="index"
          :timestamp="item.date"
          :type="item.type"
          placement="top"
        >
          <div>
            <span>{{ item.label }}</span>
            <span
              v-if="item.actor"
              style="color: #606266;"
            > bởi {{ item.actor }}</span>
            <div
              v-if="item.reason"
              style="margin-top: 4px; color: #f56c6c; font-size: 13px;"
            >
              Lý do: {{ item.reason }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <!-- Approval buttons based on current level -->
        <template v-if="canApprove">
          <el-button
            type="success"
            @click="handleApprove"
          >
            {{ getApproveButtonText }}
          </el-button>
          <el-button
            type="danger"
            @click="handleReject"
          >
            Từ chối
          </el-button>
        </template>
        <!-- Admin: nút Chuyển sang Tăng tài sản (chỉ khi chưa có phiếu liên kết) -->
        <template v-else-if="canUpdateStatus && authStore.isAdmin && maintenanceData?.request_type === 'procurement'">
          <el-button
            v-if="!maintenanceData?.linked_procurement_id"
            type="primary"
            :loading="toProLoading"
            @click="handleToProcurement"
          >
            Chuyển sang Tăng tài sản
          </el-button>
        </template>
        <!-- Admin: nút sửa chữa (chỉ admin mới hoàn thành sửa chữa) -->
        <template v-else-if="canUpdateStatus && authStore.isAdmin && maintenanceData?.request_type !== 'procurement'">
          <!-- Nút Chuyển sang Thanh lý/Tiêu hủy (admin, khi đang sửa chữa) -->
          <el-button
            v-if="authStore.isAdmin && maintenanceData?.status === 'in_progress' && !maintenanceData?.linked_disposal_case_id"
            type="warning"
            :loading="toDisposalLoading"
            @click="handleToDisposal"
          >
            Chuyển sang Thanh lý/Tiêu hủy
          </el-button>
          <el-button
            v-if="maintenanceData?.status === 'in_progress'"
            type="success"
            @click="handleComplete"
          >
            Đánh dấu hoàn thành sửa chữa
          </el-button>
        </template>
        <!-- Admin: xem hồ sơ Thanh lý/Tiêu hủy (hiển thị mọi lúc khi đã có liên kết) -->
        <el-button
          v-if="authStore.isAdmin && maintenanceData?.linked_disposal_case_id"
          type="warning"
          @click="router.push({ path: '/asset-disposals', query: { openId: String(maintenanceData.linked_disposal_case_id) } }); $emit('update:visible', false)"
        >
          Xem hồ sơ Thanh lý/Tiêu hủy
        </el-button>
        <!-- Admin: xem phiếu Tăng tài sản (hiển thị mọi lúc khi đã có liên kết) -->
        <el-button
          v-if="authStore.isAdmin && maintenanceData?.linked_procurement_id"
          type="success"
          @click="router.push({ path: '/procurements', query: { openId: String(maintenanceData.linked_procurement_id) } }); $emit('update:visible', false)"
        >
          Xem phiếu Tăng tài sản
        </el-button>
        <el-button @click="$emit('update:visible', false)">
          {{ $t('common.close') }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <FulfillProcurementDialog
    v-if="maintenanceData"
    :visible="fulfillDialogVisible"
    :request="maintenanceData"
    @update:visible="fulfillDialogVisible = $event"
    @success="() => { fulfillDialogVisible = false; emit('update'); emit('update:visible', false); }"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Picture, Refresh, CircleCloseFilled } from '@element-plus/icons-vue';
import moment from 'moment';
import api from '@/services/api';
import FulfillProcurementDialog from './FulfillProcurementDialog.vue';
import procurementService from '@/services/procurement.service';
import assetDisposalService from '@/services/assetDisposal.service';
import { useRouter } from 'vue-router';

const props = defineProps<{
  visible: boolean;
  maintenance: any;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  update: [];
}>();

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const approvalHistory = ref<any[]>([]);
const fullMaintenanceData = ref<any>(null);
const fulfillDialogVisible = ref(false);
const toProLoading = ref(false);
const toDisposalLoading = ref(false);

// Computed property để lấy ngày tạo (hỗ trợ cả snake_case và camelCase)
const createdDate = computed(() => {
  const data = fullMaintenanceData.value || props.maintenance;
  if (!data) return null;
  return data.created_at || data.createdAt || null;
});

// Computed property để lấy maintenance data (ưu tiên full data nếu có)
const maintenanceData = computed(() => {
  return fullMaintenanceData.value || props.maintenance;
});

// Computed property để kiểm tra có damageImages không
const hasDamageImages = computed(() => {
  const maintenance = maintenanceData.value;
  if (!maintenance) return false;
  
  // Kiểm tra association damageImages (khuyên dùng)
  if (maintenance.damageImages && Array.isArray(maintenance.damageImages) && maintenance.damageImages.length > 0) {
    return true;
  }
  
  // Kiểm tra fallback damage_images (chứa JSON string hoặc array base64)
  if (maintenance.damage_images) {
    try {
      const parsed = typeof maintenance.damage_images === 'string' 
        ? JSON.parse(maintenance.damage_images) 
        : maintenance.damage_images;
      return Array.isArray(parsed) && parsed.length > 0;
    } catch (e) {
      return false;
    }
  }
  
  return false;
});

const resolveImageUrl = (image: any): string => {
  if (image.url) return image.url;
  if (image.image_path) {
    const p = image.image_path;
    if (p.startsWith('/storage/')) return p;
    return `/storage/${p.replace(/^storage\//, '')}`;
  }
  return '';
};

const availableDamageImageUrls = computed(() => {
  const m = maintenanceData.value;
  if (!m?.damageImages || !Array.isArray(m.damageImages)) return [];
  return m.damageImages
    .filter((img: any) => img.file_exists !== false)
    .map((img: any) => resolveImageUrl(img))
    .filter((u: string) => !!u);
});

const missingImagesCount = computed(() => {
  const m = maintenanceData.value;
  if (!m?.damageImages || !Array.isArray(m.damageImages)) return 0;
  return m.damageImages.filter((img: any) => img.file_exists === false).length;
});

// Helper function to parse images from JSON or array
// Hỗ trợ cả base64, URL tuyệt đối và đường dẫn tương đối từ backend (image_path)
const parseImages = (data: any) => {
  if (!data) return [];

  const normalizePath = (value: any) => {
    if (!value) return null;
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    // Base64 hoặc URL tuyệt đối: dùng nguyên giá trị
    if (trimmed.startsWith('data:image') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Đã có prefix /storage
    if (trimmed.startsWith('/storage/')) {
      return trimmed;
    }

    // Đường dẫn tương đối trong storage (ví dụ: "maintenance/1/1.png")
    return `/storage/${trimmed.replace(/^storage\//, '')}`;
  };

  const toArray = (raw: any) => {
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const rawImages = toArray(data);
  return rawImages
    .map((img: any) => {
      if (typeof img === 'string') {
        return normalizePath(img);
      }
      // Trường hợp object { url, image_path, ... }
      if (img.url) return normalizePath(img.url);
      if (img.image_path) return normalizePath(img.image_path);
      return null;
    })
    .filter((v: string | null): v is string => !!v);
};

// Fetch approval history when dialog opens
let isFetching = false;

// Watch for maintenance changes to reload data
watch(() => props.maintenance?.id, async (newId, oldId) => {
  if (newId && newId !== oldId && props.visible && !isFetching) {
    console.log('🔄 [MaintenanceDetailDialog] Maintenance ID changed, reloading...', { oldId, newId });
    await fetchMaintenanceData();
  }
}, { immediate: false });

// Watch for dialog visibility
watch(() => props.visible, async (newVal) => {
  if (newVal && props.maintenance?.id && !isFetching) {
    await fetchMaintenanceData();
  }
});

// Function to fetch maintenance data
async function fetchMaintenanceData() {
  if (isFetching || !props.maintenance?.id) return;
  
  isFetching = true;
  loading.value = true;
    try {
      // Fetch full maintenance data to ensure we have all fields
      let maintenanceData = null;
      try {
        const response: any = await api.get(`/maintenance/${props.maintenance.id}`);
        console.log('📥 [MaintenanceDetailDialog] Raw API response:', response);
        
        // API interceptor trả về response.data từ axios
        // Backend trả về: { success: true, data: {...maintenance...} }
        // Vậy response sẽ là: { success: true, data: {...maintenance...} }
        
        // Handle different response structures
        // API interceptor returns response.data from axios, so:
        // - Backend returns: { success: true, data: {...maintenance...} }
        // - Axios wraps it: { data: { success: true, data: {...maintenance...} } }
        // - API interceptor extracts: { success: true, data: {...maintenance...} }
        // So response here is: { success: true, data: {...maintenance...} }
        
        // CRITICAL: Extract maintenance data with priority order
        if (response?.success && response?.data && response.data.id) {
          maintenanceData = response.data;
        } else if (response?.data && response.data.id) {
          maintenanceData = response.data;
        } else if (response?.id) {
          maintenanceData = response;
        } else {
          maintenanceData = response;
        }
        
        console.log('✅ [MaintenanceDetailDialog] Processed maintenance data:', {
          id: maintenanceData?.id,
          hasAsset: !!maintenanceData?.asset,
          purchasePrice: maintenanceData?.asset?.purchase_price,
          hasDamageImagesResult: !!(maintenanceData?.damageImages && maintenanceData.damageImages.length > 0),
          damageImagesCount: maintenanceData?.damageImages?.length || 0
        });
        
        // Ensure damageImages association is available
        if (maintenanceData) {
          // Check for damageImages association (from backend relationship)
          if (maintenanceData.damageImages && Array.isArray(maintenanceData.damageImages)) {
            console.log('✅ [MaintenanceDetailDialog] Found damageImages association:', maintenanceData.damageImages.length);
          } else if (response?.data?.damageImages && Array.isArray(response.data.damageImages)) {
            maintenanceData.damageImages = response.data.damageImages;
            console.log('✅ [MaintenanceDetailDialog] Found damageImages in response.data');
          }
          
          // Force reactivity by creating a new object reference
          maintenanceData = { ...maintenanceData };
          
          console.log('🔍 [MaintenanceDetailDialog] Damage images loaded:', {
            hasDamageImages: maintenanceData.damageImages && Array.isArray(maintenanceData.damageImages),
            damageImagesCount: maintenanceData.damageImages ? maintenanceData.damageImages.length : 0,
          });
        }
        
        fullMaintenanceData.value = maintenanceData;
      } catch (error) {
        console.error('❌ Error fetching full maintenance data:', error);
        // Continue with props.maintenance if fetch fails
        fullMaintenanceData.value = null;
        maintenanceData = null;
      } finally {
        isFetching = false;
        loading.value = false;
      }
      
      await fetchApprovalHistory();
      
      // Debug: log maintenance data to check created_at
      // Đảm bảo biến maintenance luôn được định nghĩa
      const maintenance = maintenanceData || fullMaintenanceData.value || props.maintenance;
      if (maintenance) {
        console.log('Maintenance data for debugging:', {
          id: maintenance.id,
          created_at: maintenance.created_at,
          createdAt: maintenance.createdAt,
          status: maintenance.status,
          hasDamageImages: maintenance.damageImages && Array.isArray(maintenance.damageImages) && maintenance.damageImages.length > 0,
          damageImagesCount: maintenance.damageImages ? maintenance.damageImages.length : 0,
          allKeys: Object.keys(maintenance),
        });
      }
    } catch (error) {
      console.error('❌ [MaintenanceDetailDialog] Error in fetchMaintenanceData:', error);
      fullMaintenanceData.value = null;
    }
}

// Watch for dialog close to reset data
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    // Reset when dialog closes
    fullMaintenanceData.value = null;
    isFetching = false;
  }
});

const fetchApprovalHistory = async () => {
  if (!props.maintenance?.id) return;
  try {
    loading.value = true;
    const response: any = await api.get(`/maintenance/${props.maintenance.id}/approval-history`);
    approvalHistory.value = response.data || [];
  } catch (error) {
    console.error('Error fetching approval history:', error);
  } finally {
    loading.value = false;
  }
};

const canUpdateStatus = computed(() => {
  const data = maintenanceData.value;
  return data && ['approved_by_admin', 'approved_by_director', 'in_progress'].includes(data.status);
});

// Check if current user can approve at current level
const canApprove = computed(() => {
  const data = maintenanceData.value;
  if (!data || !authStore.user) return false;
  
  const status = data.status;
  const userRole = authStore.user.role;
  
  return userRole === 'admin' && (
    ['pending', 'new', 'approved_by_head', 'approved_by_admin'].includes(status)
    || status === 'repair_completed'
  );
});

const getApproveButtonText = computed(() => {
  const data = maintenanceData.value;
  if (!data || !authStore.user) return 'Phê duyệt';
  
  const status = data.status;
  const userRole = authStore.user.role;
  
  if (userRole === 'admin' && ['pending', 'new', 'approved_by_head', 'approved_by_admin'].includes(status)) {
    return 'Phê duyệt (Admin)';
  }
  if (userRole === 'admin' && status === 'repair_completed') {
    return 'Duyệt hoàn thành sửa chữa';
  }
  
  return 'Phê duyệt';
});

const getApprovalStep = (status: string) => {
  if (status === 'pending' || status === 'new' || status === 'draft') return 0;
  if (status === 'approved_by_head') return 1;
  if (status === 'rejected_by_head') return 1;
  if (status === 'approved_by_admin') return 2;
  if (status === 'rejected_by_admin') return 2;
  if (status === 'approved_by_director' || status === 'in_progress') return 3;
  if (status === 'rejected_by_director') return 3;
  if (status === 'repair_completed' || status === 'repair_approved' || status === 'completed' || status === 'done') return 4;
  return 0;
};

const isRejected = computed(() => {
  const s = maintenanceData.value?.status || '';
  return s.startsWith('rejected_by_');
});

const stepInfo = computed(() => {
  const s = maintenanceData.value?.status || '';

  const headApproved = !['pending', 'new', 'draft', 'rejected_by_head'].includes(s);
  const headRejected = s === 'rejected_by_head';
  const adminApproved = !['pending', 'new', 'draft', 'approved_by_head', 'rejected_by_head', 'rejected_by_admin'].includes(s);
  const adminRejected = s === 'rejected_by_admin';
  const directorApproved = ['approved_by_director', 'in_progress', 'repair_completed', 'repair_approved', 'completed', 'done'].includes(s);
  const directorRejected = s === 'rejected_by_director';

  return {
    head: {
      title: headRejected ? 'Từ chối' : (headApproved ? 'Đã duyệt' : 'Xác nhận'),
      status: headRejected ? 'error' : undefined,
      icon: headRejected ? CircleCloseFilled : undefined,
    },
    admin: {
      title: adminRejected ? 'Từ chối' : (adminApproved ? 'Đã duyệt' : 'Xác nhận'),
      status: adminRejected ? 'error' : undefined,
      icon: adminRejected ? CircleCloseFilled : undefined,
    },
    director: {
      title: directorRejected ? 'Từ chối' : (directorApproved ? 'Đã duyệt' : 'Phê duyệt'),
      status: directorRejected ? 'error' : undefined,
      icon: directorRejected ? CircleCloseFilled : undefined,
    },
  };
});

const handleApprove = async () => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn phê duyệt yêu cầu này?',
      'Xác nhận phê duyệt',
      {
        type: 'warning',
        confirmButtonText: 'Phê duyệt',
        cancelButtonText: 'Hủy',
      }
    );
    
    loading.value = true;
    await api.put(`/maintenance/${props.maintenance.id}/approve`);
    ElMessage.success('Đã phê duyệt thành công');
    // Close dialog first to prevent multiple updates
    emit('update:visible', false);
    // Emit update to refresh parent list
    emit('update');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
    }
  } finally {
    loading.value = false;
  }
};

const handleReject = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      'Vui lòng nhập lý do từ chối',
      'Từ chối yêu cầu',
      {
        confirmButtonText: 'Từ chối',
        cancelButtonText: 'Hủy',
        inputType: 'textarea',
        inputPlaceholder: 'Nhập lý do từ chối...',
        inputValidator: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Lý do từ chối là bắt buộc';
          }
          return true;
        },
      }
    );
    
    loading.value = true;
    await api.post(`/maintenance/${props.maintenance.id}/process-approval`, {
      decision: 'rejected',
      reason: reason,
    });
    ElMessage.success('Đã từ chối yêu cầu');
    // Close dialog first to prevent multiple updates
    emit('update:visible', false);
    // Emit update to refresh parent list
    emit('update');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
    }
  } finally {
    loading.value = false;
  }
};

const handleToProcurement = async () => {
  try {
    toProLoading.value = true;
    const res: any = await procurementService.createFromMaintenance(props.maintenance.id);
    const procId = res?.data?.id;
    ElMessage.success('Đã tạo phiếu Tăng tài sản. Đang chuyển hướng...');
    emit('update');
    emit('update:visible', false);
    await router.push({ path: '/procurements', query: { openId: String(procId) } });
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || error.message || t('common.error'));
  } finally {
    toProLoading.value = false;
  }
};

const handleToDisposal = async () => {
  try {
    const { value: disposalType } = await ElMessageBox.confirm(
      'Chuyển tài sản này sang hồ sơ Thanh lý hay Tiêu hủy?',
      'Chuyển sang Thanh lý / Tiêu hủy',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: 'Thanh lý',
        cancelButtonText: 'Tiêu hủy',
        type: 'warning',
      }
    ).then(() => 'liquidation').catch((action: string) => action === 'cancel' ? 'destruction' : null);

    if (!disposalType) return; // user closed dialog

    toDisposalLoading.value = true;
    const res: any = await assetDisposalService.createFromMaintenance(props.maintenance.id, disposalType as any);
    const caseId = res?.data?.id;
    ElMessage.success('Đã tạo hồ sơ Thanh lý/Tiêu hủy. Đang chuyển hướng...');
    emit('update');
    emit('update:visible', false);
    await router.push({ path: '/asset-disposals', query: { openId: String(caseId) } });
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.response?.data?.message || error.message || t('common.error'));
    }
  } finally {
    toDisposalLoading.value = false;
  }
};

const handleComplete = async () => {
  try {
    await api.post(`/maintenance/${props.maintenance.id}/complete-repair`);
    ElMessage.success('Đã đánh dấu hoàn thành sửa chữa.');
    emit('update');
    emit('update:visible', false);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || error.message || t('common.error'));
  }
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    draft: 'info',
    new: 'info',
    pending: 'warning',
    approved: 'primary',
    approved_by_head: 'primary',
    approved_by_admin: 'primary',
    approved_by_director: 'success',
    in_progress: 'warning',
    repair_completed: 'info',
    repair_approved: 'success',
    done: 'success',
    completed: 'success',
    rejected: 'danger',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
    rejected_by_director: 'danger',
  };
  return types[status] || 'info'; // Default to 'info' instead of empty string to fix ElTag validation error
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'Nháp',
    new: t('maintenance.status.new'),
    pending: 'Chờ phê duyệt',
    approved: t('maintenance.status.approved'),
    approved_by_head: 'Trưởng Đơn vị đã duyệt',
    approved_by_admin: 'Quản trị viên đã duyệt',
    approved_by_director: 'Giám hiệu đã duyệt',
    in_progress: t('maintenance.status.in_progress'),
    repair_completed: 'Đã hoàn thành sửa chữa (chờ duyệt)',
    repair_approved: 'Đã duyệt hoàn thành sửa chữa',
    done: t('maintenance.status.done'),
    completed: 'Hoàn tất',
    rejected: t('maintenance.status.rejected'),
    rejected_by_head: 'Trưởng Đơn vị từ chối',
    rejected_by_admin: 'Quản trị viên từ chối',
    rejected_by_director: 'Giám hiệu từ chối',
  };
  return statusMap[status] || t(`maintenance.status.${status}`) || status;
};

const getUrgencyType = (urgency: string) => {
  const types: Record<string, string> = {
    low: 'info',
    normal: 'info', // Changed from '' to 'info' to fix ElTag validation error
    high: 'warning',
    critical: 'danger',
  };
  return types[urgency] || 'info'; // Default to 'info' instead of empty string
};

const getUrgencyText = (urgency: string) => {
  return t(`maintenance.urgency_level.${urgency}`);
};

const getAssetStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    damaged: 'danger',
    pending_repair: 'warning',
    pending_disposal: 'danger',
    disposed: 'info',
    lost: 'danger',
  };
  return types[status] || 'info';
};

const getAssetStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'Đang sử dụng',
    inactive: 'Không sử dụng',
    damaged: 'Hư hỏng',
    pending_repair: 'Chờ sửa chữa',
    pending_disposal: 'Chờ thanh lý',
    disposed: 'Đã thanh lý',
    lost: 'Mất',
  };
  return statusMap[status] || status;
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  try {
    // Handle both string and Date objects, and both snake_case and camelCase
    const dateValue = date;
    const momentDate = moment(dateValue);
    if (!momentDate.isValid()) {
      console.warn('Invalid date format:', date);
      return '-';
    }
    return momentDate.format('DD/MM/YYYY HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return '-';
  }
};

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined) return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericValue);
};

// Computed property for processing timeline - combines creation, approvals, and status changes
// Sorted by actual timestamp
const processTimeline = computed(() => {
  const data = maintenanceData.value;
  if (!data) return [];
  
  interface TimelineItem {
    date: string;
    timestamp: number; // For sorting
    label: string;
    type: string;
    actor?: string;
    reason?: string;
  }
  
  const timeline: TimelineItem[] = [];
  
  // Helper to parse date and get timestamp
  const getTimestamp = (dateValue: string | Date | null | undefined): number => {
    if (!dateValue) return 0;
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };
  
  // 1. Add creation date
  if (createdDate.value) {
    timeline.push({
      date: formatDate(createdDate.value) || '-',
      timestamp: getTimestamp(createdDate.value),
      label: 'Yêu cầu được tạo',
      type: 'primary',
      actor: data.requester?.fullname || data.requester?.username,
    });
  }
  
  // 2. Add approval/rejection events from approvalHistory (more accurate timestamps)
  if (approvalHistory.value && approvalHistory.value.length > 0) {
    approvalHistory.value.forEach((item: any) => {
      const isApproved = item.decision === 'approved';
      let label = '';
      if (item.approval_level === 1) {
        label = isApproved ? 'Đã duyệt (Trưởng Đơn vị)' : 'Đã từ chối (Trưởng Đơn vị)';
      } else if (item.approval_level === 2) {
        label = isApproved ? 'Đã duyệt (Quản trị viên)' : 'Đã từ chối (Quản trị viên)';
      } else if (item.approval_level === 3) {
        label = isApproved ? 'Đã duyệt (Giám hiệu)' : 'Đã từ chối (Giám hiệu)';
      } else if (item.approval_level === 4) {
        label = 'Bắt đầu sửa chữa';
      } else if (item.approval_level === 5) {
        label = 'Báo hoàn thành sửa chữa';
      } else if (item.approval_level === 6) {
        label = isApproved ? 'Xác nhận hoàn thành sửa chữa' : 'Từ chối hoàn thành sửa chữa';
      }
      
      timeline.push({
        date: formatDate(item.decided_at) || '-',
        timestamp: getTimestamp(item.decided_at),
        label,
        type: isApproved ? 'success' : 'danger',
        actor: item.approver?.fullname || item.approver_name,
        reason: !isApproved ? item.reason : undefined,
      });
    });
  } else {
    // Fallback: use maintenance data fields if approvalHistory is empty
    // This handles cases where approval history API hasn't been called yet
    
    if (data.head_approved_at) {
      timeline.push({
        date: formatDate(data.head_approved_at) || '-',
        timestamp: getTimestamp(data.head_approved_at),
        label: 'Trưởng Đơn vị đã duyệt',
        type: 'success',
        actor: data.headApprover?.fullname || data.headApprover?.username,
      });
    }
    
    if (data.admin_approved_at) {
      timeline.push({
        date: formatDate(data.admin_approved_at) || '-',
        timestamp: getTimestamp(data.admin_approved_at),
        label: 'Quản trị viên đã duyệt',
        type: 'success',
        actor: data.adminApprover?.fullname || data.adminApprover?.username,
      });
    }
    
    if (data.director_approved_at) {
      timeline.push({
        date: formatDate(data.director_approved_at) || '-',
        timestamp: getTimestamp(data.director_approved_at),
        label: 'Giám hiệu đã duyệt',
        type: 'success',
        actor: data.directorApprover?.fullname || data.directorApprover?.username,
      });
    }
    
    // Add rejection if exists and not in approvalHistory
    if (data.rejected_at) {
      timeline.push({
        date: formatDate(data.rejected_at) || '-',
        timestamp: getTimestamp(data.rejected_at),
        label: 'Đã từ chối',
        type: 'danger',
        actor: data.rejector?.fullname || data.rejector?.username,
        reason: data.rejection_reason || data.justification, // Use justification as fallback
      });
    }
  }
  
  // 3. Add start date (for repair requests)
  if (data.start_date) {
    timeline.push({
      date: formatDate(data.start_date) || '-',
      timestamp: getTimestamp(data.start_date),
      label: 'Bắt đầu sửa chữa',
      type: 'warning',
    });
  }
  
  // 4. Add completion date
  if (data.completion_date) {
    timeline.push({
      date: formatDate(data.completion_date) || '-',
      timestamp: getTimestamp(data.completion_date),
      label: 'Hoàn thành sửa chữa',
      type: 'success',
    });
  }
  
  // Sort by timestamp (ascending - oldest first)
  timeline.sort((a, b) => a.timestamp - b.timestamp);
  
  return timeline;
});
</script>

<style scoped>
.status-timeline {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.status-timeline h4 {
  margin-bottom: 15px;
  color: #303133;
}

.approval-status {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.approval-status h4 {
  margin-bottom: 15px;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Cải thiện layout của descriptions */
:deep(.el-descriptions) {
  margin-bottom: 20px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: #606266;
  width: 180px;
}

:deep(.el-descriptions__content) {
  color: #303133;
}

:deep(.el-descriptions__body) {
  padding: 20px;
}

:deep(.el-descriptions__table) {
  width: 100%;
}

:deep(.el-descriptions__table .el-descriptions__cell) {
  padding: 12px 16px;
}

.dialog-header {
  display: flex;
  align-items: center;
}

.dialog-header .title {
  font-size: 18px;
  font-weight: 600;
}

.damage-images-display {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.damage-image-display {
  width: 80px;
  height: 80px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.damage-image-display:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #409eff;
}

.damage-image-wrapper {
  display: flex;
  flex-direction: column;
}

.damage-image-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  text-align: center;
}

.damage-image-missing {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  color: #f56c6c;
  font-size: 12px;
  text-align: center;
  padding: 4px;
}

.damage-image-missing .el-icon {
  margin-bottom: 4px;
  color: #f56c6c;
}
</style>
