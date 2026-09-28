self.addEventListener("push", function (event) {
  if (!event.data) {
    return;
  }

  var payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    payload = {
      title: "LCB Training",
      body: event.data.text(),
      url: "/dashboard",
    };
  }

  var title = payload.title || "LCB Training";
  var body = payload.body || "";
  var url = payload.url || "/dashboard";
  var icon = payload.icon || "/pwa-192.png";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: icon,
      data: { url: url },
    }),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var index = 0; index < clientList.length; index += 1) {
        var client = clientList[index];
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
