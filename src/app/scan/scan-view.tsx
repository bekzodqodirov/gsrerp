import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { stageLabel, stageTone } from "@/lib/stage-label";
import type { IntakeBatch, Client, Location, AuditLog, User } from "@/generated/prisma";

const PACKING_LABEL: Record<string, string> = {
  carton: "Karton",
  woven_bag: "Paket",
  pallet: "Pallet",
  other: "Boshqa",
};

type Batch = IntakeBatch & { client: Client; currentLocation: Location };
type Scan = AuditLog & { user: User | null };

export function ScanView({
  batch,
  boxLabel,
  userName,
  lastScans,
  confirmAction,
}: {
  batch: Batch;
  boxLabel?: string;
  userName: string;
  lastScans: Scan[];
  confirmAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-100 px-4 py-8 sm:items-center">
      <div className="w-full max-w-sm space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {batch.client.code}
              {boxLabel && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {boxLabel}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-slate-600">{batch.productName ?? "Mahsulot nomi kiritilmagan"}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600">
              {boxLabel && (
                <>
                  <dt className="text-slate-400">Karobka</dt>
                  <dd className="font-medium text-slate-900">
                    {boxLabel} / {batch.packageCount}
                  </dd>
                </>
              )}
              <dt className="text-slate-400">Jami karobka soni</dt>
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

            <form action={confirmAction} className="space-y-2 pt-2">
              <input
                name="note"
                placeholder="Izoh (ixtiyoriy)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <Button type="submit" className="w-full py-2.5">
                Skanerlashni tasdiqlash
              </Button>
            </form>
            <p className="text-center text-xs text-slate-400">{userName} sifatida tasdiqlaysiz</p>
          </CardContent>
        </Card>

        {lastScans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Oxirgi skanerlashlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lastScans.map((s) => {
                const diff = (s.diffJson as Record<string, unknown> | null) ?? {};
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-medium text-slate-700">
                      {s.user?.name ?? "Noma'lum"}
                      {typeof diff.box === "string" && (
                        <span className="ml-1.5 rounded bg-accent/10 px-1.5 py-0.5 text-xs font-bold text-accent">
                          {diff.box}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">{s.createdAt.toLocaleString("uz-UZ")}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
