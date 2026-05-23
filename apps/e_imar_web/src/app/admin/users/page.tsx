"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { AdminMetric, AdminShell, AdminSourceLabel, AdminTable } from "@/components/admin/admin-shell";
import { adminUsers } from "@/components/admin/admin-data";
import { Button } from "@/components/ui/button";
import { validateUser, type UserInput } from "@/lib/validation/user-schema";

export default function AdminUsersPage() {
  const [message, setMessage] = React.useState<string | null>(null);
  const { register, handleSubmit, setError, setFocus, formState: { errors } } = useForm<UserInput>({
    defaultValues: { name: "", email: "", role: "analyst", status: "invited" }
  });
  const hasErrors = Object.keys(errors).length > 0;

  function onSubmit(values: UserInput) {
    setMessage(null);
    const result = validateUser(values);
    if (!result.ok) {
      Object.entries(result.errors).forEach(([name, error]) => {
        if (error) setError(name as keyof UserInput, { type: "validate", message: error });
      });
      const firstError = Object.keys(result.errors).find((name) => result.errors[name as keyof UserInput]);
      if (firstError) setFocus(firstError as keyof UserInput);
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-describedby={hasErrors ? "admin-user-errors" : undefined} className="mt-4 grid gap-3 rounded-[1.5rem] border border-border-subtle bg-surface-1 p-4 md:grid-cols-5">
        {hasErrors && (
          <div id="admin-user-errors" role="alert" className="md:col-span-5 rounded-2xl border border-status-error/25 bg-status-error/10 px-3 py-2 text-xs font-semibold text-status-error">
            Davet doğrulanamadı. Hatalı alanları kontrol edin.
          </div>
        )}
        <FormInput label="Ad soyad" htmlFor="admin-user-name" error={errors.name?.message}>
          <input id="admin-user-name" {...register("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "admin-user-name-error" : undefined} className="admin-input" />
        </FormInput>
        <FormInput label="E-posta" htmlFor="admin-user-email" error={errors.email?.message}>
          <input id="admin-user-email" {...register("email")} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "admin-user-email-error" : undefined} className="admin-input" />
        </FormInput>
        <FormInput label="Rol" htmlFor="admin-user-role" error={errors.role?.message}>
          <select id="admin-user-role" {...register("role")} aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? "admin-user-role-error" : undefined} className="admin-input"><option value="owner">Owner</option><option value="admin">Admin</option><option value="analyst">Analyst</option><option value="viewer">Viewer</option></select>
        </FormInput>
        <FormInput label="Durum" htmlFor="admin-user-status" error={errors.status?.message}>
          <select id="admin-user-status" {...register("status")} aria-invalid={Boolean(errors.status)} aria-describedby={errors.status ? "admin-user-status-error" : undefined} className="admin-input"><option value="active">Active</option><option value="invited">Invited</option><option value="suspended">Suspended</option></select>
        </FormInput>
        <div className="flex items-end"><Button type="submit" variant="primary" className="w-full">Davet doğrula</Button></div>
        {message && <p role="status" className="md:col-span-5 rounded-2xl border border-status-success/25 bg-status-success/10 px-3 py-2 text-xs font-semibold text-status-success">{message}</p>}
      </form>

      <AdminTable title="Kullanıcı erişimi" description="Demo kullanıcı listesi; davet doğrulaması client-side kontratı test eder ve kayıt persist etmez." state={adminUsers.length > 0 ? "ready" : "empty"}>
        <table className="admin-responsive-table w-full text-left text-sm">
          <thead className="bg-surface-2 text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            <tr><th className="p-3">Kullanıcı</th><th>Rol</th><th>Durum</th><th>Etiket</th><th>Favori</th><th>Son aktivite</th></tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => (
              <tr key={user.id} className="border-t border-border-subtle">
                <td data-label="Kullanıcı" className="p-3"><div className="font-black text-fg-primary">{user.name}</div><div className="text-xs text-fg-muted">{user.email}</div></td>
                <td data-label="Rol" className="font-semibold uppercase text-fg-secondary">{user.role}</td>
                <td data-label="Durum"><span className="rounded-full bg-surface-2 px-2 py-1 text-xs font-bold">{user.status}</span></td>
                <td data-label="Etiket"><AdminSourceLabel status={user.status === "active" ? "live" : user.status === "invited" ? "demo" : "not_ready"} label={user.status === "active" ? "Canlı erişim" : user.status === "invited" ? "Demo davet" : "Kilitli"} /></td>
                <td data-label="Favori" className="tabular-nums">{user.watchedParcels}</td>
                <td data-label="Son aktivite" className="text-fg-muted">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(user.lastSeen))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </AdminShell>
  );
}

function FormInput({ label, htmlFor, children, error }: { label: string; htmlFor: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-fg-muted">{label}</label>
      {children}
      {error && <span id={`${htmlFor}-error`} role="alert" className="mt-1 block text-xs font-semibold text-status-error">{error}</span>}
    </div>
  );
}
