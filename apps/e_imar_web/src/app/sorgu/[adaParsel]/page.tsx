import { notFound } from "next/navigation";
import { findParcelByAdaParselSlug, getAllParcels } from "@/data/parcels";
import { AppShell } from "@/components/layout/app-shell";
import { ParcelDeepLinkBootstrap } from "./parcel-deep-link-bootstrap";

interface PageProps {
  params: { adaParsel: string };
  searchParams?: { il?: string; ilce?: string };
}

export async function generateStaticParams() {
  return getAllParcels().slice(0, 20).map((f) => ({
    adaParsel: `${f.properties.ada}-${f.properties.parsel}`
  }));
}

export default function ParcelDeepLinkPage({ params, searchParams }: PageProps) {
  const parcel = findParcelByAdaParselSlug(
    params.adaParsel,
    searchParams?.il,
    searchParams?.ilce
  );
  if (!parcel) notFound();
  return (
    <>
      <ParcelDeepLinkBootstrap
        parcelId={parcel.properties.id}
        centroid={parcel.properties.centroid}
      />
      <AppShell />
    </>
  );
}
