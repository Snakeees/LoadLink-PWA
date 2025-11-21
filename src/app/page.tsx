"use client";

import {useEffect, useRef, useState} from "react";
import {fetchMachines, type Machine} from "@/lib/api";
import MachineCard from "@/components/MachineCard";

type Mode = "live" | "backoff" | "offline";

export default function DashboardPage() {
    const [machines, setMachines] = useState<Machine[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>("live");
    const [nextRetryTs, setNextRetryTs] = useState<number | null>(null);

    const inflight = useRef<AbortController | null>(null);
    const pollInterval = useRef<number | null>(null);
    const backoffTimeout = useRef<number | null>(null);
    const failStreak = useRef<number>(0);
    const backoffMs = useRef<number>(0);

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
        pollInterval.current = window.setInterval(fetchOnce, 60_000);
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
            await fetchOnce();
        }, next);
    }

    async function fetchOnce() {
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

            const data = await fetchMachines(undefined, {
                strict: true,
                signal: ac.signal,
                init: {cache: "no-store", credentials: "include"},
            });

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
                setError("Failed to load machines.");
                return;
            }

            const codeLike = typeof e?.message === "string" && /^\d{3}$/.test(e.message) ? e.message : null;
            setError(codeLike ? `Failed to load machines (HTTP ${codeLike}).` : "Failed to load machines.");

            if (mode === "offline") return;

            if (failStreak.current >= 5 || mode === "backoff") {
                setMode("backoff");
                clearTimers();
                scheduleBackoff();
            }
        }
    }

    function retryNow() {
        void fetchOnce();
    }

    function resumeLive() {
        failStreak.current = 0;
        backoffMs.current = 0;
        setNextRetryTs(null);
        setMode("live");
        clearTimers();
        void fetchOnce();
        startPolling();
    }

    useEffect(() => {
        void fetchOnce();
        startPolling();

        const handleOnline = () => {
            setMode("live");
            setError(null);
            failStreak.current = 0;
            backoffMs.current = 0;
            setNextRetryTs(null);
            clearTimers();
            void fetchOnce();
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

    const retryIn =
        nextRetryTs != null
            ? Math.max(0, Math.ceil((nextRetryTs - Date.now()) / 1000))
            : null;

    const roomLabel =
        machines?.[0]?.roomLabel ?? machines?.[0]?.roomId ?? null;

    const washers = machines?.filter((m) => m.type === "washer").sort((a, b) => a.stickerNumber! - b.stickerNumber!) ?? [];
    const dryers = machines?.filter((m) => m.type === "dryer").sort((a, b) => a.stickerNumber! - b.stickerNumber!) ?? [];

    const washerAvailable = washers.filter(m => m.status === "idle").length;
    const dryerAvailable = dryers.filter(m => m.status === "idle").length;

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

                {roomLabel && (
                    <div
                        className="inline-flex items-center rounded-lg bg-zinc-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-100">
                        <span className="mr-2 text-zinc-400">Room</span>
                        <span>{roomLabel}</span>
                    </div>
                )}
            </header>

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

            {error && mode === "live" && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {!machines ? (
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
