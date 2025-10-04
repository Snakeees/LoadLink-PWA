"use client";
import type { Machine } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

function remaining(endsAt?: string) {
    if (!endsAt) return "";
    const ms = new Date(endsAt).getTime() - Date.now();
    if (ms <= 0) return "finishing…";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
}

export default function MachineCard({ m }: { m: Machine }) {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (m.status !== "running") return;
        const id = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(id);
    }, [m.status]);

    const subtitle = useMemo(() => {
        if (m.status === "running") return `Time left: ${remaining(m.endsAt)}`;
        if (m.status === "idle") return `Idle: ${m.idleMinutes ?? 0} min`;
        if (m.status === "finished") return "Finished";
        return "Unknown status";
    }, [m.status, m.endsAt, m.idleMinutes, tick]);

    return (
        <div className="rounded-xl border p-4 shadow-sm">
            <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium">{m.type.toUpperCase()} • {m.id}</h3>
                <span className="text-xs uppercase tracking-wide text-gray-500">{m.status}</span>
            </div>
            <p className="mt-1 text-sm text-gray-700">{subtitle}</p>
            <p className="mt-2 text-xs text-gray-500">
                {m.user ? `Linked to: ${m.user.name ?? m.user.discordId}` : "Unlinked"}
            </p>
        </div>
    );
}
