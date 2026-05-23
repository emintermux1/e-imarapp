"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type NotificationChannel = "push" | "email" | "inapp";
export type NotificationSeverity = "info" | "warning" | "critical" | "success";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  channel: NotificationChannel;
  read: boolean;
  dismissed: boolean;
  parcelId?: string;
  planId?: string;
  reportId?: string;
  actionHref?: string;
  actionLabel?: string;
  createdAt: string;
}

export interface PushSubscriptionMeta {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string;
  channels: NotificationChannel[];
  lastUpdated: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  pushSubscribed: boolean;
  pushDenied: boolean;
  showCenter: boolean;
  channelFilters: NotificationChannel[];
  severityFilters: NotificationSeverity[];

  addNotification: (n: Omit<AppNotification, "id" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  setShowCenter: (v: boolean) => void;
  toggleCenter: () => void;
  setPushSubscribed: (v: boolean) => void;
  setPushDenied: (v: boolean) => void;
  setChannelFilters: (channels: NotificationChannel[]) => void;
  dismissedIds: string[];
}

function notifyId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      pushSubscribed: false,
      pushDenied: false,
      showCenter: false,
      channelFilters: [],
      severityFilters: [],
      dismissedIds: [],

      addNotification: (n) =>
        set((s) => {
          const id = notifyId();
          const notif: AppNotification = {
            ...n,
            id,
            createdAt: new Date().toISOString()
          };
          const notifications = [notif, ...s.notifications].slice(0, 200);
          const unreadCount = notifications.filter((x) => !x.read && !x.dismissed).length;
          return { notifications, unreadCount };
        }),

      markRead: (id) =>
        set((s) => {
          const notifications = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          const unreadCount = notifications.filter((x) => !x.read && !x.dismissed).length;
          return { notifications, unreadCount };
        }),

      markAllRead: () =>
        set((s) => {
          const notifications = s.notifications.map((n) => ({ ...n, read: true }));
          return { notifications, unreadCount: 0 };
        }),

      dismiss: (id) =>
        set((s) => {
          const notifications = s.notifications.map((n) =>
            n.id === id ? { ...n, dismissed: true } : n
          );
          const unreadCount = notifications.filter((x) => !x.read && !x.dismissed).length;
          const dismissedIds = s.dismissedIds.includes(id)
            ? s.dismissedIds
            : [...s.dismissedIds, id].slice(-500);
          return { notifications, unreadCount, dismissedIds };
        }),

      clearAll: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, dismissed: true })),
          unreadCount: 0,
          dismissedIds: [...s.dismissedIds, ...s.notifications.map((n) => n.id)].slice(-1000)
        })),

      setShowCenter: (v) => set({ showCenter: v }),
      toggleCenter: () => set((s) => ({ showCenter: !s.showCenter })),
      setPushSubscribed: (v) => set({ pushSubscribed: v, pushDenied: v ? false : undefined }),
      setPushDenied: (v) => set((s) => ({ pushDenied: v, pushSubscribed: v ? false : s.pushSubscribed })),
      setChannelFilters: (channels) => set({ channelFilters: channels })
    }),
    {
      name: "eimar:notifications",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        dismissedIds: s.dismissedIds,
        pushSubscribed: s.pushSubscribed,
        pushDenied: s.pushDenied,
        channelFilters: s.channelFilters
      })
    }
  )
);
