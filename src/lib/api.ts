// lib/api.ts

export type Room = {
    roomId: string;
    label: string;
    locationId: string | null;
    locationLabel: string | null;
    washerCount: number | null;
    dryerCount: number | null;
};

export type Machine = {
    id: string;
    type: "washer" | "dryer";
    status: "idle" | "running" | "unknown";
    idleMinutes?: number;
    timeRemaining?: number | null;
    stickerNumber?: number | null;
    licensePlate?: string | null;
    lastUpdated?: string | null;
    mode?: string | null;
    user?: { discordId: string; name?: string } | null;
    roomId?: string | null;
    roomLabel?: string | null;
    locationId?: string | null;
    locationLabel?: string | null;
};

type MachineBackend = {
    licensePlate: string | null;
    qrCodeId: string | null;
    stickerNumber?: number | string | null;
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

/** Status driven by timeRemaining, with available as a fallback. */
function deriveStatus(b: MachineBackend): Machine["status"] {
    if (b.mode === "unknown") return "unknown";
    const tr =
        typeof b.timeRemaining === "number" ? b.timeRemaining : undefined;

    if (tr !== undefined) {
        if (tr > 0) return "running";
        return "idle"; // tr <= 0 → treated as available
    }

    const available = toBool(b.available);
    if (available === true) return "idle";
    if (available === false) return "running";

    return "unknown";
}

function computeIdleMinutes(
    b: MachineBackend,
    status: Machine["status"]
): number | undefined {
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
    if (b.stickerNumber !== undefined && b.stickerNumber !== null) {
        return String(b.stickerNumber);
    }
    return (b.licensePlate || b.qrCodeId || "unknown").toString();
}

function toUiMachine(b: MachineBackend): Machine {
    const status = deriveStatus(b);
    const tr =
        typeof b.timeRemaining === "number" ? b.timeRemaining : undefined;

    const stickerNumber =
        b.stickerNumber === undefined || b.stickerNumber === null
            ? undefined
            : Number(b.stickerNumber);

    return {
        id: pickId(b),
        type: normalizeType(b.type),
        status,

        timeRemaining: tr,                            // ← use raw minutes
        idleMinutes: computeIdleMinutes(b, status),

        stickerNumber,
        licensePlate: b.licensePlate,
        lastUpdated: b.lastUpdated ?? null,
        mode: b.mode ?? null,

        user: b.lastUser ? {discordId: String(b.lastUser)} : null,
        roomId: b.roomId ?? null,
        roomLabel: b.roomLabel ?? null,
        locationId: b.locationId ?? null,
        locationLabel: b.locationLabel ?? null,
    };
}

type FetchOpts = {
    strict?: boolean;
    signal?: AbortSignal;
    init?: RequestInit;
};

export async function fetchRooms(
    opts: FetchOpts = {}
): Promise<Room[]> {
    const url = `${base}/rooms`;

    const init: RequestInit = {
        cache: "no-store",
        credentials: "include",
        signal: opts.signal,
        ...opts.init,
    };

    const r = await fetch(url, init);
    if (!r.ok) {
        if (opts.strict) throw new Error(String(r.status));
        return [];
    }

    return (await r.json()) as Room[];
}

export async function fetchRoom(
    roomId: string,
    opts: FetchOpts = {}
): Promise<Room | null> {
    if (!roomId) return null;

    const url = `${base}/rooms/${encodeURIComponent(roomId)}`;

    const init: RequestInit = {
        cache: "no-store",
        credentials: "include",
        signal: opts.signal,
        ...opts.init,
    };

    const r = await fetch(url, init);

    if (!r.ok) {
        if (r.status === 404) return null;
        if (opts.strict) throw new Error(String(r.status));
        return null;
    }

    return (await r.json()) as Room;
}


export async function fetchMachines(
    params?: {
        room?: string;
        location?: string;
        type?: "washer" | "dryer";
        available?: boolean;
        limit?: number;
        offset?: number;
        machine?: string;
    },
    opts: FetchOpts = {}
): Promise<Machine[]> {
    const qs = new URLSearchParams();
    if (params) {
        if (params.room) qs.set("room", params.room);
        if (params.location) qs.set("location", params.location);
        if (params.type) qs.set("type", params.type);
        if (params.machine) qs.set("machine", params.machine);
        if (typeof params.available === "boolean")
            qs.set("available", params.available ? "true" : "false");
        if (typeof params.limit === "number")
            qs.set("limit", String(params.limit));
        if (typeof params.offset === "number")
            qs.set("offset", String(params.offset));
    }

    const url = `${base}/machines${
        qs.toString() ? `?${qs.toString()}` : ""
    }`;

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
                stickerNumber: 101,
                type: "washer",
                available: false,
                timeRemaining: 15,
                lastUser: "123",
                roomId: "BARH-2F",
                roomLabel: "BARH 2F",
                locationId: "BARH",
                locationLabel: "BARH",
                lastUpdated: new Date().toISOString(),
                mode: "running",
            },
            {
                licensePlate: "d4",
                qrCodeId: null,
                stickerNumber: 204,
                type: "dryer",
                available: true,
                timeRemaining: 0,
                lastUser: null,
                roomId: "BARH-2F",
                roomLabel: "BARH 2F",
                locationId: "BARH",
                locationLabel: "BARH",
                lastUpdated: new Date(
                    Date.now() - 12 * 60_000
                ).toISOString(),
                mode: "idle",
            },
        ];
        return demo.map(toUiMachine);
    };

    try {
        const r = await fetch(url, init);

        if (!r.ok) {
            if (opts.strict) throw new Error(String(r.status));
            return fallback();
        }

        const data = (await r.json()) as MachineBackend[];
        return data.map(toUiMachine);
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError")
            throw err;

        if (opts.strict) {
            throw new Error("network");
        }
        return fallback();
    }
}
