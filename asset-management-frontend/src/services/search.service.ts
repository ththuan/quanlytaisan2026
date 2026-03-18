import api from './api';

export interface GlobalSearchItem {
  type: 'asset' | 'user' | 'procurement';
  id: number;
  title: string;
  subtitle: string;
  route: string;
}

export interface GlobalSearchResult {
  assets: GlobalSearchItem[];
  users: GlobalSearchItem[];
  procurements: GlobalSearchItem[];
}

export async function globalSearch(q: string): Promise<GlobalSearchResult> {
  const { data } = await api.get<{ success: boolean; data: GlobalSearchResult }>('/search', {
    params: { q: q.trim() },
  });
  return (data as any)?.data ?? { assets: [], users: [], procurements: [] };
}
