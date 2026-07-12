import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSsccDisplay } from "@/lib/sscc";
import { confirmCartonScan } from "@/lib/actions/cartons";

const STATUS_LABEL: Record<string, string> = {
  in_stock: "Omborda",
  loaded: "Yuklangan / yo'lda",
  delivered: "Yetkazilgan",
};

const STATUS_TONE: Record<string, "amber" | "blue" | "green" | "slate"> = {
  in_stock: "green",
  loaded: "blue",
  delivered: "slate",
};

export default async function ScanCartonPage({ params }: { params: Promise<{ sscc: string }> }) {
  const session = await requireSession();
  const { sscc } = await params;

  const carton = await prisma.intakeCarton.findUnique({
    where: { sscc },
    include: { batch: { include: { client: true } } },
  });
  if (!carton) notFound();

  const lastScans = await prisma.auditLog.findMany({
    where: { tableName: "intake_cartons", recordId: carton.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: true },
  });

  const confirmWithCarton = confirmCartonScan.bind(null, carton.id);

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-100 px-4 py-8 sm:items-center">
      <div className="w-full max-w-sm space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {carton.batch.client.code}
              {carton.batch.letterCode && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {carton.batch.letterCode}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-slate-600">{carton.batch.productName ?? "Mahsulot nomi kiritilmagan"}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600">
              <dt className="text-slate-400">Karobka</dt>
              <dd className="font-medium text-slate-900">
                {carton.sequenceInBatch} / {carton.batch.packageCount}
              </dd>
            </dl>
            <Badge tone={STATUS_TONE[carton.status]}>{STATUS_LABEL[carton.status]}</Badge>
            <p className="break-all font-mono text-[11px] text-slate-400">{formatSsccDisplay(carton.sscc)}</p>

            <form action={confirmWithCarton} className="space-y-2 pt-2">
              <input
                name="note"
                placeholder="Izoh (ixtiyoriy)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <Button type="submit" className="w-full py-2.5">
                Skanerlashni tasdiqlash
              </Button>
            </form>
            <p className="text-center text-xs text-slate-400">{session.user.name} sifatida tasdiqlaysiz</p>
          </CardContent>
        </Card>

        {lastScans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Oxirgi skanerlashlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lastScans.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                >
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
