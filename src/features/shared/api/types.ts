export type ApiSuccessBody<T> = { success: true; data: T };
export type ApiErrorBody = {
  success: false;
  error: { code: string; message: string };
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedListParams = {
  page?: number;
  limit?: number;
  search?: string;
};
