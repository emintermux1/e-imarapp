/* eslint-disable */
// E-İmar push notification service worker
// Receives push events and shows system notifications.
// Registered from push-subscription-form.tsx via navigator.serviceWorker.register("/sw.js").

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || "E-İmar Bildirimi";
    const options = {
      body: payload.body || "",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: payload.tag || "eimar-notification",
      data: {
        url: payload.url || "/",
        parcelId: payload.parcelId,
        reportId: payload.reportId,
        planId: payload.planId
      },
      requireInteraction: payload.requireInteraction || false,
      vibrate: [200, 100, 200],
      actions: payload.actions || []
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Non-JSON payload — show as plain text
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("E-İmar", {
        body: text,
        icon: "/icon.svg"
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({
              type: "eimar:notification-click",
              data: event.notification.data
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
