import { defineStore } from 'pinia';
import { ref } from 'vue';
import { assetService, type AssetQueryParams } from '@/services/asset.service';
import type { Asset, PaginationData } from '@/types/models';
import { ElMessage } from 'element-plus';

export const useAssetStore = defineStore('asset', () => {
  const assets = ref<Asset[]>([]);
  const currentAsset = ref<Asset | null>(null);
  const pagination = ref<PaginationData | null>(null);
  const loading = ref(false);

  async function fetchAssets(params?: AssetQueryParams) {
    loading.value = true;
    try {
      const response = await assetService.getAssets(params);
      if (response.success && response.data) {
        assets.value = response.data;
        pagination.value = response.pagination || null;
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchAssetById(id: number): Promise<Asset | null> {
    loading.value = true;
    try {
      const response = await assetService.getAssetById(id);
      if (response.success && response.data) {
        currentAsset.value = response.data;
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching asset:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createAsset(data: Partial<Asset>): Promise<Asset | null> {
    loading.value = true;
    try {
      const response = await assetService.createAsset(data);
      if (response.success && response.data) {
        ElMessage.success('Asset created successfully');
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateAsset(id: number, data: Partial<Asset>): Promise<Asset | null> {
    loading.value = true;
    try {
      const response = await assetService.updateAsset(id, data);
      if (response.success && response.data) {
        ElMessage.success('Asset updated successfully');
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAsset(id: number) {
    loading.value = true;
    try {
      const response = await assetService.deleteAsset(id);
      if (response.success) {
        ElMessage.success('Asset deleted successfully');
        // Remove from local state
        assets.value = assets.value.filter(a => a.id !== id);
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    assets,
    currentAsset,
    pagination,
    loading,
    fetchAssets,
    fetchAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
  };
});
