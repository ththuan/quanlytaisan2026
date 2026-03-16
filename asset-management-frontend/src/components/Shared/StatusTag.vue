<template>
  <el-tag
    :type="tagType"
    :size="size"
    :effect="effect"
  >
    {{ displayLabel }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getStatusTagType, getStatusLabelKey, type StatusNamespace } from '@/constants/statusConfig';

const props = withDefaults(
  defineProps<{
    namespace: StatusNamespace;
    status: string;
    size?: 'large' | 'default' | 'small';
    effect?: 'dark' | 'light' | 'plain';
    /** Override label (nếu không dùng i18n) */
    label?: string;
  }>(),
  { size: 'default', effect: 'plain', label: undefined }
);

const { t } = useI18n();

const tagType = computed(() => getStatusTagType(props.namespace, props.status));

const displayLabel = computed(() => {
  if (props.label) return props.label;
  const key = getStatusLabelKey(props.namespace, props.status);
  if (!key) return props.status;
  const translated = t(key);
  return translated !== key ? translated : props.status;
});
</script>
