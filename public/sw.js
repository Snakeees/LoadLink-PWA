// /public/sw.js
const CACHE_NAME = "loadlink-shell-v1";
const SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];
const API_PREFIX = "/api";

const VERSION_ENDPOINT = "/api/version";
const META_CACHE = `${CACHE_NAME}-meta`;
const META_URL = new URL("/__meta/version", self.location.origin).toString();
const VERSION_CHECK_INTERVAL_MS = 60_000; // throttle checks (1 min)
let lastVersionCheckTs = 0;

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
        (async () => {
            // Remove old cache buckets
            const keys = await caches.keys();
            log("existing caches:", keys);
            await Promise.all(
                keys.map((k) => (k !== CACHE_NAME ? (log("deleting old cache:", k), caches.delete(k)) : null))
            );

            // Purge any stale /api/* entries from the current cache
            const cache = await caches.open(CACHE_NAME);
            const entries = await cache.keys();
            const toDelete = entries.filter((req) => {
                const u = new URL(req.url);
                return u.origin === self.location.origin && u.pathname.startsWith(API_PREFIX);
            });
            await Promise.all(toDelete.map((req) => cache.delete(req)));
            if (toDelete.length) log("purged legacy API cache entries:", toDelete.length);

            await checkAndResetIfVersionChanged({force: true});

            log("activate complete");
        })().catch((e) => err("activate error:", e))
    );
    self.clients.claim();
    log("clients.claim called");
});

// Helpers for version storage in a meta cache
async function getStoredVersion() {
    const c = await caches.open(META_CACHE);
    const r = await c.match(META_URL);
    return r ? (await r.text()).trim() : null;
}

async function setStoredVersion(v) {
    const c = await caches.open(META_CACHE);
    await c.put(META_URL, new Response(String(v), {headers: {"content-type": "text/plain"}}));
}

async function fetchCurrentVersion() {
    const res = await fetch(VERSION_ENDPOINT, {cache: "no-store"});
    if (!res.ok) throw new Error(`version http ${res.status}`);
    const j = await res.json();
    return String(j.version || "");
}

async function clearAllCaches() {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
}

async function notifyClients(msg) {
    const clis = await self.clients.matchAll({includeUncontrolled: true, type: "window"});
    for (const c of clis) c.postMessage(msg);
}

// Main check function
async function checkAndResetIfVersionChanged({force = false} = {}) {
    const now = Date.now();
    if (!force && now - lastVersionCheckTs < VERSION_CHECK_INTERVAL_MS) return;
    lastVersionCheckTs = now;

    try {
        const [stored, current] = await Promise.all([getStoredVersion(), fetchCurrentVersion()]);
        if (!stored) {
            log("version meta not found; setting to", current);
            await setStoredVersion(current);
            return;
        }
        if (stored !== current) {
            warn("version changed:", stored, "→", current, "; wiping all caches…");
            await clearAllCaches();

            // Recreate caches: write new version, then re-precache shell for offline safety
            await setStoredVersion(current);
            await caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)).catch((e) => err("re-precache failed:", e));

            // Tell pages to reload to pick up fresh assets
            await notifyClients({type: "version-changed", from: stored, to: current});
        }
    } catch (e) {
        err("version check failed:", e);
    }
}

// Basic fetch handler
self.addEventListener("fetch", (event) => {
    const req = event.request;
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;
    const isApi = sameOrigin && url.pathname.startsWith(API_PREFIX);

    // Never intercept/cache /api/* — always go to network
    if (isApi) {
        if (req.method === "GET") log("API passthrough:", url.pathname + url.search);

        // Opportunistic version check on API traffic (throttled)
        if (url.pathname === "/api/version") {
            // still passthrough for the real response
            event.respondWith(fetch(req));
            // but also persist the latest value & handle wiping in the background
            event.waitUntil(checkAndResetIfVersionChanged());
            return;
        }

        event.respondWith(fetch(req));
        return;
    }

    // Check version on navigations (best place to ensure users get refreshed)
    if (req.mode === "navigate" && sameOrigin) {
        event.waitUntil(checkAndResetIfVersionChanged());
    }

    // Reduce log noise: only log same-origin GETs
    if (req.method === "GET" && sameOrigin) {
        log("fetch:", url.pathname);
    }

    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) {
                if (sameOrigin && req.method === "GET") log("cache HIT:", url.pathname);
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
