import { Response } from 'express';

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message: string;
    pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
    success: false;
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

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    pagination?: PaginationMeta
): Response => {
    const response: ApiSuccessResponse<T> = {
        success: true,
        data,
        message,
    };
    if (pagination) response.pagination = pagination;
    return res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    error: string,
    statusCode = 500,
    errors?: Record<string, string[]>
): Response => {
    const response: ApiErrorResponse = {
        success: false,
        error,
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
};

export const buildPaginationMeta = (
    total: number,
    page: number,
    limit: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};
