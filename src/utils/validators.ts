/**
 * Input validation utilities used across all forms and modules.
 * Centralized to ensure consistent validation behavior.
 */

export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[\d\s\-+()]+$/;
export const URL_REGEX = /^https?:\/\/.+/i;
export const CURRENCY_REGEX = /^\d+(\.\d{1,2})?$/;

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate phone number format (basic).
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validate URL format.
 */
export function isValidUrl(url: string): boolean {
  return URL_REGEX.test(url);
}

/**
 * Validate non-negative currency amount.
 */
export function isValidCurrency(value: unknown): boolean {
  if (typeof value !== "number") return false;
  return value >= 0 && CURRENCY_REGEX.test(value.toString());
}

/**
 * Validate file size (in megabytes).
 */
export function validateFileSize(file: File, maxMB: number): boolean {
  return file.size <= maxMB * 1024 * 1024;
}

/**
 * Validate file type against allowed MIME types.
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file by both size and type.
 */
export function validateFile(
  file: File,
  maxMB: number,
  allowedTypes: string[]
): ValidationResult {
  const errors: string[] = [];

  if (!validateFileSize(file, maxMB)) {
    errors.push(`File must be smaller than ${maxMB}MB`);
  }

  if (!validateFileType(file, allowedTypes)) {
    errors.push(`File type not allowed. Allowed: ${allowedTypes.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate string field with multiple rules.
 */
export function validateStringField(
  value: string,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get appropriate validation rule set for a field type.
 */
export const ValidationRuleSets = {
  email: [
    {
      validate: (v: unknown) => typeof v === "string" && v.trim().length > 0,
      message: "Email is required",
    },
    {
      validate: (v: unknown) => isValidEmail(v as string),
      message: "Email format is invalid",
    },
  ] as ValidationRule[],

  password: [
    {
      validate: (v: unknown) => typeof v === "string" && v.length >= 8,
      message: "Password must be at least 8 characters",
    },
    {
      validate: (v: unknown) =>
        /[A-Z]/.test(v as string) && /[a-z]/.test(v as string),
      message: "Password must contain uppercase and lowercase letters",
    },
    {
      validate: (v: unknown) => /\d/.test(v as string),
      message: "Password must contain a number",
    },
  ] as ValidationRule[],

  phone: [
    {
      validate: (v: unknown) => typeof v === "string" && v.trim().length > 0,
      message: "Phone number is required",
    },
    {
      validate: (v: unknown) => isValidPhone(v as string),
      message: "Phone format is invalid",
    },
  ] as ValidationRule[],

  url: [
    {
      validate: (v: unknown) => typeof v === "string" && v.trim().length > 0,
      message: "URL is required",
    },
    {
      validate: (v: unknown) => isValidUrl(v as string),
      message: "URL must start with http:// or https://",
    },
  ] as ValidationRule[],
};

/**
 * Batch validate multiple fields with custom rules.
 */
export function validateFields(
  data: Record<string, unknown>,
  fieldRules: Record<string, ValidationRule[]>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  Object.entries(fieldRules).forEach(([field, rules]) => {
    const fieldErrors: string[] = [];

    for (const rule of rules) {
      if (!rule.validate(data[field])) {
        fieldErrors.push(rule.message);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  return errors;
}

/**
 * Check if date string is valid.
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Check if date is in the future.
 */
export function isFutureDate(dateString: string): boolean {
  if (!isValidDate(dateString)) return false;
  return new Date(dateString) > new Date();
}

/**
 * Check if date is in the past.
 */
export function isPastDate(dateString: string): boolean {
  if (!isValidDate(dateString)) return false;
  return new Date(dateString) < new Date();
}

/**
 * Validate date range (start must be before end).
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
  return new Date(startDate) < new Date(endDate);
}

/**
 * Check if string is not empty after trimming.
 */
export function isNotEmpty(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check if string length is within range.
 */
export function isLengthInRange(
  value: string,
  min: number,
  max: number
): boolean {
  return value.length >= min && value.length <= max;
}

/**
 * Sanitize string input (remove scripts, trim).
 */
export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/<[^>]*>/g, "")
    .slice(0, 1000);
}
