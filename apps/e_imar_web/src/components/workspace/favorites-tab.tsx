"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { StateEmpty } from "@/components/states/state-empty";
import { StateError } from "@/components/states/state-error";
import { StateLoading } from "@/components/states/state-loading";
import { StateNotReady } from "@/components/states/state-not-ready";
import { StateUnavailable } from "@/components/states/state-unavailable";
import type { WebsiteWorkspaceBucket } from "@/types/api";
import { WorkspaceRecordCard } from "./workspace-record-card";
import { bucketCount, bucketRecords, readIssueMessage } from "./workspace-utils";

export function FavoritesTab({
  bucket,
  loading,
  error
}: {
  bucket?: WebsiteWorkspaceBucket;
  loading?: boolean;
  error?: string | null;
}) {
  const records = bucketRecords(bucket);
  const status = loading ? "loading" : error ? "unavailable" : bucket?.status;
  const issue = error ?? readIssueMessage(bucket);

  if (loading) {
    return <StateLoading title="Favoriler yükleniyor" description="/website/workspace favorites bucket yanıtı bekleniyor." />;
  }

  if (error) {
    return <StateError title="Workspace favorileri alınamadı" description={error} />;
  }

  if (status === "not_ready") {
    return <StateNotReady title="Favori deposu hazır değil" description={issue ?? "Backend favorites deposu henüz kalıcı kayıt döndürmüyor."} />;
  }

  if (status === "unavailable") {
    return <StateUnavailable title="Favoriler erişilemiyor" description={issue ?? "Canlı workspace favorites bucket okunamadı."} />;
  }

  if (records.length === 0) {
    return (
      <StateEmpty
        title="Favori kayıt yok"
        description="Parsel veya plan favoriye alındığında bu sekme kullanıcının izleme listesini gösterecek."
        action={
          <span className="inline-flex items-center gap-2 text-xs font-bold text-fg-primary">
            <Star className="h-3.5 w-3.5" />
            Favorites bucket boş ama bağlı
          </span>
        }
      />
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1/72 px-4 py-3">
        <h2 className="text-sm font-black text-fg-primary">Favori parseller ve planlar</h2>
        <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
          {bucketCount(bucket, records.length)} favori kayıt · backend payload'u olduğu gibi gösterilir, sahte parsel detayı üretilmez.
        </p>
      </div>
      <div className="grid gap-2">
        {records.map((item, index) => (
          <WorkspaceRecordCard key={String(item.id ?? item.parcel_id ?? item.plan_id ?? index)} item={item} type="favorites" />
        ))}
      </div>
    </section>
  );
}
