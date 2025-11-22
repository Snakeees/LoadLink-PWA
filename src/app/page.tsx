"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {fetchMachines, fetchRoom, type Machine, type Room,} from "@/lib/api";
import MachineCard from "@/components/MachineCard";

type Mode = "live" | "backoff" | "offline";

const ROOM_KEY = "loadlink:roomId";

export default function DashboardPage() {
    const [machines, setMachines] = useState<Machine[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>("live");
    const [nextRetryTs, setNextRetryTs] = useState<number | null>(null);

    const [roomId, setRoomId] = useState<string | null>(null);
    const [room, setRoom] = useState<Room | null>(null);

    const inflight = useRef<AbortController | null>(null);
    const pollInterval = useRef<number | null>(null);
    const backoffTimeout = useRef<number | null>(null);
    const failStreak = useRef<number>(0);
    const backoffMs = useRef<number>(0);
    const roomIdRef = useRef<string | null>(null);

    function clearTimers() {
        if (pollInterval.current) {
            window.clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
        if (backoffTimeout.current) {
            window.clearTimeout(backoffTimeout.current);
            backoffTimeout.current = null;
        }
    }

    function startPolling() {
        clearTimers();
        pollInterval.current = window.setInterval(() => {
            void fetchOnce(roomIdRef.current);
        }, 60_000);
    }

    function scheduleBackoff() {
        const next =
            backoffMs.current === 0
                ? 30_000
                : Math.min(backoffMs.current * 2, 5 * 60_000);
        backoffMs.current = next;

        const ts = Date.now() + next;
        setNextRetryTs(ts);

        backoffTimeout.current = window.setTimeout(async () => {
            setNextRetryTs(null);
            await fetchOnce(roomIdRef.current);
        }, next);
    }

    async function fetchOnce(currentRoomId: string | null) {
        // If no room selected, don't hit /[[...slug]] at all.
        if (!currentRoomId) {
            setMachines([]);
            setError(null);
            return;
        }

        inflight.current?.abort();
        const ac = new AbortController();
        inflight.current = ac;

        try {
            if (
                typeof navigator !== "undefined" &&
                navigator &&
                !navigator.onLine
            ) {
                setMode("offline");
                setError("You appear to be offline.");
                clearTimers();
                return;
            }

            const data = await fetchMachines(
                {room: currentRoomId},
                {
                    strict: true,
                    signal: ac.signal,
                    init: {cache: "no-store", credentials: "include"},
                }
            );

            setMachines(data);
            setError(null);

            failStreak.current = 0;
            backoffMs.current = 0;
            setNextRetryTs(null);

            if (mode !== "live") {
                setMode("live");
                startPolling();
            }
        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") return;

            failStreak.current += 1;

            if (typeof e !== "object" || e === null || !("message" in e) || typeof e.message !== "string") {
                setError("Failed to load [[...slug]].");
                return;
            }

            const codeLike = typeof e?.message === "string" && /^\d{3}$/.test(e.message) ? e.message : null;
            setError(codeLike ? `Failed to load machines (HTTP ${codeLike}).` : "Failed to load [[...slug]].");

            if (mode === "offline") return;

            if (failStreak.current >= 5 || mode === "backoff") {
                setMode("backoff");
                clearTimers();
                scheduleBackoff();
            }
        }
    }

    function retryNow() {
        void fetchOnce(roomIdRef.current);
    }

    function resumeLive() {
        failStreak.current = 0;
        backoffMs.current = 0;
        setNextRetryTs(null);
        setMode("live");
        clearTimers();
        void fetchOnce(roomIdRef.current);
        startPolling();
    }

    // Initial load: read roomId from localStorage, wire online/offline handlers.
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = window.localStorage.getItem(ROOM_KEY);
            if (stored) {
                setRoomId(stored);
                roomIdRef.current = stored;
            }
        }

        const handleOnline = () => {
            setMode("live");
            setError(null);
            failStreak.current = 0;
            backoffMs.current = 0;
            setNextRetryTs(null);
            clearTimers();
            void fetchOnce(roomIdRef.current);
            startPolling();
        };
        const handleOffline = () => {
            setMode("offline");
            setError("You appear to be offline.");
            clearTimers();
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            inflight.current?.abort();
            clearTimers();
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // When roomId changes: fetch room meta + [[...slug]] and restart polling.
    useEffect(() => {
        roomIdRef.current = roomId;

        if (!roomId) {
            setRoom(null);
            setMachines([]);
            clearTimers();
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                const r = await fetchRoom(roomId, {strict: false});
                if (!cancelled) setRoom(r);
            } catch {
                if (!cancelled) setRoom(null);
            }
        };

        load();
        void fetchOnce(roomId);
        startPolling();

        return () => {
            cancelled = true;
        };
    }, [roomId]);

    const retryIn =
        nextRetryTs != null
            ? Math.max(0, Math.ceil((nextRetryTs - Date.now()) / 1000))
            : null;

    const washers =
        machines
            ?.filter((m) => m.type === "washer")
            .slice()
            .sort(
                (a, b) =>
                    (a.stickerNumber ?? 0) - (b.stickerNumber ?? 0)
            ) ?? [];

    const dryers =
        machines
            ?.filter((m) => m.type === "dryer")
            .slice()
            .sort(
                (a, b) =>
                    (a.stickerNumber ?? 0) - (b.stickerNumber ?? 0)
            ) ?? [];

    const washerAvailable = washers.filter(
        (m) => m.status === "idle"
    ).length;
    const dryerAvailable = dryers.filter(
        (m) => m.status === "idle"
    ).length;

    const roomLabel =
        room?.label ?? room?.roomId ?? (roomId ? roomId : "Not set");

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">
                        Machine Status
                    </h1>
                    <p className="text-sm text-gray-400">
                        Live view of washers and dryers
                    </p>
                </div>

                <Link
                    href="/settings"
                    className="inline-flex items-center rounded-lg bg-zinc-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-100 hover:bg-zinc-700/80"
                >
                    <span className="mr-2 text-zinc-400">Room</span>
                    <span
                        className={
                            roomId ? "text-zinc-100" : "text-amber-200"
                        }
                    >
                        {roomLabel}
                    </span>
                </Link>
            </header>

            {!roomId && (
                <p className="text-sm text-amber-300">
                    No default room selected. Click the Room tag above to
                    choose one.
                </p>
            )}

            {mode === "offline" && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                    <p className="mb-2">
                        Offline. Check your connection. I’ll auto-resume when
                        you’re back online.
                    </p>
                    <button
                        onClick={retryNow}
                        className="rounded-md border px-3 py-1 text-xs"
                    >
                        Retry now
                    </button>
                </div>
            )}

            {mode === "backoff" && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                    <p className="mb-2">
                        Can’t reach the server ({failStreak.current} consecutive
                        failures).
                        {retryIn !== null && ` Retrying in ~${retryIn}s.`}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={retryNow}
                            className="rounded-md border px-3 py-1 text-xs"
                        >
                            Retry now
                        </button>
                        <button
                            onClick={resumeLive}
                            className="rounded-md border px-3 py-1 text-xs"
                        >
                            Resume live updates
                        </button>
                    </div>
                </div>
            )}

            {error && mode === "live" && roomId && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {!roomId ? (
                <p className="text-sm text-gray-400">
                    Once you pick a room in Settings, its machines will show up
                    here.
                </p>
            ) : !machines ? (
                <p className="text-sm text-gray-600">Loading…</p>
            ) : (
                <section className="space-y-6">
                    {washers.length > 0 && (
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-gray-100">
                                    Washers
                                </h2>
                                <div className="flex gap-2 text-xs font-medium">
                                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                                        {washers.length} total
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 ${
                                            washerAvailable > 0
                                                ? "bg-emerald-900/60 text-emerald-300"
                                                : "bg-red-900/60 text-red-300"
                                        }`}
                                    >
                                        {washerAvailable} available
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {washers.map((m) => (
                                    <MachineCard key={m.id} m={m}/>
                                ))}
                            </div>
                        </div>
                    )}

                    {dryers.length > 0 && (
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-gray-100">
                                    Dryers
                                </h2>
                                <div className="flex gap-2 text-xs font-medium">
                                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                                        {dryers.length} total
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 ${
                                            dryerAvailable > 0
                                                ? "bg-emerald-900/60 text-emerald-300"
                                                : "bg-red-900/60 text-red-300"
                                        }`}
                                    >
                                        {dryerAvailable} available
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {dryers.map((m) => (
                                    <MachineCard key={m.id} m={m}/>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}
