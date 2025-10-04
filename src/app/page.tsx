import { fetchMachines } from "@/lib/api";
import MachineCard from "@/components/MachineCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const machines = await fetchMachines();

    return (
        <main className="mx-auto max-w-4xl p-6 space-y-4">
            <header className="mb-2">
                <h1 className="text-2xl font-semibold">Machine Status</h1>
                <p className="text-sm text-gray-600">Live view of washers and dryers</p>
            </header>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {machines.map(m => <MachineCard key={m.id} m={m} />)}
            </section>
        </main>
    );
}
