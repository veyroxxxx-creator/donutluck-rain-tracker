// DonutLuck Rain Tracker service worker.
// Only responsible for push notifications — no offline caching, so it stays
// simple and never serves stale app content.

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var title = 'DonutLuck Rain';
  var body = 'Rain event started on DonutLuck.';

  if (event.data) {
    try {
      var payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
    } catch (e) {
      // Payload wasn't JSON — fall back to the text (or the defaults above).
      var text = event.data.text && event.data.text();
      if (text) body = text;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      tag: 'donutluck-rain',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientsList) {
      for (var i = 0; i < clientsList.length; i++) {
        var client = clientsList[i];
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    }),
  );
});
