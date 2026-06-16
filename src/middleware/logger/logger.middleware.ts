import { pinoHttp } from "pino-http";
import { logger } from "#/pkg/logger/logger";

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: () => false,
  },
  serializers: {
    req: () => undefined,
    res: () => undefined,
    err: () => undefined,
  },
  customSuccessMessage: (req, res, responseTime) => {
    const reqId = req.id || req.headers["x-request-id"] || "-";
    const rawRequest = req as any;
    const body = rawRequest.raw?.body ? JSON.stringify(rawRequest.raw.body) : "-";
    return `[HTTP] ${req.method} ${req.url} | Status: ${res.statusCode} | Time: ${responseTime}ms | ReqID: ${reqId} | Body: ${body}`;
  },
  customErrorMessage: (req, res, err) => {
    const reqId = req.id || req.headers["x-request-id"] || "-";
    const rawRequest = req as any;
    const body = rawRequest.raw?.body ? JSON.stringify(rawRequest.raw.body) : "-";
    return `[HTTP ERROR] ${req.method} ${req.url} | Status: ${res.statusCode} | Error: ${err.message} | ReqID: ${reqId} | Body: ${body}`;
  },
  // trace_id untuk memudahkan debugging
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
});
