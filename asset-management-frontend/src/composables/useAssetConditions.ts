import { computed } from 'vue';

export type AssetConditionValue = 'good' | 'usable' | 'needs_repair' | 'damaged' | 'disposed';

export interface AssetConditionOption {
  value: AssetConditionValue;
  label: string;
}

export const ASSET_CONDITION_OPTIONS: AssetConditionOption[] = [
  { value: 'good', label: '0 - Còn sử dụng được - đang sử dụng' },
  { value: 'usable', label: '1 - Còn sử dụng được - không sử dụng' },
  { value: 'needs_repair', label: '2 - Cần sửa chữa' },
  { value: 'damaged', label: '3 - Hư hỏng' },
  { value: 'disposed', label: '4 - Đã thanh lý' },
];

export const useAssetConditionOptions = () => {
  const assetConditionOptions = computed(() => ASSET_CONDITION_OPTIONS);
  return { assetConditionOptions };
};
