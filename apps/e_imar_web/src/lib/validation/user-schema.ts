import { email, firstError, hasErrors, minLength, required, type FieldErrors, type ValidationResult } from "./form-errors";

export type AdminUserRole = "owner" | "admin" | "analyst" | "viewer";
export type AdminUserStatus = "active" | "invited" | "suspended";
export type UserFields = "name" | "email" | "role" | "status";

export interface UserInput {
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
}

const roles: AdminUserRole[] = ["owner", "admin", "analyst", "viewer"];
const statuses: AdminUserStatus[] = ["active", "invited", "suspended"];

export function validateUser(input: UserInput): ValidationResult<UserInput, UserFields> {
  const errors: FieldErrors<UserFields> = {
    name: firstError(required(input.name), minLength(input.name, 2, "Ad soyad en az 2 karakter olmalı.")) ?? undefined,
    email: firstError(required(input.email), email(input.email)) ?? undefined,
    role: roles.includes(input.role) ? undefined : "Geçerli bir rol seçin.",
    status: statuses.includes(input.status) ? undefined : "Geçerli bir durum seçin."
  };

  if (hasErrors(errors)) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLocaleLowerCase("tr-TR"),
      role: input.role,
      status: input.status
    },
    errors: {}
  };
}
