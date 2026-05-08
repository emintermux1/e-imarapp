import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-foreground/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-heading text-accent">
            e-İmar
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/dashboard" className="hover:text-accent transition-colors">
              Dashboard
            </Link>
            <Link href="/arama" className="hover:text-accent transition-colors">
              Arama
            </Link>
            <Link href="/rapor" className="hover:text-accent transition-colors">
              Raporlar
            </Link>
            <Link href="/simulasyon" className="hover:text-accent transition-colors">
              Simülasyon
            </Link>
          </nav>
          <div className="flex space-x-2">
            <Link href="/login" className="btn-secondary">
              Giriş
            </Link>
            <Link href="/register" className="btn-primary">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-heading mb-6">
            İmar Planlamasını <span className="text-accent">Dönüştürüyoruz</span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Belediyeler için gelişmiş imar planlama, izleme ve analiz platformu
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
              Dashboard'a Git
            </Link>
            <Link href="/simulasyon" className="btn-secondary text-lg px-8 py-3">
              3D Simülasyon
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card">
            <h3 className="text-xl font-heading mb-3">Harita & Parsel</h3>
            <p>İnteraktif harita üzerinden parselleri görüntüleyin ve detaylı bilgi alın</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-heading mb-3">Planlama</h3>
            <p>İmar planlarını yönetin, güncelleyin ve yeni planlar oluşturun</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-heading mb-3">Analiz</h3>
            <p>Uydu verileri ve simülasyonlarla imar durumunu analiz edin</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2026 e-İmar Platformu. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}