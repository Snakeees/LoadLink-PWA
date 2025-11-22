"use client";

import {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions} from "@headlessui/react";
import {ChevronDown} from "lucide-react";
import {fetchRooms, type Room} from "@/lib/api";

const ROOM_KEY = "loadlink:roomId";

export default function SettingsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");
    const [query, setQuery] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    // Load stored roomId from localStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(ROOM_KEY);
        if (stored) setSelectedRoomId(stored);
    }, []);

    // Fetch rooms on mount
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const list = await fetchRooms({strict: true});
                if (!cancelled) setRooms(list);
            } catch {
                if (!cancelled) setError("Failed to load rooms.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    const selectedRoom: Room | null = useMemo(
        () => rooms.find((r) => r.roomId === selectedRoomId) ?? null,
        [rooms, selectedRoomId]
    );

    const filteredRooms: Room[] = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rooms;
        return rooms.filter((r) =>
            r.label.toLowerCase().includes(q)
        );
    }, [rooms, query]);

    function handleSave() {
        if (!selectedRoom) {
            setStatus("Select a room first.");
            return;
        }

        if (typeof window !== "undefined") {
            window.localStorage.setItem(ROOM_KEY, selectedRoom.roomId);
        }

        setStatus(`Saved. Current room is now ${selectedRoom.label}.`);
    }

    return (
        <main className="mx-auto max-w-lg space-y-6 p-6">
            <header className="mb-2 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">
                        Settings
                    </h1>
                    <p className="text-sm text-gray-400">
                        Choose your default laundry room.
                    </p>
                </div>
                <Link
                    href="/"
                    className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                    Back to status
                </Link>
            </header>

            <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4 shadow-sm">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
                    Default room
                </label>

                {loading ? (
                    <p className="text-sm text-gray-400">Loading rooms…</p>
                ) : error ? (
                    <p className="text-sm text-red-400">{error}</p>
                ) : (
                    <Combobox
                        value={selectedRoom}
                        onChange={(room: Room | null) => {
                            setStatus(null);
                            setSelectedRoomId(room ? room.roomId : "");
                            setQuery(room ? room.label : "");
                        }}
                    >
                        <div className="relative">
                            <div
                                className="flex items-center rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-gray-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/60">
                                <ComboboxInput
                                    className="mr-2 w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
                                    displayValue={(room: Room | null) => (room ? room.label : "")}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setQuery(next);
                                        if (next === "") {
                                            setSelectedRoomId("");
                                        }
                                    }}
                                    placeholder="Select a room..."
                                />
                                <ComboboxButton className="p-1 text-gray-500 transition hover:text-gray-300">
                                    <ChevronDown size={16} strokeWidth={1.75}/>
                                </ComboboxButton>
                            </div>

                            <ComboboxOptions
                                className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-zinc-700 bg-zinc-950 text-sm shadow-lg">
                                {filteredRooms.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-gray-400">
                                        No rooms match “{query.trim()}”.
                                    </div>
                                ) : (
                                    filteredRooms.map((room) => {
                                        const label = room.label;
                                        return (
                                            <ComboboxOption
                                                key={room.roomId}
                                                value={room}
                                                className={({focus}) =>
                                                    `flex cursor-pointer items-center justify-between px-3 py-1.5 ${
                                                        focus
                                                            ? "bg-zinc-800 text-white"
                                                            : "text-gray-100"
                                                    }`
                                                }
                                            >
                                                {({selected}) => (
                                                    <>
                                                        <span className="truncate">
                                                            {label}
                                                        </span>
                                                        {selected && (
                                                            <span
                                                                className="ml-2 text-[0.65rem] uppercase text-blue-200">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </ComboboxOption>
                                        );
                                    })
                                )}
                            </ComboboxOptions>
                        </div>

                        <p className="mt-2 text-xs text-gray-400">
                            {selectedRoom
                                ? `Current: ${selectedRoom.label}`
                                : "No room selected."}
                        </p>
                    </Combobox>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                        disabled={loading || !!error || !rooms.length}
                    >
                        Save
                    </button>
                    {status && (
                        <p className="text-xs text-gray-400">{status}</p>
                    )}
                </div>
            </section>
        </main>
    );
}
