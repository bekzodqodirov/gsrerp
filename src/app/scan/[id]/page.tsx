import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { stageLabel, stageTone } from "@/lib/stage-label";
import { confirmScan } from "@/lib/actions/scan";

const PACKING_LABEL: Record<string, string> = {
  carton: "Karton",
  woven_bag: "Paket",
  pallet: "Pallet",
  other: "Boshqa",
};

export default async function ScanTargetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const batch = await prisma.intakeBatch.findUnique({
    where: { id },
    include: { client: true, currentLocation: true },
  });

  const lastScans = batch
    ? await prisma.auditLog.findMany({
        where: { tableName: "intake_batches", recordId: id, action: "qr_scan" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: true },
      })
    : [];

  if (!batch) notFound();

  const confirmWithBatch = confirmScan.bind(null, batch.id);

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-100 px-4 py-8 sm:items-center">
      <div className="w-full max-w-sm space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{batch.client.code}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-slate-600">{batch.productName ?? "Mahsulot nomi kiritilmagan"}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600">
              <dt className="text-slate-400">Karobka soni</dt>
              <dd className="font-medium text-slate-900">{batch.packageCount}</dd>
              <dt className="text-slate-400">Kub, m³</dt>
              <dd className="font-medium text-slate-900">{Number(batch.volumeCbm).toFixed(2)}</dd>
              <dt className="text-slate-400">Kilo, kg</dt>
              <dd className="font-medium text-slate-900">{Number(batch.totalWeightKg).toFixed(1)}</dd>
              <dt className="text-slate-400">Qadoq</dt>
              <dd className="font-medium text-slate-900">{PACKING_LABEL[batch.packingType]}</dd>
            </dl>
            <Badge tone={stageTone(batch.currentLocation, batch.inTransit)}>
              {stageLabel(batch.currentLocation, batch.inTransit)}
            </Badge>

            <form action={confirmWithBatch} className="space-y-2 pt-2">
              <input
                name="note"
                placeholder="Izoh (ixtiyoriy)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <Button type="submit" className="w-full py-2.5">
                Skanerlashni tasdiqlash
              </Button>
            </form>
            <p className="text-center text-xs text-slate-400">
              {session.user.name} sifatida tasdiqlaysiz
            </p>
          </CardContent>
        </Card>

        {lastScans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Oxirgi skanerlashlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lastScans.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-slate-700">{s.user?.name ?? "Noma'lum"}</span>
                  <span className="text-xs text-slate-400">{s.createdAt.toLocaleString("uz-UZ")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
