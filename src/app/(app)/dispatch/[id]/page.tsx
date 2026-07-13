import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateLoadingEventStatus } from "@/lib/actions/loading";
import { DispatchCartonScanner } from "./dispatch-carton-scanner";

export default async function DispatchEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["admin", "logistics", "warehouse"]);
  const { id } = await params;

  const event = await prisma.loadingEvent.findUnique({
    where: { id },
    include: {
      truck: true,
      fromLocation: true,
      toLocation: true,
      lineItems: { include: { intakeBatch: { include: { client: true } } } },
      planItems: { include: { intakeBatch: { include: { client: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!event) notFound();
  if (session.user.role === "warehouse" && event.fromLocationId !== session.user.locationId) {
    redirect("/dispatch");
  }

  const loadedByBatch = new Map<string, number>();
  for (const li of event.lineItems) {
    loadedByBatch.set(li.intakeBatchId, (loadedByBatch.get(li.intakeBatchId) ?? 0) + li.packageCountLoaded);
  }

  async function markDeparted() {
    "use server";
    await updateLoadingEventStatus(id, "departed");
    redirect("/dispatch");
  }

  return (
    <div className="max-w-xl space-y-4">
      <Link href="/dispatch" className="text-sm font-medium text-slate-600 hover:underline">
        ← Ro&apos;yxatga qaytish
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>
            {event.truck.code}
            {event.truck.plateNumber ? ` (${event.truck.plateNumber})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          {event.fromLocation.name} → {event.toLocation?.name ?? "?"} ·{" "}
          {event.loadedDate.toLocaleDateString("uz-UZ")}
        </CardContent>
      </Card>

      {event.planItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reja bo&apos;yicha yuklash kerak</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Mijoz</th>
                  <th className="px-4 py-2">Skanerlandi / Reja</th>
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
          <CardTitle>Karobkalarni skanerlash</CardTitle>
        </CardHeader>
        <CardContent>
          <DispatchCartonScanner loadingEventId={event.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yuklangan partiyalar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mijoz</th>
                <th className="px-4 py-2">Joy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {event.lineItems.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-slate-400">
                    Hozircha yuklanmagan
                  </td>
                </tr>
              )}
              {event.lineItems.map((li) => (
                <tr key={li.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{li.intakeBatch.client.code}</td>
                  <td className="px-4 py-2 text-slate-600">{li.packageCountLoaded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <form action={markDeparted}>
        <Button type="submit" className="w-full py-3">
          Jo&apos;natildi — barchasi yuklandi
        </Button>
      </form>
    </div>
  );
}
