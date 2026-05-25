import { CustomError, NotFound } from "@/pkg/utils/error/error";
import { errorResponse } from "@/pkg/utils/response/response";
import { Request, Response, NextFunction } from "express";

export async function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const error = new NotFound(`${req.method} ${req.originalUrl} - not found.`);
  next(error);
}

export async function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof CustomError) {
    errorResponse(res, error.statusCode, error.message, error);
    return;
  }

  const isProduction = process.env.APP_ENV === "production";
  const statusCode = res.statusCode < 400 ? 500 : res.statusCode;
  const message = isProduction ? "Internal server error" : error.message;
  errorResponse(res, statusCode, message, error);
}
