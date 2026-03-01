export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
    success: boolean;
    error: string;
    errors?: Record<string, string[]>;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
