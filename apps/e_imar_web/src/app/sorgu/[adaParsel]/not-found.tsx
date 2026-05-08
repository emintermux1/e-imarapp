import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg p-6">
      <div className="max-w-md w-full bg-surface-2 border border-border-strong rounded-md p-6 text-center shadow-card">
        <div className="text-[10px] uppercase tracking-wider text-fg-muted">
          404 · Parsel Bulunamadı
        </div>
        <h1 className="mt-2 text-xl font-semibold text-fg-primary">
          Bu ada/parsel kaydı tespit edilemedi
        </h1>
        <p className="mt-2 text-sm text-fg-secondary leading-relaxed">
          Bağlantınız geçerli olmayabilir. Ada/parsel numarasını kontrol edin
          veya il/ilçe filtresiyle tekrar deneyin.
        </p>
        <div className="mt-5 flex justify-center">
          <Link href="/" className={buttonVariants({ variant: "primary", size: "md" })}>
            <ArrowLeft className="h-4 w-4" /> Haritaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
