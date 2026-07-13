import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AllocateForm } from "./allocate-form";
import { CostForm } from "./cost-form";
import { LoadingCartonScanner } from "./loading-carton-scanner";
import { updateLoadingEventStatus, addTransitCheckpoint } from "@/lib/actions/loading";

const STATUS_TONE: Record<string, "amber" | "blue" | "green" | "slate"> = {
  loading: "amber",
  departed: "blue",
  arrived: "green",
  cleared: "slate",
};

const STATUS_LABEL: Record<string, string> = {
  loading: "Yuklanmoqda",
  departed: "Yo'lda",
  arrived: "Yetib keldi",
  cleared: "Yopildi",
};

const COST_TYPE_LABEL: Record<string, string> = {
  forklift: "Avtopogruzchik",
  customs: "Bojxona",
  tax_refund: "Soliq qaytarish",
  other: "Boshqa",
};

export default async function LoadingEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "logistics", "accounting"]);
  const { id } = await params;

  const event = await prisma.loadingEvent.findUnique({
    where: { id },
    include: {
      truck: true,
      fromLocation: true,
      toLocation: true,
      costs: { orderBy: { createdAt: "desc" }, include: { createdBy: true } },
      transitCheckpoints: { orderBy: { arrivedAt: "desc" }, include: { location: true } },
      lineItems: {
        orderBy: { createdAt: "desc" },
        include: { intakeBatch: { include: { client: true } }, createdBy: true },
      },
      planItems: { include: { intakeBatch: { include: { client: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!event) notFound();

  const loadedByBatch = new Map<string, number>();
  for (const li of event.lineItems) {
    loadedByBatch.set(li.intakeBatchId, (loadedByBatch.get(li.intakeBatchId) ?? 0) + li.packageCountLoaded);
  }

  const availableBatchesRaw = await prisma.intakeBatch.findMany({
    where: {
      currentLocationId: event.fromLocationId,
      status: { in: ["in_stock", "partially_loaded"] },
    },
    include: { client: true, loadingLines: { include: { loadingEvent: { select: { fromLocationId: true } } } } },
  });
  const availableBatches = availableBatchesRaw
    .map((b) => {
      const loaded = b.loadingLines
        .filter((l) => l.loadingEvent.fromLocationId === b.currentLocationId)
        .reduce((sum, l) => sum + l.packageCountLoaded, 0);
      return { id: b.id, label: `${b.client.code} — ${b.productName ?? ""}`.trim(), remaining: b.packageCount - loaded };
    })
    .filter((b) => b.remaining > 0);

  const allLocations = await prisma.location.findMany({ orderBy: { name: "asc" } });
  const totalCostCny = event.costs.reduce((sum, c) => sum + Number(c.amountCny), 0);

  async function setStatus(status: "loading" | "departed" | "arrived" | "cleared") {
    "use server";
    await updateLoadingEventStatus(id, status);
  }

  async function addCheckpoint(formData: FormData) {
    "use server";
    await addTransitCheckpoint(id, formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Yuklash — {event.truck.code}
            {event.truck.plateNumber ? ` (${event.truck.plateNumber})` : ""}
          </h1>
          <p className="text-sm text-slate-500">
            {event.fromLocation.name} → {event.toLocation?.name ?? "?"} · {event.loadedDate.toLocaleDateString("uz-UZ")}
          </p>
        </div>
        <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <form action={setStatus.bind(null, "loading")}>
          <Button type="submit" variant="secondary" disabled={event.status === "loading"}>
            Yuklanmoqda
          </Button>
        </form>
        <form action={setStatus.bind(null, "departed")}>
          <Button type="submit" variant="secondary" disabled={event.status === "departed"}>
            Jo&apos;natildi
          </Button>
        </form>
        <form action={setStatus.bind(null, "arrived")}>
          <Button type="submit" variant="secondary" disabled={event.status === "arrived"}>
            Yetib keldi
          </Button>
        </form>
        <form action={setStatus.bind(null, "cleared")}>
          <Button type="submit" variant="secondary" disabled={event.status === "cleared"}>
            Yopish
          </Button>
        </form>
      </div>

      {event.planItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Reja bo&apos;yicha yuklash kerak
              <Link href="/loading/plan" className="text-xs font-medium text-accent hover:underline">
                Rejani tahrirlash
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Mijoz</th>
                  <th className="px-4 py-2">Yuklandi / Reja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {event.planItems.map((p) => {
                  const loaded = loadedByBatch.get(p.intakeBatchId) ?? 0;
                  const done = loaded >= p.plannedCount;
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {p.intakeBatch.client.code}
                        {p.intakeBatch.letterCode ? ` · ${p.intakeBatch.letterCode}` : ""}
                      </td>
                      <td className={`px-4 py-2 font-medium ${done ? "text-emerald-600" : "text-amber-600"}`}>
                        {loaded} / {p.plannedCount} {done && "✓"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Karobkalarni skanerlash (tavsiya etiladi)</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingCartonScanner loadingEventId={event.id} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yuklangan partiyalar (ledger)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-64 overflow-y-auto rounded border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Mijoz</th>
                    <th className="px-3 py-2">Joy</th>
                    <th className="px-3 py-2">Izoh</th>
                    <th className="px-3 py-2">Kim/qachon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {event.lineItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                        Hozircha yuklanmagan
                      </td>
                    </tr>
                  )}
                  {event.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="px-3 py-2 font-medium text-slate-900">{li.intakeBatch.client.code}</td>
                      <td className={`px-3 py-2 ${li.packageCountLoaded < 0 ? "text-red-600" : "text-slate-600"}`}>
                        {li.packageCountLoaded > 0 ? "+" : ""}
                        {li.packageCountLoaded}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{li.note ?? "-"}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {li.createdBy.name} · {li.createdAt.toLocaleString("uz-UZ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs font-medium text-slate-500">Yoki qo&apos;lda kiriting (skaner ishlamasa):</p>
            <AllocateForm loadingEventId={event.id} batches={availableBatches} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Xarajatlar (jami: {totalCostCny.toFixed(2)} CNY)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y divide-slate-100 text-sm">
                {event.costs.length === 0 && <li className="py-2 text-slate-400">Xarajat yo&apos;q</li>}
                {event.costs.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <span className="text-slate-700">
                      {COST_TYPE_LABEL[c.costType]} {c.notes ? `— ${c.notes}` : ""}
                    </span>
                    <span className="font-medium text-slate-900">{Number(c.amountCny).toFixed(2)} CNY</span>
                  </li>
                ))}
              </ul>
              <CostForm loadingEventId={event.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yo&apos;l bosqichlari (checkpoint)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y divide-slate-100 text-sm">
                {event.transitCheckpoints.length === 0 && (
                  <li className="py-2 text-slate-400">Hozircha belgilanmagan</li>
                )}
                {event.transitCheckpoints.map((tc) => (
                  <li key={tc.id} className="py-2">
                    <span className="font-medium text-slate-900">{tc.location.name}</span>{" "}
                    <span className="text-xs text-slate-400">{tc.arrivedAt.toLocaleString("uz-UZ")}</span>
                    {tc.note && <p className="text-slate-600">{tc.note}</p>}
                  </li>
                ))}
              </ul>
              <form action={addCheckpoint} className="flex gap-2">
                <select name="locationId" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="">— joylashuv —</option>
                  {allLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="secondary">
                  Belgilash
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
