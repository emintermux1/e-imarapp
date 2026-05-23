import type { AdminUserRole, AdminUserStatus } from "@/lib/validation/user-schema";
import type { SubscriptionPlan } from "@/lib/validation/subscription-schema";
import { FALLBACK_SOURCES } from "@/data/generated/source-fixtures";
import { getAllParcels } from "@/data/parcels";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  lastSeen: string;
  watchedParcels: number;
}

export interface AdminReport {
  id: string;
  parcel: string;
  owner: string;
  sourceCount: number;
  status: "ready" | "draft" | "blocked";
  generatedAt: string;
}

export interface SubscriptionAccount {
  plan: SubscriptionPlan;
  seats: number;
  watchlistLimit: number;
}

export const adminUsers: AdminUser[] = [
  { id: "usr-001", name: "Ayşe Demir", email: "ayse@imar.local", role: "owner", status: "active", lastSeen: "2026-05-22T14:12:00Z", watchedParcels: 18 },
  { id: "usr-002", name: "Mert Kaya", email: "mert@imar.local", role: "admin", status: "active", lastSeen: "2026-05-22T11:45:00Z", watchedParcels: 11 },
  { id: "usr-003", name: "Selin Arslan", email: "selin@imar.local", role: "analyst", status: "invited", lastSeen: "2026-05-20T09:05:00Z", watchedParcels: 4 },
  { id: "usr-004", name: "Can Öztürk", email: "can@imar.local", role: "viewer", status: "suspended", lastSeen: "2026-05-13T16:30:00Z", watchedParcels: 2 }
];

const parcels = getAllParcels().slice(0, 6);

export const adminReports: AdminReport[] = parcels.map((parcel, index) => ({
  id: `RPR-${String(index + 1).padStart(4, "0")}`,
  parcel: `${parcel.properties.ilce} ${parcel.properties.ada}/${parcel.properties.parsel}`,
  owner: adminUsers[index % adminUsers.length].name,
  sourceCount: 3 + (index % 4),
  status: index % 5 === 0 ? "blocked" : index % 3 === 0 ? "draft" : "ready",
  generatedAt: new Date(Date.now() - index * 86400000).toISOString()
}));

export const subscriptionAccount: SubscriptionAccount = {
  plan: "pro",
  seats: 12,
  watchlistLimit: 250
};

export const sourceSummary = {
  total: FALLBACK_SOURCES.length,
  officialish: FALLBACK_SOURCES.filter((source) => source.auth === "public").length,
  protected: FALLBACK_SOURCES.filter((source) => source.auth.includes("requires")).length,
  municipal: FALLBACK_SOURCES.filter((source) => source.category.includes("municipal")).length
};
