import api from './api';

export type PermissionScope = 'own' | 'department' | 'all';

export interface PermissionDefinition {
  code: string;
  module: string;
  moduleLabel: string;
  action: string;
  label: string;
  description?: string;
  scopes: PermissionScope[];
  adminOnly?: boolean;
}

export interface PermissionModule {
  module: string;
  moduleLabel: string;
  permissions: PermissionDefinition[];
}

export interface PermissionPreset {
  code: string;
  label: string;
  description: string;
  permissions: Array<{ code: string; scope: PermissionScope }>;
}

export interface PermissionCatalog {
  modules: PermissionModule[];
  definitions: PermissionDefinition[];
  presets: PermissionPreset[];
  scopes: Array<{ value: PermissionScope; label: string }>;
}

export interface UserPermissionDetail {
  code: string;
  scope: PermissionScope;
  module: string;
  module_label: string;
  label: string;
  action: string;
}

export interface UserPermissionResponse {
  user_id: number;
  permissions_customized: boolean;
  permissions: UserPermissionDetail[];
}

export const permissionService = {
  async getCatalog(): Promise<{ data: PermissionCatalog }> {
    return api.get('/permissions/catalog');
  },

  async getUserPermissions(userId: number): Promise<{ data: UserPermissionResponse }> {
    return api.get(`/permissions/users/${userId}`);
  },

  async updateUserPermissions(
    userId: number,
    permissions: Array<{ code: string; scope: PermissionScope }>,
  ) {
    return api.put(`/permissions/users/${userId}`, { permissions });
  },

  async resetUserPermissions(userId: number) {
    return api.delete(`/permissions/users/${userId}`);
  },
};
