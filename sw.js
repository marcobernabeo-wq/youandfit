/* You and Fit — serve l'app anche senza rete.
   Rete per prima: se c'è connessione prendo la versione aggiornata,
   altrimenti servo l'ultima copia salvata. Nessun dato dell'utente passa di qui. */
const CACHE = 'yaf-shell-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const nomi = await caches.keys();
    await Promise.all(nomi.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // i font di Google se li gestisce il browser

  e.respondWith((async () => {
    try {
      const fresca = await fetch(req);
      if (fresca && fresca.status === 200) {
        const c = await caches.open(CACHE);
        c.put(req, fresca.clone());
      }
      return fresca;
    } catch (err) {
      const salvata = await caches.match(req, { ignoreSearch: true });
      if (salvata) return salvata;
      const home = await caches.match('./', { ignoreSearch: true })
                || await caches.match('index.html', { ignoreSearch: true });
      if (home && req.mode === 'navigate') return home;
      throw err;
    }
  })());
});
