"use client";

import * as React from "react";
import { StateCard } from "./state-card";

export function StateEmpty({
  title = "Kayıt yok",
  description = "Bu bölüm için gösterilecek kayıt dönmedi.",
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
  return <StateCard kind="empty" title={title} description={description} action={action} className={className} compact={compact} />;
}
