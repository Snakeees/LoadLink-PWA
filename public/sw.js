const CACHE_NAME = "loadlink-shell-v1";
const SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))
        )
    );
    self.clients.claim();
});

// Basic fetch handler (required by some browsers’ “installable” checks)
self.addEventListener("fetch", (event) => {
    const req = event.request;
    event.respondWith(
        caches.match(req).then((cached) =>
            cached ||
            fetch(req).then((res) => {
                if (req.method === "GET" && res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                }
                return res;
            }).catch(() => cached)
        )
    );
});
