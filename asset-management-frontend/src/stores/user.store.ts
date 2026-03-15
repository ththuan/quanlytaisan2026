import { defineStore } from 'pinia';
import userService from '../services/user.service';
import type { User, CreateUserData, UpdateUserData } from '../services/user.service';

interface UserState {
  users: User[];
  currentUser: User | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    users: [],
    currentUser: null,
    profile: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  }),

  actions: {
    async fetchUsers(params?: any) {
      this.loading = true;
      this.error = null;
      try {
        const response = await userService.getAll(params);
        this.users = response.data;
        this.pagination = response.pagination;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch users';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchUserById(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await userService.getById(id);
        this.currentUser = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch user';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchProfile() {
      this.loading = true;
      this.error = null;
      try {
        const response = await userService.getProfile();
        this.profile = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch profile';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateProfile(data: UpdateUserData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await userService.updateProfile(data);
        this.profile = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update profile';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createUser(data: CreateUserData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await userService.create(data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create user';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateUser(id: number, data: UpdateUserData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await userService.update(id, data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update user';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteUser(id: number) {
      this.loading = true;
      this.error = null;
      try {
        await userService.delete(id);
        this.users = this.users.filter((u) => u.id !== id);
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete user';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
