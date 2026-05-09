"use client";

import { useMemo, useState } from "react";
import { normalizeSourceCandidate } from "@/lib/api";
import type { SourceCandidateNormalizationResponse } from "@/lib/types";
import { BadgeCheck, ClipboardCopy, Globe2, Info, Link2, Loader2, ShieldAlert, Sparkles } from "lucide-react";

const emptyForm = {
  url: "",
  name: "",
  province: "",
  district: "",
  probe: false,
};

const accessCopy: Record<string, { label: string; tone: string; description: string }> = {
  public: {
    label: "public",
    tone: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
    description: "Portal açık görünüyor ama canlı doğrulama yine gerekli.",
  },
  public_metadata: {
    label: "public metadata",
    tone: "bg-sky-500/10 text-sky-200 border-sky-500/20",
    description: "Bu sonuç katalog, dokümantasyon veya metadata önizlemesi olabilir.",
  },
  requires_credentials: {
    label: "protected",
    tone: "bg-amber-500/10 text-amber-200 border-amber-500/20",
    description: "Kimlik doğrulama, captcha veya kapalı oturum işareti var.",
  },
  unknown: {
    label: "unknown",
    tone: "bg-white/6 text-[var(--text-secondary)] border-[var(--border-subtle)]",
    description: "Canlı probe olmadan erişim güvenle doğrulanamaz.",
  },
};

export default function SourceCandidatePage() {
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState<SourceCandidateNormalizationResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const seedPreview = useMemo(() => {
    if (!result?.wouldRegister) return null;
    const { access, ...rest } = result.wouldRegister;
    return {
      ...rest,
      access,
    };
  }, [result]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await normalizeSourceCandidate({
        url: form.url,
        name: form.name || undefined,
        province: form.province || undefined,
        district: form.district || undefined,
        probe: form.probe,
      });
      setResult(res);
    } catch (err) {
      setError(String(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copySeed = async () => {
    if (!seedPreview || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(JSON.stringify(seedPreview, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const status = result?.accessStatusGuess ? accessCopy[result.accessStatusGuess] ?? accessCopy.unknown : null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="rounded-[28px] border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.16),transparent_34%),linear-gradient(180deg,rgba(17,17,24,0.95),rgba(10,10,15,0.96))] p-6 md:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white/5 px-3 py-1 text-xs text-[var(--text-secondary)]">
              <Link2 size={13} className="text-[var(--accent-cyan)]" />
              source contribution preview
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Kaynak URL’si için normalizasyon önizlemesi
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-[var(--text-secondary)] leading-6">
              Bir belediye veya kaynak URL’si yapıştırın; sistemin bunu nasıl sınıflandıracağını, hangi connector’ları önereceğini ve
              hangi erişim durumunu tahmin edeceğini görün. Bu ekran bir kayıt oluşturmaz.
            </p>
          </div>
          <div className="grid gap-2 text-xs">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-100">Otomatik registry write yok</div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/5 px-3 py-2 text-[var(--text-secondary)]">Captcha/login/protected durumları açıkça görünür</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <form onSubmit={submit} className="space-y-5 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-2">
            <Globe2 size={18} className="text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-semibold">URL önizleme formu</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">URL *</label>
            <input
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              required
              placeholder="https://keos.ornek.bel.tr/imardurumu/"
              className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-cyan)]/60"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["name", "Ad"],
              ["province", "İl"],
              ["district", "İlçe"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">{label}</label>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={label}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-cyan)]/60"
                />
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/3 px-4 py-3">
            <input
              type="checkbox"
              checked={form.probe}
              onChange={(e) => setForm((prev) => ({ ...prev, probe: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-[var(--border-subtle)] bg-transparent accent-[var(--accent-cyan)]"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">Probe önizlemesi ekle</span>
              <span className="block text-xs leading-5 text-[var(--text-secondary)]">
                Endpoint listesi dener; canlı probe çalıştırmaz, sadece backend’in ürettiği preview candidate’ları gösterir.
              </span>
            </span>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-cyan)] px-4 py-3 text-sm font-semibold text-[var(--bg-primary)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Normalize et ve önizle
          </button>

          <p className="text-xs leading-5 text-[var(--text-secondary)]">
            Bu ekran sadece bir aday önizlemesidir; kaynak otomatik kayıt edilmez, connector atağı başlatılmaz ve üretim verisi yazılmaz.
          </p>
        </form>

        <aside className="space-y-4 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-[var(--accent-magenta)]" />
              <h2 className="text-lg font-semibold">Preview sonucu</h2>
            </div>
            {result?.status === "ok" && seedPreview && (
              <button
                type="button"
                onClick={copySeed}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-white/5 px-3 py-2 text-xs text-[var(--text-primary)] transition-colors hover:bg-white/10"
              >
                <ClipboardCopy size={14} />
                {copied ? "Kopyalandı" : "Seed JSON kopyala"}
              </button>
            )}
          </div>

          {!result ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-white/3 p-6 text-sm text-[var(--text-secondary)]">
              URL gönderildiğinde normalizedUrl, vendor guess, municipality slug guess, sourceId adayını ve erişim durumunu burada göreceksiniz.
            </div>
          ) : result.status !== "ok" ? (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
              <div className="font-medium">Geçersiz giriş</div>
              <div className="mt-1">{result.message}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["normalizedUrl", result.normalizedUrl],
                  ["vendor guess", result.vendor],
                  ["municipalitySlug guess", result.municipalitySlug],
                  ["sourceId candidate", result.sourceIdCandidate],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">{label}</div>
                    <div className="mt-2 break-words text-sm font-medium text-[var(--text-primary)]">{String(value ?? "—")}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">access status guess</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status?.tone ?? accessCopy.unknown.tone}`}>
                    {status?.label ?? "unknown"}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">{result.accessStatusReason}</span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-[var(--text-secondary)] sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-black/10 p-3">
                    <div className="font-medium text-[var(--text-primary)]">Connector kinds</div>
                    <div className="mt-1">{(result.connectorKinds || []).join(", ") || "—"}</div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-black/10 p-3">
                    <div className="font-medium text-[var(--text-primary)]">Capabilities</div>
                    <div className="mt-1">{(result.capabilities || []).join(", ") || "—"}</div>
                  </div>
                </div>
              </div>

              {result.probeCandidates?.length ? (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldAlert size={15} className="text-[var(--accent-magenta)]" />
                    Probe preview
                  </div>
                  <div className="mt-3 space-y-2">
                    {result.probeCandidates.map((candidate) => (
                      <div key={candidate} className="rounded-xl border border-[var(--border-subtle)] bg-black/10 px-3 py-2 text-xs break-all text-[var(--text-secondary)]">
                        {candidate}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info size={15} className="text-[var(--accent-cyan)]" />
                  Honesty guardrail
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Bir kaynak “integrated” sayılmaz; burada sadece aday normalizasyonu, metadata ipuçları ve erişim tahmini gösterilir.
                  Protected, captcha ve login işaretleri canlı doğrulama olmadan kesin kabul edilmez.
                </p>
              </div>

              {seedPreview && (
                <pre className="max-h-80 overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-black/30 p-4 text-[11px] leading-5 text-[var(--text-secondary)]">
                  {JSON.stringify(seedPreview, null, 2)}
                </pre>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
