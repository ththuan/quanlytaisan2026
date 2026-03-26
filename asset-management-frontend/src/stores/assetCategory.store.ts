import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  assetCategoryService,
  type AssetCategory,
} from '@/services/assetCategory.service';

export const useAssetCategoryStore = defineStore('assetCategory', () => {
  const categories = ref<AssetCategory[]>([]);

  async function fetchCategories(params?: { limit?: number }) {
    const includeInactive = true;
    const { data } = await assetCategoryService.getAll(includeInactive);
    let list = data || [];
    const lim = params?.limit;
    if (typeof lim === 'number' && lim > 0) {
      list = list.slice(0, lim);
    }
    categories.value = list;
    return list;
  }

  async function createCategory(data: Partial<AssetCategory>) {
    const { data: created } = await assetCategoryService.create(data);
    await fetchCategories();
    return created;
  }

  async function updateCategory(id: number, data: Partial<AssetCategory>) {
    const { data: updated } = await assetCategoryService.update(id, data);
    await fetchCategories();
    return updated;
  }

  async function deleteCategory(id: number) {
    await assetCategoryService.delete(id);
    await fetchCategories();
  }

  return {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
});
