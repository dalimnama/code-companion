self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const adminClient = clients.find((client) =>
        client.url.includes('/admin')
      );

      if (adminClient && 'focus' in adminClient) {
        return adminClient.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow('/admin');
      }

      return undefined;
    })
  );
});
