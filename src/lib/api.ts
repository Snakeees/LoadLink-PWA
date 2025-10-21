// lib/api.ts
export type Machine = {
    id: string;
    type: "washer" | "dryer";
    status: "idle" | "running" | "finished" | "unknown";
    idleMinutes?: number;
    endsAt?: string;
    user?: { discordId: string; name?: string } | null;
    roomId?: string | null;
    roomLabel?: string | null;
    locationId?: string | null;
    locationLabel?: string | null;
};

type MachineBackend = {
    licensePlate: string | null;
    qrCodeId: string | null;
    lastUser?: string | null;
    available?: boolean | number | string;
    type: string;
    timeRemaining?: number | null;
    mode?: string | null;
    lastUpdated?: string | null;
    roomId?: string | null;
    roomLabel?: string | null;
    locationId?: string | null;
    locationLabel?: string | null;
};

const base = typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api")
    : "/api";

function toBool(v: unknown): boolean | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
        const s = v.toLowerCase();
        return s === "1" || s === "true" || s === "yes";
    }
    return undefined;
}

function deriveStatus(b: MachineBackend): Machine["status"] {
    const available = toBool(b.available);
    const tr = typeof b.timeRemaining === "number" ? b.timeRemaining : undefined;
    if (available === true) return "idle";
    if (tr !== undefined && tr > 0) return "running";
    if ((b.mode || "").toLowerCase() === "finished") return "finished";
    if (available === false && (!tr || tr <= 0)) return "finished";
    return "unknown";
}

function computeEndsAt(b: MachineBackend): string | undefined {
    const tr = typeof b.timeRemaining === "number" ? b.timeRemaining : undefined;
    if (!tr || tr <= 0) return undefined;
    return new Date(Date.now() + tr * 60_000).toISOString();
}

function computeIdleMinutes(b: MachineBackend, status: Machine["status"]): number | undefined {
    if (status !== "idle") return undefined;
    if (!b.lastUpdated) return undefined;
    const t = Date.parse(b.lastUpdated);
    if (Number.isNaN(t)) return undefined;
    return Math.max(0, Math.floor((Date.now() - t) / 60_000));
}

function normalizeType(t: string): "washer" | "dryer" {
    const s = (t || "").toLowerCase();
    return s === "dryer" ? "dryer" : "washer";
}

function pickId(b: MachineBackend): string {
    return (b.licensePlate || b.qrCodeId || "unknown").toString();
}

function toUiMachine(b: MachineBackend): Machine {
    const status = deriveStatus(b);
    return {
        id: pickId(b),
        type: normalizeType(b.type),
        status,
        endsAt: computeEndsAt(b),
        idleMinutes: computeIdleMinutes(b, status),
        user: b.lastUser ? {discordId: String(b.lastUser)} : null,
        roomId: b.roomId ?? null,
        roomLabel: b.roomLabel ?? null,
        locationId: b.locationId ?? null,
        locationLabel: b.locationLabel ?? null,
    };
}

type FetchOpts = {
    strict?: boolean;                // if true, throw on non-2xx/network error
    signal?: AbortSignal;            // for aborting from the UI
    init?: RequestInit;              // extra fetch options override/extend
};

export async function fetchMachines(
    params?: {
        room?: string;
        location?: string;
        type?: "washer" | "dryer";
        available?: boolean;
        limit?: number;
        offset?: number;
        machine?: string; // licensePlate or qrCodeId
    },
    opts: FetchOpts = {}
): Promise<Machine[]> {
    const qs = new URLSearchParams();
    if (params) {
        if (params.room) qs.set("room", params.room);
        if (params.location) qs.set("location", params.location);
        if (params.type) qs.set("type", params.type);
        if (params.machine) qs.set("machine", params.machine);
        if (typeof params.available === "boolean") qs.set("available", params.available ? "true" : "false");
        if (typeof params.limit === "number") qs.set("limit", String(params.limit));
        if (typeof params.offset === "number") qs.set("offset", String(params.offset));
    }

    const url = `${base}/machines${qs.toString() ? `?${qs.toString()}` : ""}`;

    // Default fetch init appropriate for client components (no cache, include cookies)
    const init: RequestInit = {
        cache: "no-store",
        credentials: "include",
        signal: opts.signal,
        ...opts.init,
    };

    const fallback = (): Machine[] => {
        const demo: MachineBackend[] = [
            {
                licensePlate: "w1",
                qrCodeId: null,
                type: "washer",
                available: false,
                timeRemaining: 15,
                lastUser: "123",
                roomId: "BARH-2F",
                roomLabel: "BARH 2F",
                locationId: "BARH",
                locationLabel: "BARH",
                lastUpdated: new Date().toISOString(),
            },
            {
                licensePlate: "d4",
                qrCodeId: null,
                type: "dryer",
                available: true,
                timeRemaining: 0,
                lastUser: null,
                roomId: "BARH-2F",
                roomLabel: "BARH 2F",
                locationId: "BARH",
                locationLabel: "BARH",
                lastUpdated: new Date(Date.now() - 12 * 60_000).toISOString(),
            },
        ];
        return demo.map(toUiMachine);
    };

    try {
        const r = await fetch(url, init);

        if (!r.ok) {
            if (opts.strict) throw new Error(String(r.status)); // lets UI backoff show HTTP code
            return fallback();
        }

        const data = (await r.json()) as MachineBackend[];
        return data.map(toUiMachine);
    } catch (err) {
        // Abort should just bubble quietly; the UI ignores AbortError already
        if (err instanceof DOMException && err.name === "AbortError") throw err;

        if (opts.strict) {
            // Surface as generic failure so UI can count a fail streak
            throw new Error("network");
        }
        return fallback();
    }
}
