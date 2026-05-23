"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { AdminMetric, AdminShell, AdminTable } from "@/components/admin/admin-shell";
import { adminUsers } from "@/components/admin/admin-data";
import { Button } from "@/components/ui/button";
import { validateUser, type UserInput } from "@/lib/validation/user-schema";

export default function AdminUsersPage() {
  const [message, setMessage] = React.useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<UserInput>({
    defaultValues: { name: "", email: "", role: "analyst", status: "invited" }
  });

  function onSubmit(values: UserInput) {
    setMessage(null);
    const result = validateUser(values);
    if (!result.ok) {
      Object.entries(result.errors).forEach(([name, error]) => {
        if (error) setError(name as keyof UserInput, { type: "validate", message: error });
      });
      return;
    }
    setMessage(`${result.data.email} için davet doğrulandı. Demo ortamında kayıt persist edilmez.`);
  }

  return (
    <AdminShell title="Users" eyebrow="Admin / users">
      <div className="grid gap-3 md:grid-cols-3">
        <AdminMetric label="Aktif" value={String(adminUsers.filter((u) => u.status === "active").length)} detail="Oturum açabilen kullanıcı" tone="good" />
        <AdminMetric label="Davet" value={String(adminUsers.filter((u) => u.status === "invited").length)} detail="Onay bekleyen hesap" tone="warn" />
        <AdminMetric label="Favori parsel" value={String(adminUsers.reduce((sum, user) => sum + user.watchedParcels, 0))} detail="Toplam watchlist kaydı" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 grid gap-3 rounded-[1.5rem] border border-border-subtle bg-surface-1 p-4 md:grid-cols-5">
        <FormInput label="Ad soyad" error={errors.name?.message} input={<input {...register("name")} className="admin-input" />} />
        <FormInput label="E-posta" error={errors.email?.message} input={<input {...register("email")} type="email" className="admin-input" />} />
        <FormInput label="Rol" error={errors.role?.message} input={<select {...register("role")} className="admin-input"><option value="owner">Owner</option><option value="admin">Admin</option><option value="analyst">Analyst</option><option value="viewer">Viewer</option></select>} />
        <FormInput label="Durum" error={errors.status?.message} input={<select {...register("status")} className="admin-input"><option value="active">Active</option><option value="invited">Invited</option><option value="suspended">Suspended</option></select>} />
        <div className="flex items-end"><Button type="submit" variant="primary" className="w-full">Davet doğrula</Button></div>
        {message && <p className="md:col-span-5 rounded-2xl border border-status-success/25 bg-status-success/10 px-3 py-2 text-xs font-semibold text-status-success">{message}</p>}
      </form>

      <AdminTable>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="bg-surface-2 text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            <tr><th className="p-3">Kullanıcı</th><th>Rol</th><th>Durum</th><th>Favori</th><th>Son aktivite</th></tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => (
              <tr key={user.id} className="border-t border-border-subtle">
                <td className="p-3"><div className="font-black text-fg-primary">{user.name}</div><div className="text-xs text-fg-muted">{user.email}</div></td>
                <td className="font-semibold uppercase text-fg-secondary">{user.role}</td>
                <td><span className="rounded-full bg-surface-2 px-2 py-1 text-xs font-bold">{user.status}</span></td>
                <td className="tabular-nums">{user.watchedParcels}</td>
                <td className="text-fg-muted">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(user.lastSeen))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </AdminShell>
  );
}

function FormInput({ label, input, error }: { label: string; input: React.ReactNode; error?: string }) {
  return <label><span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-fg-muted">{label}</span>{input}{error && <span className="mt-1 block text-xs font-semibold text-status-error">{error}</span>}</label>;
}
