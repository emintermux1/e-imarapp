import { firstError, hasErrors, numberRange, required, type FieldErrors, type ValidationResult } from "./form-errors";

export type SubscriptionPlan = "starter" | "pro" | "enterprise";
export type SubscriptionFields = "plan" | "seats" | "watchlistLimit";

export interface SubscriptionInput {
  plan: SubscriptionPlan;
  seats: string;
  watchlistLimit: string;
}

const plans: SubscriptionPlan[] = ["starter", "pro", "enterprise"];

export function validateSubscription(input: SubscriptionInput): ValidationResult<SubscriptionInput, SubscriptionFields> {
  const errors: FieldErrors<SubscriptionFields> = {
    plan: plans.includes(input.plan) ? undefined : "Geçerli bir paket seçin.",
    seats: firstError(required(input.seats), numberRange(input.seats, 1, 500, "Koltuk sayısı 1-500 aralığında olmalı.")) ?? undefined,
    watchlistLimit: firstError(required(input.watchlistLimit), numberRange(input.watchlistLimit, 5, 5000, "Favori parsel limiti 5-5000 aralığında olmalı.")) ?? undefined
  };

  if (hasErrors(errors)) return { ok: false, errors };
  return { ok: true, data: input, errors: {} };
}
