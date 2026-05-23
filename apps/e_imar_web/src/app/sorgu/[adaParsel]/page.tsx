import { notFound } from "next/navigation";
import { findParcelByAdaParselSlug, getAllParcels } from "@/data/parcels";
import { AppShell } from "@/components/layout/app-shell";
import { ParcelDeepLinkBootstrap } from "./parcel-deep-link-bootstrap";
import { adaParselText } from "@/lib/format";
import { BrandMark } from "@/components/layout/brand-mark";

interface PageProps {
  params: { adaParsel: string };
  searchParams?: { il?: string; ilce?: string };
}

export async function generateStaticParams() {
  return getAllParcels().slice(0, 20).map((f) => ({
    adaParsel: `${f.properties.ada}-${f.properties.parsel}`
  }));
}

const todayLong = new Intl.DateTimeFormat("tr-TR", {
  year: "numeric",
  month: "long",
  day: "2-digit"
});

export default function ParcelDeepLinkPage({ params, searchParams }: PageProps) {
  const parcel = findParcelByAdaParselSlug(
    params.adaParsel,
    searchParams?.il,
    searchParams?.ilce
  );
  if (!parcel) notFound();
  const p = parcel.properties;
  const printDate = todayLong.format(new Date());
  return (
    <>
      <ParcelDeepLinkBootstrap
        parcelId={p.id}
        centroid={p.centroid}
      />
      {/* Print-only header (hidden on screen via print.css) */}
      <header className="print-only px-0">
        <div className="flex items-center justify-between gap-3 border-b border-fg-primary/30 pb-3">
          <BrandMark />
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">
              Parsel Sorgu Çıktısı
            </div>
            <div className="text-base font-semibold tabular-nums">
              {adaParselText(p.ada, p.parsel)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">
              {p.mahalle} · {p.ilce} / {p.il}
            </div>
            <div className="text-[10px] tabular-nums text-fg-muted mt-1">
              {printDate}
            </div>
          </div>
        </div>
      </header>
      <AppShell />
      <PrintFlag />
    </>
  );
}

function PrintFlag() {
  // Tag the body so print CSS can scope to the parcel route only.
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.body.dataset.route = "parcel";`
      }}
    />
  );
}
