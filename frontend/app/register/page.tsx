"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
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
      await register(email, password);
      router.push("/login");
    } catch (e) {
      setError("Kayıt başarısız: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-fade-in-up">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus size={22} className="text-[var(--accent-magenta)]" />
          <h1 className="text-2xl font-bold">Kaydol</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-magenta)]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-magenta)]/50"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent-magenta)] text-white font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Kaydol"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-[var(--text-secondary)]">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="text-[var(--accent-cyan)] hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
