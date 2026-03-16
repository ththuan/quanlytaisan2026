<template>
  <el-dialog
    v-model="visible"
    title="Đổi mật khẩu"
    width="440px"
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <el-form-item
        label="Mật khẩu hiện tại"
        prop="old_password"
      >
        <el-input
          v-model="form.old_password"
          type="password"
          placeholder="Nhập mật khẩu hiện tại"
          size="large"
          show-password
        />
      </el-form-item>

      <el-form-item
        label="Mật khẩu mới"
        prop="new_password"
      >
        <el-input
          v-model="form.new_password"
          type="password"
          placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
          size="large"
          show-password
        />
      </el-form-item>

      <el-form-item
        label="Xác nhận mật khẩu mới"
        prop="confirm_password"
      >
        <el-input
          v-model="form.confirm_password"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          size="large"
          show-password
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">
        Huỷ
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        Đổi mật khẩu
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { authService } from '@/services/auth.service';

interface Props { modelValue: boolean }
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, (v) => { visible.value = v; });
watch(visible, (v) => emit('update:modelValue', v));

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
});

const rules: FormRules = {
  old_password: [{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại', trigger: 'blur' }],
  new_password: [
    { required: true, message: 'Vui lòng nhập mật khẩu mới', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: 'Vui lòng xác nhận mật khẩu mới', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: (e?: Error) => void) => {
        if (value !== form.new_password) {
          callback(new Error('Mật khẩu xác nhận không khớp'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await authService.changePassword(form.old_password, form.new_password);
    ElMessage.success('Đổi mật khẩu thành công!');
    visible.value = false;
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Đổi mật khẩu thất bại';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
}

function onClosed() {
  formRef.value?.resetFields();
}
</script>
