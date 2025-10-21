// app/api/version/route.ts
import {NextResponse} from "next/server";

// Avoid edge/CDN caching
export const dynamic = "force-dynamic";

export function GET() {
    const version =
        process.env.NEXT_PUBLIC_APP_VERSION ||
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
        "dev";
    const buildAt = process.env.NEXT_PUBLIC_BUILD_AT || new Date().toISOString();

    return NextResponse.json(
        {version, buildAt},
        {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
        }
    );
}
