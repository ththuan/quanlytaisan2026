import { Op } from 'sequelize';
import { Asset, User, Procurement } from '../models';

const LIMIT_PER_TYPE = 5;

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

interface SearchUser {
  id: number;
  role: string;
  department_id?: number;
}

export async function globalSearch(
  q: string,
  currentUser: SearchUser
): Promise<GlobalSearchResult> {
  const term = (q || '').trim();
  if (term.length < 2) {
    return { assets: [], users: [], procurements: [] };
  }

  const pattern = `%${term}%`;
  const isAdminOrDirector = currentUser.role === 'admin' || currentUser.role === 'director';

  const [assets, users, procurements] = await Promise.all([
    searchAssets(pattern, currentUser, isAdminOrDirector),
    searchUsers(pattern, currentUser),
    searchProcurements(pattern, isAdminOrDirector),
  ]);

  return { assets, users, procurements };
}

async function searchAssets(
  pattern: string,
  currentUser: SearchUser,
  isAdminOrDirector: boolean
): Promise<GlobalSearchItem[]> {
  const where: any = {
    [Op.or]: [
      { asset_code: { [Op.iLike]: pattern } },
      { name: { [Op.iLike]: pattern } },
      { description: { [Op.iLike]: pattern } },
    ],
  };
  if (!isAdminOrDirector && currentUser.department_id) {
    where.current_department_id = currentUser.department_id;
  }
  const rows = await Asset.findAll({
    where,
    limit: LIMIT_PER_TYPE,
    order: [['asset_code', 'ASC']],
    attributes: ['id', 'asset_code', 'name', 'current_department_id'],
  });
  return rows.map((a) => ({
    type: 'asset' as const,
    id: a.id,
    title: a.asset_code,
    subtitle: a.name || '',
    route: `/assets/${a.id}`,
  }));
}

async function searchUsers(pattern: string, currentUser: SearchUser): Promise<GlobalSearchItem[]> {
  if (currentUser.role !== 'admin') return [];
  const rows = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.iLike]: pattern } },
        { fullname: { [Op.iLike]: pattern } },
        { email: { [Op.iLike]: pattern } },
      ],
    },
    limit: LIMIT_PER_TYPE,
    order: [['username', 'ASC']],
    attributes: ['id', 'username', 'fullname', 'email'],
  });
  return rows.map((u) => ({
    type: 'user' as const,
    id: u.id,
    title: u.username,
    subtitle: [u.fullname, u.email].filter(Boolean).join(' · ') || '',
    route: '/users',
  }));
}

async function searchProcurements(
  pattern: string,
  isAdminOrDirector: boolean
): Promise<GlobalSearchItem[]> {
  if (!isAdminOrDirector) return [];
  const rows = await Procurement.findAll({
    where: {
      [Op.or]: [
        { code: { [Op.iLike]: pattern } },
        { title: { [Op.iLike]: pattern } },
      ],
    },
    limit: LIMIT_PER_TYPE,
    order: [['id', 'DESC']],
    attributes: ['id', 'code', 'title', 'status'],
  });
  return rows.map((p) => ({
    type: 'procurement' as const,
    id: p.id,
    title: p.code,
    subtitle: p.title || '',
    route: '/procurements',
  }));
}
