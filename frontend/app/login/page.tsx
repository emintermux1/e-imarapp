export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-heading mb-6 text-center">Giriş Yap</h1>
        <form className="space-y-4">
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
          <button type="submit" className="w-full btn-primary">
            Giriş Yap
          </button>
        </form>
        <p className="mt-4 text-center">
          Hesabınız yok mu? <a href="/register" className="text-accent hover:underline">Kayıt ol</a>
        </p>
      </div>
    </div>
  )
}