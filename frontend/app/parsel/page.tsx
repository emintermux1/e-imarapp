import { MapFirstShell } from "@/components/map-first/MapFirstShell";
import { getWebsiteLiveReadiness } from "@/lib/api";
import { normalizeReadinessSources } from "@/lib/source-status";

export default async function ParselPage() {
  let readiness: Awaited<ReturnType<typeof getWebsiteLiveReadiness>> | null = null;

  try {
    readiness = await getWebsiteLiveReadiness();
  } catch {
    readiness = null;
  }

  return <MapFirstShell sources={normalizeReadinessSources(readiness)} generatedAt={readiness?.generatedAt} mode="parcel" />;
}
