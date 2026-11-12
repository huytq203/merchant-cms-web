/* Service worker nhận push của Portal (FCM web push).
 * Không nạp Firebase SDK: FCM gửi tới trình duyệt một payload JSON {notification, data, fcmOptions}
 * và sự kiện `push` là đủ để hiện thông báo, nên worker không phụ thuộc CDN hay phiên bản SDK.
 * Phải nằm ở gốc site để phạm vi của nó phủ cả Portal. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    return; // payload không phải JSON thì bỏ qua, không hiện thông báo rỗng
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Thông báo";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: notification.body || data.body || "",
      icon: notification.icon || "/icon-192x192.png",
      // Giữ link để notificationclick mở đúng trang; BE gửi link tuyệt đối của Portal.
      data: { link: data.link || (payload.fcmOptions && payload.fcmOptions.link) || "" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data && event.notification.data.link;
  // Chỉ mở link cùng origin với Portal; link lạ thì rơi về trang chủ.
  let target = "/";
  try {
    const url = new URL(link, self.location.origin);
    if (url.origin === self.location.origin) target = url.href;
  } catch (_) {
    /* link rỗng hoặc sai định dạng: giữ trang chủ */
  }
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Ưu tiên tab Portal đang mở: chuyển nó tới link thay vì mở tab mới.
      for (const client of windows) {
        if ("navigate" in client && "focus" in client) {
          return client.navigate(target).then((c) => (c || client).focus());
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
