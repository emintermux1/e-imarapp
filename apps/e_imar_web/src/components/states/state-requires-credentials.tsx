"use client";

import * as React from "react";
import { StateCard } from "./state-card";

export function StateRequiresCredentials({
  title = "Erişim bilgisi gerekiyor",
  description = "Bu akış için ortam değişkeni, token veya servis yetkisi tanımlanmalı.",
  action,
  className,
  compact
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return <StateCard kind="requires_credentials" title={title} description={description} action={action} className={className} compact={compact} />;
}
