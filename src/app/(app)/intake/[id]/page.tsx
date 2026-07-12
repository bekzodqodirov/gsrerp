import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { stageLabel, stageTone } from "@/lib/stage-label";
import { generateQrDataUrl, getAppOrigin } from "@/lib/qr";

const PACKING_LABEL: Record<string, string> = {
  carton: "Karton",
  woven_bag: "Paket",
  pallet: "Pallet",
  other: "Boshqa",
};

export default async function IntakeBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["admin", "warehouse", "logistics"]);
  const canEdit = session.user.role === "admin" || session.user.role === "warehouse";
  const { id } = await params;

  const batch = await prisma.intakeBatch.findUnique({
    where: { id },
    include: { client: true, location: true, currentLocation: true },
  });
  if (!batch) notFound();

  const origin = await getAppOrigin();
  const scanUrl = `${origin}/scan/${batch.id}`;
  const qrDataUrl = await generateQrDataUrl(scanUrl);

  const scans = await prisma.auditLog.findMany({
    where: { tableName: "intake_batches", recordId: id, action: "qr_scan" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: true },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link href="/intake" className="text-sm font-medium text-slate-600 hover:underline">
          ← Kirim ro&apos;yxatiga qaytish
        </Link>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/intake/${batch.id}/edit`}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tahrirlash
            </Link>
          )}
          <PrintButton />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Partiya yorlig&apos;i — {batch.client.code}
            {batch.letterCode && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                {batch.letterCode}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:items-start sm:gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR kod" className="h-52 w-52 shrink-0 rounded-lg border border-slate-200 p-2" />
          <div className="w-full space-y-2 text-sm">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              {batch.client.code}
              {batch.letterCode && <span className="text-lg text-accent">· {batch.letterCode}</span>}
            </div>
            <div className="text-slate-600">{batch.productName ?? "Mahsulot nomi kiritilmagan"}</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
              <dt className="text-slate-400">Karobka soni</dt>
              <dd className="font-medium text-slate-900">{batch.packageCount}</dd>
              <dt className="text-slate-400">Kub, m³</dt>
              <dd className="font-medium text-slate-900">{Number(batch.volumeCbm).toFixed(2)}</dd>
              <dt className="text-slate-400">Kilo, kg</dt>
              <dd className="font-medium text-slate-900">{Number(batch.totalWeightKg).toFixed(1)}</dd>
              <dt className="text-slate-400">Qadoq</dt>
              <dd className="font-medium text-slate-900">{PACKING_LABEL[batch.packingType]}</dd>
              <dt className="text-slate-400">Kirim sanasi</dt>
              <dd className="font-medium text-slate-900">{batch.intakeDate.toLocaleDateString("uz-UZ")}</dd>
            </dl>
            <div className="pt-2">
              <Badge tone={stageTone(batch.currentLocation, batch.inTransit)}>
                {stageLabel(batch.currentLocation, batch.inTransit)}
              </Badge>
            </div>
            <p className="pt-2 text-xs text-slate-400 no-print break-all">{scanUrl}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Skanerlash tarixi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Vaqt</th>
                <th className="px-4 py-2">Kim</th>
                <th className="px-4 py-2">Joylashuv</th>
                <th className="px-4 py-2">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scans.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Hali skanerlanmagan
                  </td>
                </tr>
              )}
              {scans.map((s) => {
                const diff = (s.diffJson as Record<string, unknown> | null) ?? {};
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500">
                      {s.createdAt.toLocaleString("uz-UZ")}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">{s.user?.name ?? "Noma'lum"}</td>
                    <td className="px-4 py-2 text-slate-600">{String(diff.locationName ?? "-")}</td>
                    <td className="px-4 py-2 text-slate-600">{diff.note ? String(diff.note) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
