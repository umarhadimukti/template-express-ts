export type ValidationRule = (value: any, fieldName: string) => string | null;

export const Rules = {
  required: (): ValidationRule => (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
      return `${fieldName} is required`;
    }
    return null;
  },
  string: (): ValidationRule => (value, fieldName) => {
    if (value === undefined || value === null || typeof value !== "string") {
      return `${fieldName} must be a string`;
    }
    return null;
  },
  number: (): ValidationRule => (value, fieldName) => {
    if (value === undefined || value === null || typeof value !== "number") {
      return `${fieldName} must be a number`;
    }
    return null;
  },
  boolean: (): ValidationRule => (value, fieldName) => {
    if (value === undefined || value === null || typeof value !== "boolean") {
      return `${fieldName} must be a boolean`;
    }
    return null;
  },
  min:
    (length: number): ValidationRule =>
    (value, fieldName) => {
      if (typeof value === "string" && value.length < length) {
        return `${fieldName} at least ${length} character`;
      }
      if (typeof value === "number" && value < length) {
        return `${fieldName} at least ${length}`;
      }
      return null;
    },
  uuid: (): ValidationRule => (value, fieldName) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof value === "string" && !uuidRegex.test(value)) {
      return `${fieldName} must be a valid UUID`;
    }
    return null;
  },
  email: (): ValidationRule => (value, fieldName) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof value === "string" && !emailRegex.test(value)) {
      return `${fieldName} must be a valid email`;
    }
    return null;
  },
};
