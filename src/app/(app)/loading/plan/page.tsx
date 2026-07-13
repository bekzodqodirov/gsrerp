import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { removeLoadingPlanItem } from "@/lib/actions/loading";
import { PlanForm } from "./plan-form";

export default async function LoadingPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  await requireRole(["admin", "logistics"]);
  const { locationId } = await searchParams;

  const locations = await prisma.location.findMany({ where: { type: "warehouse" }, orderBy: { name: "asc" } });

  let events: Awaited<ReturnType<typeof loadEvents>> = [];
  let availableBatches: { id: string; label: string; remaining: number; alreadyPlanned: number }[] = [];

  async function loadEvents(loc: string) {
    return prisma.loadingEvent.findMany({
      where: { fromLocationId: loc, status: "loading" },
      orderBy: { createdAt: "desc" },
      include: {
        truck: true,
        toLocation: true,
        planItems: { include: { intakeBatch: { include: { client: true } } }, orderBy: { createdAt: "asc" } },
      },
    });
  }

  if (locationId) {
    events = await loadEvents(locationId);

    const batchesRaw = await prisma.intakeBatch.findMany({
      where: { currentLocationId: locationId, status: { in: ["in_stock", "partially_loaded"] } },
      include: { client: true, loadingLines: { include: { loadingEvent: { select: { fromLocationId: true } } } } },
    });
    const plannedTotals = await prisma.loadingPlanItem.groupBy({
      by: ["intakeBatchId"],
      where: { loadingEvent: { fromLocationId: locationId, status: "loading" } },
      _sum: { plannedCount: true },
    });
    const plannedByBatch = new Map(plannedTotals.map((p) => [p.intakeBatchId, p._sum.plannedCount ?? 0]));

    availableBatches = batchesRaw
      .map((b) => {
        const loaded = b.loadingLines
          .filter((l) => l.loadingEvent.fromLocationId === locationId)
          .reduce((sum, l) => sum + l.packageCountLoaded, 0);
        return {
          id: b.id,
          label: `${b.client.code}${b.letterCode ? `-${b.letterCode}` : ""} — ${b.productName ?? ""}`.trim(),
          remaining: b.packageCount - loaded,
          alreadyPlanned: plannedByBatch.get(b.id) ?? 0,
        };
      })
      .filter((b) => b.remaining > 0);
  }

  async function removeItem(id: string) {
    "use server";
    await removeLoadingPlanItem(id);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Yuklash rejasi</h1>
      <p className="text-sm text-slate-500">
        Skladni tanlang — u yerdagi qaysi yuklarni qaysi mashinaga yuklash kerakligini belgilang. Ombor xodimi
        skanerlash paytida shu rejani ko&apos;radi.
      </p>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <label className="mb-1 block text-sm font-medium text-slate-700">Sklad</label>
          <Select name="locationId" defaultValue={locationId ?? ""}>
            <option value="" disabled>
              — tanlang —
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
        <button type="submit" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          Ko&apos;rish
        </button>
      </form>

      {locationId && events.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-slate-500">
            Bu skladda hozir yuklanayotgan mashina yo&apos;q.{" "}
            <Link href="/loading/new" className="font-medium text-accent hover:underline">
              Yangi yuklash yarating
            </Link>{" "}
            avval.
          </CardContent>
        </Card>
      )}

      {events.map((e) => (
        <Card key={e.id}>
          <CardHeader>
            <CardTitle>
              {e.truck.code}
              {e.truck.plateNumber ? ` (${e.truck.plateNumber})` : ""} → {e.toLocation?.name ?? "?"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Mijoz</th>
                  <th className="px-3 py-2">Reja miqdori</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {e.planItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-slate-400">
                      Hali reja yo&apos;q
                    </td>
                  </tr>
                )}
                {e.planItems.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {p.intakeBatch.client.code}
                      {p.intakeBatch.letterCode ? ` · ${p.intakeBatch.letterCode}` : ""}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{p.plannedCount}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={removeItem.bind(null, p.id)}>
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          O&apos;chirish
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PlanForm loadingEventId={e.id} batches={availableBatches} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
