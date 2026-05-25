import { pinoHttp } from "pino-http";
import { logger } from "@/pkg/logger/logger";

export const httpLogger = pinoHttp({
  logger,
  // kustomisasi pesan log sukses/gagal
  customSuccessMessage: (req, res) => {
    if (res.statusCode === 404) return "Resource Not Found";
    return `${req.method} operation completed`;
  },
  customErrorMessage: (req, _res, err) => {
    return `${req.method} operation failed: ${err.message}`;
  },
  // tambahkan trace_id untuk memudahkan debugging (Tracing)
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
});
