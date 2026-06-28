self.addEventListener("push", (event) => {
  let payload = {
    title: "Anovic Workspace",
    body: "You have a new notification.",
    href: "/team/notifications",
    tag: "anovic-team-notification",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: payload.tag,
      renotify: true,
      data: { href: payload.href },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/team/notifications";
  const notificationId = event.notification.data?.notificationId;
  const target = new URL(href, self.location.origin).href;

  event.waitUntil(
    Promise.resolve(
      notificationId
        ? fetch(`/api/team/notifications/${encodeURIComponent(notificationId)}/read`, {
            method: "POST",
            credentials: "include",
          }).catch(() => null)
        : null,
    ).then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true })).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }

      return self.clients.openWindow(target);
    }),
  );
});
