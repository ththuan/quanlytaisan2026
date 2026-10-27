/** Danh mục cơ sở cố định của trường. */
export type CampusCode = 'main' | 'tan_an';

export const CAMPUS_LABELS: Record<CampusCode, string> = {
  main: 'Trụ sở chính',
  tan_an: 'Cơ sở Tân An',
};

export const CAMPUS_CODES: CampusCode[] = ['main', 'tan_an'];

export const DEFAULT_CAMPUS: CampusCode = 'main';

export const campusLabel = (code?: string | null): string =>
  CAMPUS_LABELS[(code as CampusCode) || DEFAULT_CAMPUS] || String(code || '');
