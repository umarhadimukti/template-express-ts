import type { Response } from "express";

export interface MetaResponse {
  status: number;
  timestamp: string;
}

export interface SuccessResponse<T = any> {
  success: boolean;
  message: string;
  data?: T | null;
  meta: MetaResponse;
}

export interface ErrorDetail {
  reason: string;
  details?: Record<string, string>[];
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  errors: ErrorDetail;
  meta: MetaResponse;
}

export function successResponse<T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T | null,
) {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
    meta: { status: statusCode, timestamp: new Date().toISOString() },
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  error: Error,
) {
  const response: ErrorResponse = {
    success: false,
    message,
    errors: { reason: error.message },
    meta: { status: statusCode, timestamp: new Date().toISOString() },
  };
  return res.status(statusCode).json(response);
}

export function errorValidationResponse(
  res: Response,
  statusCode: number,
  message: string,
  errors: Record<string, string>[],
) {
  const response: ErrorResponse = {
    success: false,
    message,
    errors: { reason: message, details: errors },
    meta: { status: statusCode, timestamp: new Date().toISOString() },
  };
  return res.status(statusCode).json(response);
}
