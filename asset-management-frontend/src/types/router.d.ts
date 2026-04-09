import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    requiresSystemAdmin?: boolean;
    titleKey?: string;
    breadcrumbParent?: { path: string; titleKey: string };
  }
}
