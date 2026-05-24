import Link from "next/link";
import { ArrowLeft, Compass, DatabaseZap } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { buttonVariants } from "@/components/ui/button-variants";

const recoveryLinks = [
  { href: "/", label: "Haritaya dön", detail: "Ada/parsel veya belediye ile yeniden sorgula." },
  { href: "/kaynaklar", label: "Kaynak durumunu aç", detail: "Canlı, bloklu ve hazır olmayan entegrasyonları kontrol et." },
  { href: "/calisma-alani", label: "Çalışma alanı", detail: "Sorgu geçmişi ve oturum BFF durumunu incele." }
];

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-bg px-4 py-8 text-fg-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-5xl items-center">
        <section className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="rounded-xl border border-border-strong bg-surface-2 p-6 shadow-card sm:p-8">
            <BrandMark className="text-fg-primary" />
            <p className="mt-10 text-2xs font-bold uppercase tracking-[0.24em] text-brand-red">
              404 · Sayfa bulunamadı
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.05em] text-fg-primary sm:text-[42px] sm:leading-[0.96]">
              Bu rota yayındaki çalışma alanında tanımlı değil.
            </h1>
            <p className="mt-4 max-w-xl text-md leading-7 text-fg-secondary">
              Bağlantı eski bir prototipe, taşınmış ada/parsel detayına veya henüz yayınlanmamış bir modüle işaret ediyor olabilir. Ana harita ve kaynak merkezi güvenli geri dönüş noktalarıdır.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/" className={buttonVariants({ variant: "primary", size: "lg" })}>
                <ArrowLeft className="h-4 w-4" />
                Haritaya dön
              </Link>
              <Link href="/kaynaklar" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <DatabaseZap className="h-4 w-4" />
                Kaynak merkezi
              </Link>
            </div>
          </div>

          <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-1/70">
            <div className="flex items-start gap-3 p-5">
              <span className="mt-1 grid h-9 w-9 place-items-center rounded-full border border-border-strong bg-surface-2 text-brand-navy">
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-fg-primary">Kurtarma yolları</h2>
                <p className="mt-1 text-sm leading-6 text-fg-secondary">Yayın shell’i boş sayfa göstermek yerine kullanıcıyı çalışan BFF yüzeylerine taşır.</p>
              </div>
            </div>
            {recoveryLinks.map((item) => (
              <Link key={item.href} href={item.href} className="block p-5 transition hover:bg-surface-2">
                <div className="text-sm font-bold text-fg-primary">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-fg-secondary">{item.detail}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
