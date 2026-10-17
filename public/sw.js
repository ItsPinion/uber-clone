self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { body: event.data?.text() ?? "You have a new ride update." }; }
  const title = typeof payload.title === "string" ? payload.title : "CabBook ride update";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "There is a new update on your ride.",
    tag: typeof payload.tag === "string" ? payload.tag : "cabbook-ride-update",
    data: { url: typeof payload.url === "string" ? payload.url : "/notifications" },
    icon: "/cabbook-mark.svg",
    badge: "/cabbook-mark.svg",
    renotify: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = typeof event.notification.data?.url === "string" ? event.notification.data.url : "/notifications";
  const target = new URL(path, self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) return existing.navigate(target.href).then(() => existing.focus());
    return self.clients.openWindow(target.href);
  }));
});
