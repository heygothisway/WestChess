const C = 'chess-v1';
const FILES = ['./', 'index.html', 'app.js', 'chess.js', 'manifest.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(FILES))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
