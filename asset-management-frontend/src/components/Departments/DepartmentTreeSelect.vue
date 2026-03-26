<template>
  <el-tree-select
    :model-value="displayValue"
    :data="treeData"
    :props="{ value: 'value', label: 'label', children: 'children' }"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :loading="storeLoading"
    :size="size"
    :default-expand-all="defaultExpandAll"
    check-strictly
    class="department-tree-select"
    popper-class="department-tree-select-popper"
    @update:model-value="onInnerChange"
    @clear="emit('clear')"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useDepartmentStore } from '@/stores/department.store';
import { flatDepartmentsToTree, type FlatDept } from '@/utils/departmentTree';

const props = withDefaults(
  defineProps<{
    modelValue: number | string | null | undefined;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    size?: 'large' | 'default' | 'small';
    excludeIds?: number[];
    restrictToIds?: number[];
    defaultExpandAll?: boolean;
  }>(),
  {
    placeholder: '',
    clearable: true,
    disabled: false,
    filterable: true,
    size: 'default',
    excludeIds: () => [],
    restrictToIds: undefined,
    defaultExpandAll: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: number | null | undefined];
  change: [value: number | null | undefined];
  clear: [];
}>();

const departmentStore = useDepartmentStore();
const { departments, loading: storeLoading } = storeToRefs(departmentStore);

onMounted(async () => {
  if (!departments.value.length) {
    await departmentStore.fetchDepartments({ limit: 1000 });
  }
});

const filteredFlat = computed((): FlatDept[] => {
  let list = departments.value as FlatDept[];
  if (props.restrictToIds != null && props.restrictToIds.length > 0) {
    const allow = new Set(props.restrictToIds);
    list = list.filter((d) => allow.has(d.id));
  }
  if (props.excludeIds != null && props.excludeIds.length > 0) {
    const ex = new Set(props.excludeIds);
    list = list.filter((d) => !ex.has(d.id));
  }
  return list;
});

const treeData = computed(() => flatDepartmentsToTree(filteredFlat.value));

const displayValue = computed(() => {
  const v = props.modelValue;
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
});

function onInnerChange(v: number | undefined | null) {
  const val = v === undefined || v === null ? null : v;
  emit('update:modelValue', val);
  emit('change', val);
}
</script>

<style scoped>
.department-tree-select {
  width: 100%;
}
</style>

<style>
.department-tree-select-popper {
  max-width: min(480px, 92vw);
}

/* Phân biệt cấp cha (gốc) / cấp con — dễ quét mắt khi tìm */
.department-tree-select-popper .el-tree > .el-tree-node > .el-tree-node__content {
  font-weight: 600;
  color: #303133;
}

.department-tree-select-popper .el-tree .el-tree-node__children .el-tree-node__content {
  font-weight: 400;
  color: #606266;
  font-size: 13px;
}

.department-tree-select-popper .el-tree .el-tree-node__children .el-tree-node__content:hover {
  color: #409eff;
}
</style>
