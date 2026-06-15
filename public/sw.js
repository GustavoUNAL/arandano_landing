/* Service worker — push de la polla (archivo estático, compatible con Next standalone) */

self.addEventListener('push', (event) => {
  let payload = { title: 'Polla Mundial', body: '', tag: 'polla', url: '/perfil' }

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch {
    /* ignore */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/apple-touch-icon.png',
      badge: '/favicon-32.png',
      tag: payload.tag,
      data: { url: payload.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/perfil'
  const absoluteUrl = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus()
          if ('navigate' in client && typeof client.navigate === 'function') {
            return client.navigate(absoluteUrl)
          }
          return undefined
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl)
      }
    })
  )
})
