export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-heading mb-6 text-center">Kayıt Ol</h1>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2">Ad Soyad</label>
            <input
              type="text"
              id="name"
              className="w-full px-3 py-2 bg-foreground/10 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2">E-posta</label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 bg-foreground/10 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2">Şifre</label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 bg-foreground/10 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-2">Şifre Tekrar</label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full px-3 py-2 bg-foreground/10 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button type="submit" className="w-full btn-primary">
            Kayıt Ol
          </button>
        </form>
        <p className="mt-4 text-center">
          Zaten hesabınız var mı? <a href="/login" className="text-accent hover:underline">Giriş yap</a>
        </p>
      </div>
    </div>
  )
}