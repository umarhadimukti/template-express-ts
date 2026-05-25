import { httpStatus } from "../constant/constant";

export abstract class CustomError extends Error {
  abstract statusCode: number;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequest extends CustomError {
  statusCode = httpStatus.BAD_REQUEST;
  constructor(message: string) {
    super(message);
  }
}

export class Unauthorized extends CustomError {
  statusCode = httpStatus.UNAUTHORIZED;
  constructor(message: string) {
    super(message);
  }
}

export class Forbidden extends CustomError {
  statusCode = httpStatus.FORBIDDEN;
  constructor(message: string) {
    super(message);
  }
}

export class NotFound extends CustomError {
  statusCode = httpStatus.NOT_FOUND;
  constructor(message: string) {
    super(message);
  }
}

export class Conflict extends CustomError {
  statusCode = httpStatus.CONFLICT;
  constructor(message: string) {
    super(message);
  }
}
