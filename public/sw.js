// /public/sw.js
const CACHE_NAME = "loadlink-shell-v1";
const SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

// Simple logger
const log = (...a) => console.log(`[SW ${CACHE_NAME}]`, ...a);
const warn = (...a) => console.warn(`[SW ${CACHE_NAME}]`, ...a);
const err = (...a) => console.error(`[SW ${CACHE_NAME}]`, ...a);

// Global error diagnostics
self.addEventListener("error", (e) => err("runtime error:", e.message, e.filename, e.lineno));
self.addEventListener("unhandledrejection", (e) => err("unhandled rejection:", e.reason));

self.addEventListener("install", (event) => {
    log("install start; precaching:", SHELL);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((c) => c.addAll(SHELL))
            .then(() => log("install complete; precache OK"))
            .catch((e) => err("install failed; precache error:", e))
    );
    self.skipWaiting();
    log("skipWaiting called");
});

self.addEventListener("activate", (event) => {
    log("activate start");
    event.waitUntil(
        caches.keys().then((keys) => {
            log("existing caches:", keys);
            return Promise.all(
                keys.map((k) => {
                    if (k !== CACHE_NAME) {
                        log("deleting old cache:", k);
                        return caches.delete(k);
                    }
                    return null;
                })
            );
        }).then(() => log("activate complete"))
            .catch((e) => err("activate error:", e))
    );
    self.clients.claim();
    log("clients.claim called");
});

// Basic fetch handler (required by some browsers’ “installable” checks)
self.addEventListener("fetch", (event) => {
    const req = event.request;
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;

    // Reduce log noise: only log same-origin GETs
    if (req.method === "GET" && sameOrigin) {
        log("fetch:", url.pathname);
    }

    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) {
                if (sameOrigin && req.method === "GET") {
                    log("cache HIT:", url.pathname);
                }
                return cached;
            }

            return fetch(req)
                .then((res) => {
                    if (req.method === "GET" && res.ok) {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((c) => {
                            c.put(req, copy)
                                .then(() => sameOrigin && log("cached:", url.pathname))
                                .catch((e) => err("cache put failed:", url.pathname, e));
                        });
                    } else if (!res.ok) {
                        warn("network non-OK:", req.url, res.status);
                    }
                    return res;
                })
                .catch((e) => {
                    err("network failed; fallback to cache if any:", req.url, e);
                    return cached || Response.error();
                });
        })
    );
});
