/**
 * Re-export Element Plus types from subpaths so vue-tsc accepts them as types
 * (avoids TS2709 "Cannot use namespace as a type" from the package root export).
 */
export type { FormInstance, FormRules } from 'element-plus/es/components/form';
export type { CascaderProps } from 'element-plus/es/components/cascader-panel';
export type { UploadFile } from 'element-plus/es/components/upload';
