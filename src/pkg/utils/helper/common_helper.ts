import type { Request } from "express";

export function isEmail(value: string) {
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regexEmail.test(value);
}

export function helperCreateAudit(req: Request) {
  return {
    createdBy: req?.user?.username || "system",
  };
}

export function helperUpdateAudit(req: Request) {
  return {
    updatedAt: new Date(),
    updatedBy: req?.user?.username || "system",
  };
}

export function helperSoftDeleteAudit(req: Request) {
  return {
    deletedAt: new Date(),
    deletedBy: req?.user?.username || "system",
  };
}
