export type Machine = {
    id: string;
    type: "washer" | "dryer";
    status: "idle" | "running" | "finished" | "unknown";
    idleMinutes?: number;
    endsAt?: string;
    user?: { discordId: string; name?: string } | null;
};

const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function fetchMachines(): Promise<Machine[]> {
    try {
        const r = await fetch(`${base}/machines`, { next: { revalidate: 10 } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Machine[];
    } catch {
        // fallback so UI renders in dev
        return [
            { id: "w1", type: "washer", status: "running", endsAt: new Date(Date.now() + 15 * 60000).toISOString(), user: { discordId: "123", name: "demo" } },
            { id: "d4", type: "dryer", status: "idle", idleMinutes: 12, user: null }
        ];
    }
}
