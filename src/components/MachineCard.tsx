"use client";

import type {Machine} from "@/lib/api";
import {useEffect, useState} from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function formatLastUpdated(lastUpdated?: string | null): string | null {
    if (!lastUpdated) return null;
    const d = new Date(lastUpdated);
    if (Number.isNaN(d.getTime())) return null;
    return dayjs(d).fromNow(); // "51 seconds ago"
}

export default function MachineCard({ m }: { m: Machine }) {
    // re-render periodically so the "… ago" label stays fresh
    const [, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 60_000);
        return () => clearInterval(id);
    }, []);

    const statusLabel =
        m.status === "running"
            ? "In use"
            : m.status === "idle"
                ? "Available"
                : "Unknown";

    const statusClasses =
        m.status === "running"
            ? "border-red-200 bg-red-50 text-red-800"
            : m.status === "idle"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-gray-200 bg-gray-50 text-gray-700";

    const lineParts: string[] = [statusLabel];

    const mins =
        typeof m.timeRemaining === "number" ? m.timeRemaining : null;

    if (m.status === "running" && mins !== null) {
        lineParts.push(`${mins} min remaining`);
    }

    const lastSeen = formatLastUpdated(m.lastUpdated);
    if (lastSeen) lineParts.push(`Updated ${lastSeen}`);

    const subtitle = lineParts.join(" | ");

    const displayId =
        m.stickerNumber !== undefined && m.stickerNumber !== null
            ? `#${m.stickerNumber}`
            : m.licensePlate ?? m.id;

    const typeLabel = m.type === "washer" ? "Washer" : "Dryer";

    const mode = (m.mode || "").toLowerCase();

    const userLabel = m.user
        ? m.user.name ?? m.user.discordId
        : "Unknown";

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900">
                    {typeLabel}
                    {displayId && (
                        <span className="text-gray-500">
                                {" "}
                            • {displayId}
                            </span>
                    )}
                </h3>
                <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${statusClasses}`}
                >
                    {statusLabel}
                </span>
            </div>
            <p className="text-xs text-gray-600">{subtitle}</p>

            {userLabel !== "Unknown" && (
                <p className="text-[0.7rem] text-gray-500">
                    Linked to: {userLabel}
                </p>
            )}


            {mode === "running" && m.status === "idle" && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[0.7rem] text-amber-900">
                    This machine likely still has clothes inside.
                </p>
            )}
            {mode === "unknown" && (
                <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[0.7rem] text-red-900">
                    Machine status unknown; it may be down or offline.
                </p>
            )}
        </div>
    );
}
