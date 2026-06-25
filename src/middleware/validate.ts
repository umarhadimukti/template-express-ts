import { httpStatus } from "#/pkg/utils/constant/constant";
import { errorValidationResponse } from "#/pkg/utils/response/response";
import { ValidationRule } from "#/pkg/validator/rules";
import type { Request, Response, NextFunction } from "express";

type ValidationSchema = Record<string, ValidationRule[]>;

interface CustomValidator {
  params?: ValidationSchema;
  query?: ValidationSchema;
  body?: ValidationSchema;
}

export const validate = (validators: CustomValidator) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    const runValidation = (targetData: any, schema: ValidationSchema) => {
      for (const [field, rules] of Object.entries(schema)) {
        const value = targetData?.[field];

        for (const rule of rules) {
          const errorMessage = rule(value, field);
          if (errorMessage) {
            errors.push({ field, message: errorMessage });
            break;
          }
        }
      }
    }

    if (validators.params) runValidation(req.params, validators.params);
    if (validators.query) runValidation(req.query, validators.query);
    if (validators.body) runValidation(req.body, validators.body);

    if (errors.length > 0) {
      errorValidationResponse(res, httpStatus.BAD_REQUEST, "Validation error", errors);
      return;
    }

    return next();
  }
}
