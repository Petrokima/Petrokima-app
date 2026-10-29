// Petrokima mobile — keeps the app shell available so it opens instantly.
// Check-ins and requests always go live to the server (never cached).
// v29 (20 Oct 2026): new version only so iPhones install a fresh worker under the corrected Cloudflare security rule —
// a worker keeps the security rule it was installed with until sw.js itself changes.
const VERSION = 'pk-mobile-v46';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './vendor/supabase.js?v=2.117.3'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.endsWith('supabase.co')) return;           // live data: never touch
  if (url.origin === location.origin) {                                                     // app files: network first, cache fallback
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; })
                                  .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
  } else if (/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {    // libraries & fonts: cache first
    e.respondWith(caches.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; })));
  }
});

// ── iPhone notifications (web push, 21 Oct 2026): show the notification and open the right tab when it is tapped ──
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Petrokima', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', lang: d.lang || 'ar', dir: d.lang === 'en' ? 'ltr' : 'rtl',
    data: { view: d.view || 'home' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const view = (e.notification.data && e.notification.data.view) || 'home';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { c.postMessage({ type: 'open-view', view }); return c.focus(); }
    return self.clients.openWindow('./#view=' + view);
  }));
});
