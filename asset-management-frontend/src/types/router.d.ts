import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    requiresAdminOrDirector?: boolean;
    requiresSystemAdmin?: boolean;
    permission?: string;
    legacyRoles?: string[];
    titleKey?: string;
    breadcrumbParent?: { path: string; titleKey: string };
  }
}
