import { email, firstError, hasErrors, minLength, numberRange, required, type FieldErrors, type ValidationResult } from "./form-errors";

export type ParcelQueryFields = "il" | "ilce" | "ada" | "parsel" | "requesterEmail";

export interface ParcelQueryInput {
  il: string;
  ilce: string;
  ada: string;
  parsel: string;
  requesterEmail?: string;
}

export function validateParcelQuery(input: ParcelQueryInput): ValidationResult<ParcelQueryInput, ParcelQueryFields> {
  const errors: FieldErrors<ParcelQueryFields> = {
    il: firstError(required(input.il), minLength(input.il, 2, "İl adı en az 2 karakter olmalı.")) ?? undefined,
    ilce: firstError(required(input.ilce), minLength(input.ilce, 2, "İlçe adı en az 2 karakter olmalı.")) ?? undefined,
    ada: firstError(required(input.ada), numberRange(input.ada, 1, 99999, "Ada numarası 1-99999 aralığında olmalı.")) ?? undefined,
    parsel: firstError(required(input.parsel), numberRange(input.parsel, 1, 99999, "Parsel numarası 1-99999 aralığında olmalı.")) ?? undefined,
    requesterEmail: input.requesterEmail?.trim() ? email(input.requesterEmail) ?? undefined : undefined
  };

  if (hasErrors(errors)) return { ok: false, errors };
  return {
    ok: true,
    data: {
      il: input.il.trim(),
      ilce: input.ilce.trim(),
      ada: input.ada.trim(),
      parsel: input.parsel.trim(),
      requesterEmail: input.requesterEmail?.trim() || undefined
    },
    errors: {}
  };
}
