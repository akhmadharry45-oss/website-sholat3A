/* Service worker Jurnal Sholat dan Mengaji: membuat aplikasi bisa dibuka tanpa internet. */
const V = 'jsm-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);

  // Halaman: ambil yang terbaru saat online, pakai salinan tersimpan saat offline.
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r)
        .then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })
        .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    );
    return;
  }

  // Berkas milik aplikasi (ikon, manifest): salinan tersimpan lebih dulu.
  if (u.origin === self.location.origin) {
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res;
      }))
    );
    return;
  }

  // Font Google: simpan agar tampilan tetap sama saat offline.
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(V).then(c => c.match(r).then(m => {
        const net = fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => m);
        return m || net;
      }))
    );
  }
});
