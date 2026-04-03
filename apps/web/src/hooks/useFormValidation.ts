import { useState, useCallback } from "react";

type ValidationRule = {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  custom?: (value: string, fields: Record<string, string>) => string | null;
};

type ValidationRules<T extends Record<string, string>> = {
  [K in keyof T]?: ValidationRule;
};

type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useFormValidation<T extends Record<string, string>>(
  rules: ValidationRules<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: any) => string,
) {
  const [errors, setErrors] = useState<FieldErrors<T>>({});

  const validate = useCallback(
    (fields: T): boolean => {
      const newErrors: FieldErrors<T> = {};

      for (const key of Object.keys(rules) as (keyof T)[]) {
        const rule = rules[key];
        const value = fields[key] ?? "";

        if (!rule) continue;

        if (rule.required && value.trim() === "") {
          newErrors[key] = t("validation.required");
          continue;
        }

        if (rule.email && value && !EMAIL_REGEX.test(value)) {
          newErrors[key] = t("validation.email");
          continue;
        }

        if (rule.minLength && value.length < rule.minLength) {
          newErrors[key] = t("validation.minLength").replace(
            "{min}",
            String(rule.minLength),
          );
          continue;
        }

        if (rule.custom) {
          const customError = rule.custom(
            value,
            fields as Record<string, string>,
          );
          if (customError) {
            newErrors[key] = customError;
            continue;
          }
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [rules, t],
  );

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return { errors, validate, clearFieldError, clearErrors };
}
