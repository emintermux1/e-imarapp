import type { EplanSubscriptionResponse, WebsiteWorkspaceBucket } from "@/types/api";

export type WorkspaceRecord = Record<string, unknown>;

export function bucketRecords(bucket?: WebsiteWorkspaceBucket): WorkspaceRecord[] {
  const records = Array.isArray(bucket?.items)
    ? bucket.items
    : Array.isArray(bucket?.subscriptions)
      ? bucket.subscriptions
      : [];
  return records.filter((item): item is WorkspaceRecord => Boolean(item) && typeof item === "object");
}

export function subscriptionRecords(bucket?: WebsiteWorkspaceBucket, response?: EplanSubscriptionResponse | null): WorkspaceRecord[] {
  const fromResponse = Array.isArray(response?.subscriptions) ? response.subscriptions : [];
  return (fromResponse.length ? fromResponse : bucketRecords(bucket)).filter((item): item is WorkspaceRecord => Boolean(item) && typeof item === "object");
}

export function bucketCount(bucket?: WebsiteWorkspaceBucket, fallbackCount?: number) {
  return bucket?.count ?? fallbackCount ?? bucketRecords(bucket).length;
}

export function readIssueMessage(value?: { issue?: unknown; message?: string } | WebsiteWorkspaceBucket | EplanSubscriptionResponse | null) {
  if (!value) return null;
  if (typeof value.message === "string" && value.message.trim()) return value.message;
  const issue = value.issue;
  if (issue && typeof issue === "object" && "message" in issue) {
    const message = (issue as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return null;
}

export function compactRecordTitle(item: WorkspaceRecord, fallback = "Kayıt") {
  return String(
    item.label ??
      item.title ??
      item.query_type ??
      item.queryType ??
      item.channel ??
      item.parcel_id ??
      item.plan_id ??
      item.id ??
      fallback
  );
}

export function compactRecordDetail(item: WorkspaceRecord, fallback = "Detay yok") {
  return String(
    item.target ??
      item.created_at ??
      item.createdAt ??
      item.updated_at ??
      item.updatedAt ??
      item.status ??
      item.platform ??
      fallback
  );
}

export function formatRecordDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function statusLabel(status?: string | null) {
  switch (status) {
    case "ok":
      return "Bağlı";
    case "empty":
      return "Boş";
    case "loading":
      return "Yükleniyor";
    case "not_ready":
      return "Hazır değil";
    case "requires_credentials":
      return "Yetki gerekiyor";
    case "unavailable":
      return "Erişilemiyor";
    case "invalid_input":
      return "Eksik bilgi";
    default:
      return status ?? "Yüklenmedi";
  }
}

export function statusTone(status?: string | null) {
  if (status === "ok") return "border-status-success/30 bg-status-success/10 text-status-success";
  if (status === "loading") return "border-brand-blue/30 bg-[rgb(var(--accent-blue)/0.08)] text-brand-blue";
  if (status === "unavailable" || status === "error" || status === "provider_error") return "border-status-error/30 bg-status-error/10 text-status-error";
  if (status === "not_ready" || status === "requires_credentials" || status === "invalid_input" || status === "empty") {
    return "border-status-warning/30 bg-status-warning/10 text-status-warning";
  }
  return "border-border-subtle bg-surface-2/94 text-fg-muted";
}
