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

const apiBase = process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL;

export async function getSourceCoverage(): Promise<SourceCoverageState> {
  if (!apiBase) {
    return { status: "unavailable", summary: null, message: "Backend kaynak özeti bağlı değil." };
  }

  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/website/bootstrap`);
    if (!response.ok) throw new Error(`bootstrap ${response.status}`);
    const payload = (await response.json()) as { sourceCoverage?: SourceCoverageSummary };
    if (!payload.sourceCoverage) throw new Error("sourceCoverage missing");
    return { status: "ok", summary: payload.sourceCoverage };
  } catch {
    return { status: "unavailable", summary: null, message: "Backend kaynak özeti şu an alınamıyor." };
  }
}
