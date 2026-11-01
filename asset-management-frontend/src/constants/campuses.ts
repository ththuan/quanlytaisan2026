/** Danh mục cơ sở cố định của trường. */
export const CAMPUS_OPTIONS = [
  { value: 'main', label: 'Trụ sở chính' },
  { value: 'tan_an', label: 'Cơ sở Tân An' },
  { value: 'trai_thuc_nghiem', label: 'Trại thực nghiệm' },
];

export const CAMPUS_LABELS: Record<string, string> = {
  main: 'Trụ sở chính',
  tan_an: 'Cơ sở Tân An',
  trai_thuc_nghiem: 'Trại thực nghiệm',
};

export const campusLabel = (code?: string | null): string =>
  CAMPUS_LABELS[code || 'main'] || String(code || '');
