import {NextRequest, NextResponse} from "next/server";

// e.g. "https://backend.example.com" (no trailing slash)
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN!;
if (!BACKEND_ORIGIN) {
    throw new Error("Missing env BACKEND_ORIGIN");
}

// Ensure Node runtime (so we can access cookies/headers reliably)
export const runtime = "nodejs";
// Always fresh; never cache at the Next edge/layer
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
    const incoming = new URL(req.url);
    // Preserve query string exactly
    const target = new URL(BACKEND_ORIGIN);
    target.pathname = target.pathname.replace(/\/$/, "") + "/machines";
    target.search = incoming.search;

    // Forward a minimal, safe set of headers that affect payload/identity
    const outHeaders = new Headers();
    const pass = (name: string) => {
        const v = req.headers.get(name);
        if (v) outHeaders.set(name, v);
    };

    pass("authorization");
    pass("cookie");
    pass("accept");
    pass("accept-language");
    pass("user-agent");
    pass("if-none-match");       // allow backend ETag handling
    pass("if-modified-since");   // if you use it

    // Add standard forward headers (useful for backend logs/rate limits)
    outHeaders.set("x-forwarded-host", incoming.host);
    outHeaders.set("x-forwarded-proto", incoming.protocol.replace(":", ""));

    // Optional: timeout so a stuck backend doesn't hang the route
    const ac = new AbortController();
    const timeoutMs = 12_000;
    const t = setTimeout(() => ac.abort(), timeoutMs);

    let r: Response;
    try {
        r = await fetch(target, {
            method: "GET",
            headers: outHeaders,
            cache: "no-store",
            signal: ac.signal,
        });
    } finally {
        clearTimeout(t);
    }

    // Stream the backend response through unchanged (status + body),
    // but force no-store at this layer to avoid accidental caching.
    const resHeaders = new Headers(r.headers);
    resHeaders.set("cache-control", "no-store");

    // NOTE: We intentionally keep the backend's content-type/json as-is.
    return new NextResponse(r.body, {
        status: r.status,
        statusText: r.statusText,
        headers: resHeaders,
    });
}
