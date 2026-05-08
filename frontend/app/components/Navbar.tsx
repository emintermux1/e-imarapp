import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="border-b border-foreground/10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-heading text-accent">
          e-İmar
        </Link>
        <div className="hidden md:flex space-x-6">
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
        </div>
        <div className="flex space-x-2">
          <Link href="/login" className="btn-secondary">
            Giriş
          </Link>
          <Link href="/register" className="btn-primary">
            Kayıt Ol
          </Link>
        </div>
      </div>
    </nav>
  )
}