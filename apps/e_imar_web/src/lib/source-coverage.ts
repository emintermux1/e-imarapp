import { getWebsiteBootstrap } from "@/lib/api/backend-client";

export interface SourceCoverageSummary {
  totalSources: number;
  municipalSources: number;
  nationalSources: number;
  globalSources: number;
  publicCandidateCount: number;
  protectedCount: number;
  lastGeneratedAt: string;
}

export interface SourceCoverageState {
  status: "unavailable" | "ok";
  summary: SourceCoverageSummary | null;
  message?: string;
}

export async function getSourceCoverage(): Promise<SourceCoverageState> {
  try {
    const payload = await getWebsiteBootstrap();
    if (!payload.sourceCoverage) throw new Error("sourceCoverage missing");
    return { status: "ok", summary: payload.sourceCoverage };
  } catch {
    return { status: "unavailable", summary: null, message: "Backend kaynak özeti şu an alınamıyor." };
  }
}
