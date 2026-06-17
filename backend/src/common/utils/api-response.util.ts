import { ApiResponse, PaginationMeta } from '../types/api-response.type';

export function successResponse<T>(
  data: T,
  message = 'Success',
  meta?: PaginationMeta,
): ApiResponse<T> {
  return { success: true, message, data, ...(meta && { meta }) };
}

export function paginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
}
