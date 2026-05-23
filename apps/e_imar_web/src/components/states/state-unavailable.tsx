"use client";

import * as React from "react";
import { StateCard } from "./state-card";

export function StateUnavailable({
  title = "Servise erişilemiyor",
  description = "Canlı backend şu an yanıt vermiyor veya bu kaynağı sağlayamıyor.",
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
  return <StateCard kind="unavailable" title={title} description={description} action={action} className={className} compact={compact} />;
}
