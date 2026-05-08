import { PlatformShell } from "@/components/shell/PlatformShell";

export default function SettingsPage() {
  return (
    <PlatformShell>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Ayarlar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Harita stili, tema modu, layer varsayılanları ve bildirim tercihleri.
        </p>
      </section>
    </PlatformShell>
  );
}
