# LoadLink

Lightweight web UI to view the status of shared laundry machines (washers/dryers). It polls a backend source, normalizes
records, and displays a live dashboard with simple backoff/offline handling. Includes a basic PWA manifest and a service
worker that precaches the shell and watches for app version changes.

## Overview

- Frontend: Next.js App Router (React 19, TypeScript, Tailwind CSS v4)
- API routes in Next.js for:
    - GET `/api/machines` — proxies to your backend's `/machines` endpoint
    - GET `/api/version` — returns the current app version/build timestamp (used by the Service Worker)
- UI page: `src/app/page.tsx` renders machine cards and implements polling/backoff/offline states.
- Client library: `src/lib/api.ts` handles fetching, query params, and data normalization to the UI shape.
- PWA: `public/manifest.json` and `public/sw.js` (cache shell; never caches `/api/*`; auto-refreshes when the app
  version changes).

## Tech Stack

- Language: TypeScript
- Framework: Next.js 15 (App Router)
- React: 19.x
- Styling: Tailwind CSS v4
- Package manager: npm (package-lock.json present)
- Runtime: Node.js (Dockerfile uses Node 20-alpine)

## Requirements

- Node.js 18+ recommended (Node 20 used in Docker, and supported by Next 15)
- npm 9+ (matches Node 18+/20 baseline)
- A reachable backend that exposes a `/machines` endpoint compatible with the proxy in this repo

> TODO: Specify the exact Node/npm versions you run in CI/production if applicable.

## Environment Variables

Create a `.env` file in the project root (see `.env` example already present).

Required at runtime (server-side):

- `BACKEND_ORIGIN` — Base URL of your backend service (no trailing slash). Example: `https://backend.example.com`
    - Used by: `src/app/api/machines/route.ts`
    - If missing, the API route will throw: "Missing env BACKEND_ORIGIN".

Optional (client-visible):

- `NEXT_PUBLIC_API_BASE_URL` — Base path for client fetches; defaults to `/api`. Used by `src/lib/api.ts`.
- `NEXT_PUBLIC_APP_VERSION` — Version string exposed by `/api/version` (falls back to Vercel commit SHA or `dev`).
- `NEXT_PUBLIC_BUILD_AT` — Optional build timestamp used by `/api/version`.

## Scripts

Defined in `package.json`:

- `npm run dev` — Start Next.js in dev mode with Turbopack.
- `npm run build` — Build the production bundle (Turbopack).
- `npm run start` — Run the production server.
- `npm run lint` — Run ESLint.

## Setup

1. Clone the repo and install dependencies:
    - `npm ci` (recommended for reproducible installs) or `npm install`
2. Create `.env` and set at least `BACKEND_ORIGIN`.
3. Start dev server:
    - `npm run dev`
4. Open http://localhost:3000

## Running in Production

- Build: `npm run build`
- Start: `npm run start`

Ensure the environment variable `BACKEND_ORIGIN` is set in the runtime environment (e.g., your process manager,
container, or hosting provider). The app listens on `PORT=3000` by default (configurable in many hosts; Dockerfile sets
`ENV PORT=3000`).

## Docker

A multi-stage Dockerfile is included and pins Node 20-alpine.

Build the image:
```bash
# from repo root
docker build -t loadlink:latest .
```

Run the container (make sure to provide BACKEND_ORIGIN at runtime):

```bash
docker run --rm -p 3000:3000 -e BACKEND_ORIGIN="https://backend.example.com" loadlink:latest
```

Notes:

- The Dockerfile defines `ARG BACKEND_ORIGIN` in the builder stage, but the application requires `BACKEND_ORIGIN` at
  runtime. Pass it with `-e` as shown above.
- Exposes port 3000; visit http://localhost:3000

## API Endpoints (App Router)

- `GET /api/machines`
    - Proxies to `${BACKEND_ORIGIN}/machines` and forwards minimal headers.
    - Never cached at the Next layer (force-dynamic, revalidate 0).
- `GET /api/version`
    - Returns `{ version, buildAt }` from envs listed above.
    - Service Worker queries this to detect updates and refresh caches.

## Service Worker & PWA

- Manifest: `public/manifest.json` (name, icons, theme, start_url)
- Service Worker: `public/sw.js`
    - Precaches an app shell and performs cache-first for static content.
    - Never caches `/api/*`; API requests always go to network.
    - Throttled version checks; wipes caches and notifies clients when version changes.

> TODO: Confirm SW registration is wired in the app (e.g., via a small client effect). If not, add registration code so
> the SW runs in production.

## Project Structure

```
.
├─ Dockerfile
├─ next.config.ts
├─ package.json
├─ public/
│  ├─ manifest.json
│  └─ sw.js
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ machines/route.ts      # proxy to BACKEND_ORIGIN/machines
│  │  │  └─ version/route.ts       # app version endpoint
│  │  └─ page.tsx                  # main dashboard UI
│  ├─ components/
│  │  └─ MachineCard.tsx
│  └─ lib/
│     └─ api.ts                    # client fetch + normalization
└─ .env                            # environment variables (local)
```

## Development Notes

- The UI implements polling with graceful backoff and offline detection.
- `src/lib/api.ts` provides a fallback demo dataset when `strict` is false and requests fail; in strict mode errors
  propagate for UI backoff.
- Tailwind CSS v4 is configured via `@tailwindcss/postcss` in `postcss.config.mjs`.

## Testing

- No tests were found in the repository.
- TODO: Add unit tests for `src/lib/api.ts` normalization and integration tests for API routes.

## Deployment

- The app should work on any Node hosting that supports Next.js 15.
- Vercel is a common target for Next.js; ensure `BACKEND_ORIGIN` is set as a project env var.
- TODO: Document CI/CD steps (build cache, env promotion, preview vs prod).

## License

- No license file detected.
- TODO: Add a LICENSE file (MIT/Apache-2.0/etc.) and update this section accordingly.

## Acknowledgements & References

- Next.js docs: https://nextjs.org/docs
- Tailwind CSS v4: https://tailwindcss.com
- React 19: https://react.dev
