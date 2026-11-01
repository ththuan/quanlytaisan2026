/** Danh mục cơ sở cố định của trường. */
export type CampusCode = 'main' | 'tan_an' | 'trai_thuc_nghiem';

export const CAMPUS_LABELS: Record<CampusCode, string> = {
  main: 'Trụ sở chính',
  tan_an: 'Cơ sở Tân An',
  trai_thuc_nghiem: 'Trại thực nghiệm',
};

export const CAMPUS_CODES: CampusCode[] = ['main', 'tan_an', 'trai_thuc_nghiem'];

export const DEFAULT_CAMPUS: CampusCode = 'main';

export const campusLabel = (code?: string | null): string =>
  CAMPUS_LABELS[(code as CampusCode) || DEFAULT_CAMPUS] || String(code || '');
