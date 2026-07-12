import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeliveryCartonScanner } from "./delivery-carton-scanner";

const STATUS_TONE: Record<string, "amber" | "green" | "red"> = {
  pending: "amber",
  confirmed: "green",
  discrepancy: "red",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  discrepancy: "Nomuvofiqlik",
};

export default async function DeliveryReconciliationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "logistics", "accounting"]);
  const { id } = await params;

  const recon = await prisma.deliveryReconciliation.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!recon) notFound();

  const deliveredCartons = await prisma.intakeCarton.findMany({
    where: { deliveryReconciliationId: id },
    orderBy: { deliveredAt: "desc" },
    include: { batch: true },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/delivery" className="text-sm font-medium text-slate-600 hover:underline">
        ← Ro&apos;yxatga qaytish
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {recon.client.code}
            <Badge tone={STATUS_TONE[recon.status]}>{STATUS_LABEL[recon.status]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600 sm:grid-cols-3">
            <dt className="text-slate-400">Sana</dt>
            <dd className="font-medium text-slate-900">{recon.reconDate.toLocaleDateString("uz-UZ")}</dd>
            <dt className="text-slate-400">Kutilgan joy</dt>
            <dd className="font-medium text-slate-900">{recon.expectedPackageCount}</dd>
            <dt className="text-slate-400">Tasdiqlangan joy</dt>
            <dd className="font-medium text-slate-900">{recon.confirmedPackageCount ?? "-"}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Karobkalarni skanerlash (qabul)</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryCartonScanner reconciliationId={recon.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skanerlangan karobkalar ({deliveredCartons.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Kod</th>
                <th className="px-4 py-2">Mahsulot</th>
                <th className="px-4 py-2">Karobka</th>
                <th className="px-4 py-2">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveredCartons.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Hali karobka skanerlanmagan
                  </td>
                </tr>
              )}
              {deliveredCartons.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {recon.client.code}
                    {c.batch.letterCode && <span className="text-slate-400"> · {c.batch.letterCode}</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{c.batch.productName ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {c.sequenceInBatch}/{c.batch.packageCount}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {c.deliveredAt?.toLocaleString("uz-UZ") ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
