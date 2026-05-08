"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.access_token);
      router.push("/dashboard");
    } catch (e) {
      setError("Giriş başarısız: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-fade-in-up">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <LogIn size={22} className="text-[var(--accent-cyan)]" />
          <h1 className="text-2xl font-bold">Giriş Yap</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-cyan)]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-cyan)]/50"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-[var(--text-secondary)]">
          Hesabın yok mu?{" "}
          <Link href="/register" className="text-[var(--accent-cyan)] hover:underline">
            Kaydol
          </Link>
        </p>
      </div>
    </div>
  );
}
