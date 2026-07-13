import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateLoadingEventStatus } from "@/lib/actions/loading";
import { ReceiveCartonScanner } from "./receive-carton-scanner";

export default async function ReceiveEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["admin", "logistics", "warehouse"]);
  const { id } = await params;

  const event = await prisma.loadingEvent.findUnique({
    where: { id },
    include: { truck: true, fromLocation: true, toLocation: true },
  });
  if (!event) notFound();
  if (session.user.role === "warehouse" && event.toLocationId !== session.user.locationId) {
    redirect("/receive");
  }

  const cartons = await prisma.intakeCarton.findMany({
    where: { loadingLineItem: { loadingEventId: id } },
    include: { batch: { include: { client: true } } },
  });
  const cartonIds = cartons.map((c) => c.id);
  const receivedLogs = await prisma.auditLog.findMany({
    where: { tableName: "intake_cartons", action: "carton_received", recordId: { in: cartonIds } },
    distinct: ["recordId"],
    select: { recordId: true },
  });
  const receivedIds = new Set(receivedLogs.map((l) => l.recordId));

  async function markArrived() {
    "use server";
    await updateLoadingEventStatus(id, "arrived");
    redirect("/receive");
  }

  return (
    <div className="max-w-xl space-y-4">
      <Link href="/receive" className="text-sm font-medium text-slate-600 hover:underline">
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
          {event.fromLocation.name} → {event.toLocation?.name ?? "?"} · Qabul qilingan:{" "}
          {receivedIds.size} / {cartons.length}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Karobkalarni skanerlash (qabul)</CardTitle>
        </CardHeader>
        <CardContent>
          <ReceiveCartonScanner loadingEventId={event.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kutilayotgan karobkalar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mijoz</th>
                <th className="px-4 py-2">Karobka</th>
                <th className="px-4 py-2">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cartons.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-slate-400">
                    Karobka yo&apos;q
                  </td>
                </tr>
              )}
              {cartons.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {c.batch.client.code}
                    {c.batch.letterCode ? ` · ${c.batch.letterCode}` : ""}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {c.sequenceInBatch}/{c.batch.packageCount}
                  </td>
                  <td className="px-4 py-2">
                    {receivedIds.has(c.id) ? (
                      <span className="text-emerald-600">✓ qabul qilindi</span>
                    ) : (
                      <span className="text-slate-400">kutilmoqda</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <form action={markArrived}>
        <Button type="submit" className="w-full py-3">
          Qabul qilindi — barchasi yetib keldi
        </Button>
      </form>
    </div>
  );
}
