<template>
  <el-dialog
    v-model="visible"
    width="900px"
    :title="title"
    destroy-on-close
  >
    <div v-loading="loading">
      <template v-if="data">
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="Mã hồ sơ">
            {{ data.code }}
          </el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="statusTagType(data.status)">
              {{ statusLabel(data.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Ngày tạo">
            {{ formatDateTime(data.created_at || data.createdAt) }}
          </el-descriptions-item>
          <el-form-item
            v-if="data.decision_file_url"
            label="Tập tin đính kèm"
          >
            <el-link
              :href="data.decision_file_url"
              target="_blank"
              type="primary"
            >
              <el-icon><Document /></el-icon> Xem quyết định
            </el-link>
          </el-form-item>
        </el-descriptions>

        <div style="margin-top: 14px">
          <el-table
            :data="data.items || []"
            style="width: 100%"
            height="320"
          >
            <el-table-column
              label="Mã tài sản"
              width="160"
            >
              <template #default="scope">
                {{ scope.row.asset?.asset_code || '—' }}
              </template>
            </el-table-column>
            <el-table-column
              label="Tên tài sản"
              min-width="240"
            >
              <template #default="scope">
                {{ scope.row.asset?.name || '—' }}
              </template>
            </el-table-column>
            <el-table-column
              label="Lý do"
              min-width="220"
            >
              <template #default="scope">
                {{ scope.row.reason || scope.row.inventory_detail?.disposal_reason || '—' }}
              </template>
            </el-table-column>
            <el-table-column
              label="Từ đơn vị"
              width="180"
            >
              <template #default="scope">
                {{ scope.row.moved_from_department?.name || '—' }}
              </template>
            </el-table-column>
            <el-table-column
              label="Chuyển lúc"
              width="170"
            >
              <template #default="scope">
                {{ formatDateTime(scope.row.moved_at) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-divider />

        <el-form
          v-if="data.status === 'pending' && isAdminOrDirector"
          :model="form"
          label-width="160px"
        >
          <el-form-item
            label="Số quyết định"
            required
          >
            <el-input
              v-model="form.decision_no"
              placeholder="Nhập số quyết định"
            />
          </el-form-item>
          <el-form-item label="Ngày quyết định">
            <el-date-picker
              v-model="form.decision_date"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item
            v-if="!form.decision_file_url"
            label="Tải lên quyết định"
          >
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              :accept="'.pdf,.doc,.docx,.jpg,.jpeg,.png'"
            >
              <el-button type="primary">
                Chọn tệp
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  Định dạng: PDF, Word, JPG, PNG (tối đa 20MB)
                </div>
              </template>
            </el-upload>
            <div
              v-if="selectedFile"
              class="file-info"
            >
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
              <el-button
                type="text"
                class="remove-file"
                @click="removeFile"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </el-form-item>
          <el-form-item v-else>
            <el-link
              :href="form.decision_file_url"
              target="_blank"
              type="primary"
            >
              <el-icon><Document /></el-icon> Xem quyết định đã tải lên
            </el-link>
            <el-button
              type="text"
              class="remove-file"
              @click="form.decision_file_url = null"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </el-form-item>
          <el-form-item label="Ghi chú">
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-form>

        <el-alert
          v-else-if="data.status === 'pending' && !isAdminOrDirector"
          type="info"
          :closable="false"
          title="Hồ sơ đang chờ Quản lý / Giám hiệu phê duyệt."
          show-icon
          style="margin-top: 12px"
        />

        <el-alert
          v-else
          type="success"
          :closable="false"
          title="Hồ sơ đã hoàn tất. Tài sản trong hồ sơ đã chuyển sang trạng thái đã thanh lý."
          style="margin-top: 12px"
        />
      </template>
    </div>

    <template #footer>
      <el-button @click="visible = false">
        Đóng
      </el-button>
      <el-button
        v-if="data"
        :loading="printingMinutes"
        @click="printMinutes"
      >
        In biên bản
      </el-button>
      <el-button
        v-if="data"
        :loading="printingProposal"
        @click="printProposal"
      >
        In 01/TSC-XLTS
      </el-button>
      <el-button
        v-if="data"
        :loading="printingHandover"
        @click="printHandover"
      >
        In 02/TSC-BBGN
      </el-button>
      <el-button
        v-if="data?.status === 'pending' && isAdminOrDirector"
        @click="openEdit"
      >
        Sửa hồ sơ
      </el-button>
      <el-button
        v-if="data?.status === 'pending' && isAdminOrDirector"
        type="danger"
        plain
        :loading="deletingCase"
        @click="removeCase"
      >
        Xóa hồ sơ
      </el-button>
      <el-button
        v-if="data?.status === 'pending' && isAdminOrDirector"
        type="primary"
        :loading="submitting"
        :disabled="!form.decision_no || (!form.decision_file_url && !selectedFile)"
        @click="complete"
      >
        {{ submitting ? 'Đang xử lý...' : 'Hoàn tất thủ tục' }}
      </el-button>
    </template>
  </el-dialog>

  <!-- Dialog sửa hồ sơ (chỉ khi pending) -->
  <el-dialog
    v-model="showEditDialog"
    title="Sửa hồ sơ"
    width="520px"
    append-to-body
  >
    <el-form label-width="150px">
      <el-form-item label="Hình thức">
        <el-select
          v-model="editForm.disposal_type"
          style="width: 100%"
        >
          <el-option
            value="liquidation"
            label="Bán thanh lý"
          />
          <el-option
            value="destruction"
            label="Tiêu hủy"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="editForm.disposal_type === 'liquidation'"
        label="Phương thức thanh lý"
      >
        <el-select
          v-model="editForm.disposal_method"
          style="width: 100%"
        >
          <el-option
            label="Bán đấu giá"
            value="sell_auction"
          />
          <el-option
            label="Bán niêm yết giá"
            value="sell_listed"
          />
          <el-option
            label="Bán chỉ định"
            value="sell_direct"
          />
        </el-select>
        <el-alert
          v-if="editDirectInvalid"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 6px;"
          title="Chỉ định không áp dụng cho ô tô. Lựa chọn hiện tại có thể không phù hợp (QĐ 186/2025)."
        />
      </el-form-item>
      <el-form-item
        v-else
        label="Phương thức tiêu hủy"
      >
        <el-input
          v-model="editForm.destruction_method"
          placeholder="VD: hóa chất, cơ học..."
        />
      </el-form-item>
      <el-form-item label="Số quyết định">
        <el-input
          v-model="editForm.decision_no"
          placeholder="Số quyết định..."
        />
      </el-form-item>
      <el-form-item label="Ngày quyết định">
        <el-date-picker
          v-model="editForm.decision_date"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="Tài sản trong hồ sơ">
        <el-select
          v-model="editAssetIds"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          :loading="loadingEditAssets"
          placeholder="Chọn tài sản..."
          style="width: 100%"
        >
          <el-option
            v-for="opt in editAssetOptions"
            :key="opt.id"
            :value="opt.id"
            :label="opt.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Ghi chú">
        <el-input
          v-model="editForm.notes"
          type="textarea"
          :rows="3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditDialog = false">
        Hủy
      </el-button>
      <el-button
        type="primary"
        :loading="savingEdit"
        @click="saveEdit"
      >
        Lưu
      </el-button>
    </template>
  </el-dialog>

  <SignaturePad
    v-model="showSignDialog"
    :title="signTitle"
    :signer-name="signerName"
    @confirm="onSignConfirm"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Document, Close } from '@element-plus/icons-vue';
import assetDisposalService from '@/services/assetDisposal.service';
import { useAuthStore } from '@/stores/auth.store';
import { useSignature } from '@/composables/useSignature';
import SignaturePad from '@/components/Common/SignaturePad.vue';
import api from '@/services/api';
import { openPrintWindow, escapeHtml, signatureCell } from '@/utils/print';

const props = defineProps<{ modelValue: boolean; caseId: number | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'completed'): void }>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const authStore = useAuthStore();
const {
  show: showSignDialog,
  title: signTitle,
  signerName: signerName,
  request: requestSignature,
  onConfirm: onSignConfirm,
} = useSignature();
const isAdminOrDirector = computed(() => ['admin', 'director'].includes(authStore.user?.role || ''));

const loading = ref(false);
const submitting = ref(false);
const data = ref<any | null>(null);
const uploadRef = ref<any>();
const selectedFile = ref<File | null>(null);

const form = ref({
  decision_no: '',
  decision_date: null as string | null,
  decision_file_url: null as string | null,
  notes: null as string | null,
});

// Sửa / xóa hồ sơ khi chưa hoàn tất
const showEditDialog = ref(false);
const savingEdit = ref(false);
const deletingCase = ref(false);
const editForm = ref({
  disposal_type: 'liquidation' as 'liquidation' | 'destruction',
  destruction_method: '',
  disposal_method: '',
  notes: '',
  decision_no: '',
  decision_date: null as string | null,
});
const editAssetIds = ref<number[]>([]);
const editAssetOptions = ref<Array<{ id: number; label: string }>>([]);
const loadingEditAssets = ref(false);

const editHasCar = computed(() =>
  (data.value?.items || []).some((it: any) =>
    /ô tô|ôto|oto|xe ô tô|xe hơi/i.test(`${it.asset?.name || ''}`)
  )
);
const editDirectInvalid = computed(
  () =>
    editForm.value.disposal_type === 'liquidation' &&
    editForm.value.disposal_method === 'sell_direct' &&
    editHasCar.value
);

const loadEditAssetOptions = async () => {
  const map = new Map<number, { id: number; label: string }>();
  for (const it of (data.value?.items || [])) {
    const id = it.asset_id ?? it.asset?.id;
    if (id) {
      map.set(id, {
        id,
        label: `${it.asset?.asset_code || ''} — ${it.asset?.name || ''}`.trim(),
      });
    }
  }
  try {
    loadingEditAssets.value = true;
    const groups: any[] = await assetDisposalService.getPendingDisposalGrouped();
    for (const g of groups || []) {
      for (const a of (g.assets || [])) {
        if (!map.has(a.id)) {
          map.set(a.id, {
            id: a.id,
            label: `${a.asset_code || ''} — ${a.name || ''} (${g.department_name || ''})`.trim(),
          });
        }
      }
    }
  } catch {
    // bỏ qua — vẫn giữ danh sách tài sản hiện tại
  } finally {
    loadingEditAssets.value = false;
  }
  editAssetOptions.value = [...map.values()];
};

const openEdit = async () => {
  const c = data.value;
  if (!c) return;
  editForm.value = {
    disposal_type: c.disposal_type === 'destruction' ? 'destruction' : 'liquidation',
    destruction_method: c.destruction_method || '',
    disposal_method: c.disposal_method || '',
    notes: c.notes || '',
    decision_no: c.decision_no || '',
    decision_date: c.decision_date || null,
  };
  editAssetIds.value = (c.items || []).map((it: any) => it.asset_id ?? it.asset?.id).filter(Boolean);
  editAssetOptions.value = [];
  showEditDialog.value = true;
  await loadEditAssetOptions();
};

const saveEdit = async () => {
  if (!props.caseId) return;
  if (editAssetIds.value.length === 0) {
    ElMessage.warning('Hồ sơ phải có ít nhất 1 tài sản');
    return;
  }
  savingEdit.value = true;
  try {
    await assetDisposalService.updateCase(props.caseId, {
      disposal_type: editForm.value.disposal_type,
      destruction_method: editForm.value.disposal_type === 'destruction' ? (editForm.value.destruction_method || null) : null,
      disposal_method: editForm.value.disposal_type === 'liquidation' ? (editForm.value.disposal_method || null) : null,
      notes: editForm.value.notes || null,
      decision_no: editForm.value.decision_no || null,
      decision_date: editForm.value.decision_date || null,
      asset_ids: editAssetIds.value,
    } as any);
    ElMessage.success('Đã cập nhật hồ sơ');
    showEditDialog.value = false;
    await load();
    emit('completed');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không cập nhật được hồ sơ');
  } finally {
    savingEdit.value = false;
  }
};

const removeCase = async () => {
  if (!props.caseId) return;
  try {
    await ElMessageBox.confirm(
      'Xóa hồ sơ này? Tài sản sẽ trở về trạng thái chờ xử lý để có thể lập hồ sơ mới.',
      'Xác nhận xóa hồ sơ',
      { type: 'warning', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' }
    );
  } catch {
    return;
  }
  deletingCase.value = true;
  try {
    await assetDisposalService.deleteCase(props.caseId);
    ElMessage.success('Đã xóa hồ sơ');
    visible.value = false;
    emit('completed');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không xóa được hồ sơ');
  } finally {
    deletingCase.value = false;
  }
};

const title = computed(() => (data.value ? `Hồ sơ giảm tài sản: ${data.value.code}` : 'Hồ sơ giảm tài sản'));

const printingMinutes = ref(false);
const printMinutes = async () => {
  const c = data.value;
  if (!c) return;
  printingMinutes.value = true;
  try {
    let signatures: any[] = [];
    try {
      const res: any = await api.get('/signatures', {
        params: { entity_type: 'asset_disposal_case', entity_id: props.caseId },
      });
      signatures = res?.data || [];
    } catch { signatures = []; }

    const items = c.items || [];
    const rows = items.map((it: any, idx: number) => `<tr>
        <td class="num">${idx + 1}</td>
        <td>${escapeHtml(it.asset?.asset_code || '')}</td>
        <td>${escapeHtml(it.asset?.name || '')}</td>
        <td class="num">${escapeHtml(it.asset?.unit || '')}</td>
        <td class="num">${escapeHtml(it.asset?.quantity ?? 1)}</td>
      </tr>`).join('');

    const createSig = signatures.find((s) => s.action === 'create');
    const completeSig = signatures.find((s) => s.action === 'complete');
    const typeText = c.disposal_type === 'destruction' ? 'Tiêu hủy' : 'Thanh lý';

    const body = `
      <div class="doc-header">
        <div class="org">${escapeHtml(c.origin_department?.name || '')}</div>
      </div>
      <div class="doc-title">Biên bản ${escapeHtml(typeText)} tài sản</div>
      <div class="doc-sub">Mã hồ sơ: ${escapeHtml(c.code || '')}</div>
      <div class="doc-meta">Số quyết định: <b>${escapeHtml(c.decision_no || '')}</b>${c.decision_date ? ` — Ngày: ${escapeHtml(new Date(c.decision_date).toLocaleDateString('vi-VN'))}` : ''}</div>
      <table class="data">
        <thead><tr><th>STT</th><th>Mã tài sản</th><th>Tên tài sản</th><th>ĐVT</th><th>Số lượng</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">Tổng số tài sản: <b>${items.length}</b>${c.notes ? ` — Ghi chú: ${escapeHtml(c.notes)}` : ''}</div>
      <div class="signatures">
        ${signatureCell('Người lập hồ sơ', createSig)}
        ${signatureCell('Người hoàn tất / phê duyệt', completeSig)}
      </div>`;

    if (!openPrintWindow(`Biên bản ${typeText}`, body)) {
      ElMessage.error('Trình duyệt chặn popup, vui lòng cho phép popup để in biên bản');
    }
  } finally {
    printingMinutes.value = false;
  }
};

const printingProposal = ref(false);
const printingHandover = ref(false);

const fetchCaseSignatures = async () => {
  try {
    const res: any = await api.get('/signatures', {
      params: { entity_type: 'asset_disposal_case', entity_id: props.caseId },
    });
    return res?.data || [];
  } catch {
    return [];
  }
};

/** In Văn bản đề nghị xử lý tài sản công (Mẫu số 01/TSC-XLTS) */
const printProposal = async () => {
  const c = data.value;
  if (!c) return;
  printingProposal.value = true;
  try {
    const signatures = await fetchCaseSignatures();
    const createSig = signatures.find((s: any) => s.action === 'create');
    const items = c.items || [];
    const rows = items.map((it: any, idx: number) => `<tr>
        <td class="num">${idx + 1}</td>
        <td>${escapeHtml(it.asset?.asset_code || '')}</td>
        <td>${escapeHtml(it.asset?.name || '')}</td>
        <td class="num">${escapeHtml(it.asset?.unit || '')}</td>
        <td class="num">${escapeHtml(it.asset?.quantity ?? 1)}</td>
        <td>${escapeHtml(it.reason || '')}</td>
      </tr>`).join('');
    const typeText = c.disposal_type === 'destruction' ? 'tiêu hủy' : 'bán thanh lý';

    const body = `
      <div class="doc-header"><div class="org">${escapeHtml(c.origin_department?.name || '')}</div></div>
      <div class="doc-sub" style="text-align:right; font-size:12px;">Mẫu số 01/TSC-XLTS</div>
      <div class="doc-title">Văn bản đề nghị xử lý tài sản công</div>
      <div class="doc-meta">Kính gửi: Cơ quan quản lý cấp trên / Người có thẩm quyền</div>
      <div class="doc-meta">Mã hồ sơ: <b>${escapeHtml(c.code || '')}</b></div>
      <div class="doc-meta">Số quyết định: <b>${escapeHtml(c.decision_no || '')}</b>${c.decision_date ? ` — Ngày: ${escapeHtml(new Date(c.decision_date).toLocaleDateString('vi-VN'))}` : ''}</div>
      <div class="doc-meta">Hình thức đề nghị xử lý: <b>${escapeHtml(typeText)}</b></div>
      <table class="data">
        <thead><tr><th>STT</th><th>Mã tài sản</th><th>Tên tài sản</th><th>ĐVT</th><th>Số lượng</th><th>Lý do</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">Tổng số tài sản đề nghị xử lý: <b>${items.length}</b>${c.notes ? ` — Ghi chú: ${escapeHtml(c.notes)}` : ''}</div>
      <div class="signatures">
        ${signatureCell('Người lập', createSig)}
        ${signatureCell('Thủ trưởng đơn vị', createSig)}
      </div>`;

    if (!openPrintWindow('Văn bản đề nghị xử lý tài sản công', body)) {
      ElMessage.error('Trình duyệt chặn popup, vui lòng cho phép popup để in');
    }
  } finally {
    printingProposal.value = false;
  }
};

/** In Biên bản bàn giao tài sản (Mẫu số 02/TSC-BBGN) */
const printHandover = async () => {
  const c = data.value;
  if (!c) return;
  printingHandover.value = true;
  try {
    const signatures = await fetchCaseSignatures();
    const createSig = signatures.find((s: any) => s.action === 'create');
    const completeSig = signatures.find((s: any) => s.action === 'complete');
    const items = c.items || [];
    const rows = items.map((it: any, idx: number) => `<tr>
        <td class="num">${idx + 1}</td>
        <td>${escapeHtml(it.asset?.asset_code || '')}</td>
        <td>${escapeHtml(it.asset?.name || '')}</td>
        <td class="num">${escapeHtml(it.asset?.unit || '')}</td>
        <td class="num">${escapeHtml(it.asset?.quantity ?? 1)}</td>
        <td>${escapeHtml(it.reason || '')}</td>
      </tr>`).join('');

    const body = `
      <div class="doc-header"><div class="org">${escapeHtml(c.origin_department?.name || '')}</div></div>
      <div class="doc-sub" style="text-align:right; font-size:12px;">Mẫu số 02/TSC-BBGN</div>
      <div class="doc-title">Biên bản bàn giao tài sản</div>
      <div class="doc-meta">Mã hồ sơ: <b>${escapeHtml(c.code || '')}</b></div>
      <div class="doc-meta">Số quyết định: <b>${escapeHtml(c.decision_no || '')}</b>${c.decision_date ? ` — Ngày: ${escapeHtml(new Date(c.decision_date).toLocaleDateString('vi-VN'))}` : ''}</div>
      <div class="doc-meta">Bên giao: <b>${escapeHtml(c.origin_department?.name || '')}</b></div>
      <div class="doc-meta">Bên nhận: ............................................................</div>
      <table class="data">
        <thead><tr><th>STT</th><th>Mã tài sản</th><th>Tên tài sản</th><th>ĐVT</th><th>Số lượng</th><th>Ghi chú</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">Tổng số tài sản bàn giao: <b>${items.length}</b></div>
      <div class="signatures">
        ${signatureCell('Bên giao', createSig)}
        ${signatureCell('Bên nhận', completeSig)}
        ${signatureCell('Người lập biên bản', createSig)}
      </div>`;

    if (!openPrintWindow('Biên bản bàn giao tài sản', body)) {
      ElMessage.error('Trình duyệt chặn popup, vui lòng cho phép popup để in');
    }
  } finally {
    printingHandover.value = false;
  }
};


const statusLabel = (s: string) => {
  if (s === 'pending') return 'Chờ xử lý';
  if (s === 'completed') return 'Đã hoàn tất';
  if (s === 'cancelled') return 'Đã hủy';
  return s || '—';
};

const statusTagType = (s: string) => {
  if (s === 'pending') return 'warning';
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'info';
  return 'info';
};

const formatDateTime = (v: string) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleFileChange = (file: any) => {
  const isLt20M = (file.raw?.size || 0) < 20 * 1024 * 1024;
  if (!isLt20M) {
    ElMessage.error('Kích thước tệp không được vượt quá 20MB');
    return false;
  }
  selectedFile.value = file.raw as File;
  return false; // Prevent auto upload
};

const removeFile = () => {
  selectedFile.value = null;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

const uploadFile = async (): Promise<string | null> => {
  if (!selectedFile.value || !props.caseId) return null;

  try {
    const response: any = await assetDisposalService.uploadDecisionFile(props.caseId, selectedFile.value);
    return response.decision_file_url || response.data?.decision_file_url || null;
  } catch (error) {
    console.error('Upload failed:', error);
    ElMessage.error('Tải lên tệp thất bại. Vui lòng thử lại.');
    return null;
  }
};

const load = async () => {
  if (!props.caseId) return;
  loading.value = true;
  try {
    const res: any = await assetDisposalService.getCaseById(props.caseId);
    data.value = res?.data || res || null;
    
    // Initialize form with existing data if any
    if (data.value) {
      form.value = {
        decision_no: data.value.decision_no || '',
        decision_date: data.value.decision_date || null,
        decision_file_url: data.value.decision_file_url || null,
        notes: data.value.notes || null,
      };
    }
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.caseId, props.modelValue],
  ([id, open]) => {
    if (open && id) {
      form.value = {
        decision_no: '',
        decision_date: null,
        decision_file_url: null,
        notes: null,
      };
      selectedFile.value = null;
      if (uploadRef.value) {
        uploadRef.value.clearFiles();
      }
      load();
    }
  }
);

const complete = async () => {
  if (!props.caseId) return;
  if (!form.value.decision_no?.trim()) {
    ElMessage.error('Vui lòng nhập số quyết định');
    return;
  }

  if (selectedFile.value && !form.value.decision_file_url) {
    submitting.value = true;
    try {
      const fileUrl = await uploadFile();
      if (!fileUrl) {
        submitting.value = false;
        return;
      }
      form.value.decision_file_url = fileUrl;
    } catch (error) {
      submitting.value = false;
      return;
    }
  }

  submitting.value = true;
  try {
    const signature = await requestSignature('Ký xác nhận hoàn tất hồ sơ thanh lý/tiêu hủy');    if (!signature) {
      submitting.value = false;
      return;
    }
    await assetDisposalService.completeCase(props.caseId, {
      decision_no: form.value.decision_no,
      decision_date: form.value.decision_date,
      decision_file_url: form.value.decision_file_url,
      notes: form.value.notes,
      signature,
    });

    ElMessage.success('Đã hoàn tất hồ sơ giảm tài sản');
    emit('completed');
    await load();
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi hoàn tất thủ tục';
    ElMessage.error(msg);
    console.error('Complete disposal error:', error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.file-info {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.remove-file {
  color: #f56c6c;
  padding: 0;
  margin-left: 8px;
}

.el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 7px;
}
</style>
