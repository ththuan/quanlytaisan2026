export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getPaginationParams = (query: any): PaginationOptions => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(query.limit) || 10));
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return {
    page,
    limit,
    sortBy,
    sortOrder,
  };
};

export const buildPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};
