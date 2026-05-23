"use client";

import * as React from "react";
import { SearchCheck } from "lucide-react";
import { StateEmpty } from "@/components/states/state-empty";
import { StateError } from "@/components/states/state-error";
import { StateLoading } from "@/components/states/state-loading";
import { StateNotReady } from "@/components/states/state-not-ready";
import { StateUnavailable } from "@/components/states/state-unavailable";
import type { WebsiteWorkspaceBucket } from "@/types/api";
import { WorkspaceRecordCard } from "./workspace-record-card";
import { bucketCount, bucketRecords, readIssueMessage } from "./workspace-utils";

export function HistoryTab({
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
    return <StateLoading title="Sorgu geçmişi yükleniyor" description="/website/workspace history bucket yanıtı bekleniyor." />;
  }

  if (error) {
    return <StateError title="Workspace geçmişi alınamadı" description={error} />;
  }

  if (status === "not_ready") {
    return <StateNotReady title="Geçmiş deposu hazır değil" description={issue ?? "Backend user-data history deposu henüz kalıcı kayıt döndürmüyor."} />;
  }

  if (status === "unavailable") {
    return <StateUnavailable title="Geçmiş endpoint'i erişilemiyor" description={issue ?? "Canlı workspace history bucket okunamadı."} />;
  }

  if (records.length === 0) {
    return (
      <StateEmpty
        title="Sorgu geçmişi boş"
        description="Harita veya ada/parsel sorgusu çalıştırıldığında BFF history kaydı burada görünecek."
        action={
          <span className="inline-flex items-center gap-2 text-xs font-bold text-fg-primary">
            <SearchCheck className="h-3.5 w-3.5" />
            /website/bff/parcel-workflow history üretir
          </span>
        }
      />
    );
  }

  return (
    <section className="space-y-3">
      <BucketIntro
        title="Son sorgular"
        detail={`${bucketCount(bucket, records.length)} history kaydı · parcel-workflow ve plan-note-explain işlemleri aynı kullanıcı referansıyla gruplanır.`}
      />
      <div className="grid gap-2">
        {records.map((item, index) => (
          <WorkspaceRecordCard key={String(item.id ?? item.created_at ?? item.createdAt ?? index)} item={item} type="history" />
        ))}
      </div>
    </section>
  );
}

function BucketIntro({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1/72 px-4 py-3">
      <h2 className="text-sm font-black text-fg-primary">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-fg-secondary">{detail}</p>
    </div>
  );
}
