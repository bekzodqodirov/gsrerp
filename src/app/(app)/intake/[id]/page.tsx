import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { stageLabel, stageTone } from "@/lib/stage-label";
import { generateQrDataUrl, getAppOrigin } from "@/lib/qr";
import { formatSsccDisplay } from "@/lib/sscc";
import { ensureCartonsForBatch } from "@/lib/actions/cartons";

const ACTION_LABEL: Record<string, string> = {
  qr_scan: "Skanerlandi",
  carton_loaded: "Yuklandi",
  carton_delivered: "Yetkazildi",
};

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

  // Har bir jismoniy karobka o'zining unique (GS1 SSCC-uslubidagi) QR koduga ega —
  // shu sababli yorliq har bir karobka uchun alohida chop etiladi, umumiy partiya
  // kodi/harfi bilan birga.
  const cartonRows = await ensureCartonsForBatch(batch.id);
  const cartons = await Promise.all(
    cartonRows.map(async (carton) => ({
      ...carton,
      qrDataUrl: await generateQrDataUrl(`${origin}/scan/carton/${carton.sscc}`, 160),
    }))
  );

  const scans = await prisma.auditLog.findMany({
    where: {
      OR: [
        { tableName: "intake_batches", recordId: id },
        { tableName: "intake_cartons", recordId: { in: cartonRows.map((c) => c.id) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: true },
  });
  const cartonById = new Map(cartonRows.map((c) => [c.id, c]));

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

      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Badge tone={stageTone(batch.currentLocation, batch.inTransit)}>
          {stageLabel(batch.currentLocation, batch.inTransit)}
        </Badge>
        <span className="text-xs text-slate-400">Qadoq: {PACKING_LABEL[batch.packingType]}</span>
      </div>

      <p className="text-sm text-slate-500 no-print">
        Har bir jismoniy karobka uchun alohida, unique QR yorlig&apos;i — chop etib har biriga yopishtiring.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2">
        {cartons.map((carton) => (
          <div
            key={carton.id}
            className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md break-inside-avoid"
          >
            {/* SKLAD — eng ustuvor ma'lumot */}
            <div className="bg-accent px-4 py-2.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Sklad</div>
              <div className="truncate text-base font-bold text-white">{batch.currentLocation.name}</div>
            </div>

            <div className="flex flex-col items-center gap-2 px-5 py-4">
              {/* GS-KOD + HARFLI KOD — eng katta, markaziy urg'u */}
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black tracking-tight text-slate-900">{batch.client.code}</span>
                {batch.letterCode && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
                    {batch.letterCode}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-400">
                Karobka {carton.sequenceInBatch}/{batch.packageCount}
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={carton.qrDataUrl} alt={`QR ${carton.sequenceInBatch}`} className="h-32 w-32" />
              <p className="break-all font-mono text-[9px] text-slate-300">{formatSsccDisplay(carton.sscc)}</p>

              {/* Kichikroq ma'lumotlar */}
              <div className="w-full space-y-0.5 border-t border-dashed border-slate-200 pt-2 text-center text-xs text-slate-500">
                <div className="truncate font-medium text-slate-700">
                  {batch.productName ?? "Mahsulot nomi kiritilmagan"}
                </div>
                <div>Qabul sanasi: {batch.intakeDate.toLocaleDateString("uz-UZ")}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                <th className="px-4 py-2">Karobka</th>
                <th className="px-4 py-2">Amal</th>
                <th className="px-4 py-2">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scans.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Hali skanerlanmagan
                  </td>
                </tr>
              )}
              {scans.map((s) => {
                const diff = (s.diffJson as Record<string, unknown> | null) ?? {};
                const carton = s.tableName === "intake_cartons" ? cartonById.get(s.recordId) : undefined;
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500">
                      {s.createdAt.toLocaleString("uz-UZ")}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">{s.user?.name ?? "Noma'lum"}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {carton ? `${carton.sequenceInBatch}/${batch.packageCount}` : "butun partiya"}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{ACTION_LABEL[s.action] ?? s.action}</td>
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
