import { BrandMark } from "@/components/layout/brand-mark";

export default function Loading() {
  return (
    <main className="min-h-[100dvh] bg-bg px-4 py-6 text-fg-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between border-b border-border-subtle pb-4">
          <BrandMark className="text-fg-primary" />
          <div className="h-9 w-36 overflow-hidden rounded-full bg-surface-1">
            <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10" />
          </div>
        </header>
        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[280px_1fr_340px]">
          <div className="hidden rounded-xl border border-border-subtle bg-surface-2 p-4 lg:block">
            <div className="h-8 w-32 rounded bg-surface-1" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="h-10 overflow-hidden rounded-md bg-surface-1">
                  <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10" />
                </div>
              ))}
            </div>
          </div>
          <div className="min-h-[520px] rounded-xl border border-border-strong bg-surface-1 p-4 shadow-card">
            <div className="h-full min-h-[480px] overflow-hidden rounded-lg bg-[linear-gradient(135deg,rgb(var(--surface-2))_0%,rgb(var(--surface-1))_52%,rgb(var(--border-subtle))_100%)]">
              <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/65 to-transparent dark:via-white/10" />
            </div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-2 p-4">
            <div className="h-7 w-40 rounded bg-surface-1" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
                  <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
