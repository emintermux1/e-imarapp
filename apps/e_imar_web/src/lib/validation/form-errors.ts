export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export type ValidationResult<T, TField extends string> =
  | { ok: true; data: T; errors: FieldErrors<TField> }
  | { ok: false; errors: FieldErrors<TField> };

export function required(value: string, message = "Bu alan zorunlu.") {
  return value.trim() ? null : message;
}

export function minLength(value: string, min: number, message?: string) {
  return value.trim().length >= min ? null : message ?? `En az ${min} karakter girin.`;
}

export function email(value: string, message = "Geçerli bir e-posta girin.") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : message;
}

export function numberRange(value: string | number, min: number, max: number, message?: string) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max
    ? null
    : message ?? `${min} - ${max} aralığında bir değer girin.`;
}

export function firstError(...errors: Array<string | null | undefined>) {
  return errors.find(Boolean) ?? null;
}

export function hasErrors<T extends string>(errors: FieldErrors<T>) {
  return Object.values(errors).some(Boolean);
}
