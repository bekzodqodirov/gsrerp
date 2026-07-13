import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { stageLabel, stageTone } from "@/lib/stage-label";

const PACKING_LABEL: Record<string, string> = {
  carton: "Karton",
  woven_bag: "Paket",
  pallet: "Pallet",
  other: "Boshqa",
};

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; locationId?: string }>;
}) {
  const session = await requireSession();
  const myLocationId = session.user.role === "warehouse" ? session.user.locationId : null;
  const { clientId, locationId } = await searchParams;
  const effectiveLocationId = myLocationId ?? locationId;

  const [batches, clients, locations] = await Promise.all([
    prisma.intakeBatch.findMany({
      where: {
        status: { in: ["in_stock", "partially_loaded"] },
        clientId: clientId || undefined,
        currentLocationId: effectiveLocationId || undefined,
      },
      orderBy: { intakeDate: "asc" },
      include: {
        client: true,
        currentLocation: true,
        loadingLines: { include: { loadingEvent: { select: { fromLocationId: true } } } },
      },
    }),
    prisma.client.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const rows = batches.map((b) => {
    const loaded = b.loadingLines
      .filter((l) => l.loadingEvent.fromLocationId === b.currentLocationId)
      .reduce((sum, l) => sum + l.packageCountLoaded, 0);
    return { ...b, remaining: b.packageCount - loaded };
  });

  const totalVolume = rows.reduce((sum, r) => sum + (Number(r.volumeCbm) * r.remaining) / r.packageCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">
          Ombor qoldig&apos;i{myLocationId && <span className="text-slate-400"> — mening omborim</span>}
        </h1>
        <div className="text-sm text-slate-500">Jami hajm: {totalVolume.toFixed(2)} m³</div>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <Select name="clientId" defaultValue={clientId ?? ""} className="w-48">
          <option value="">Barcha mijozlar</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </Select>
        {!myLocationId && (
          <Select name="locationId" defaultValue={locationId ?? ""} className="w-48">
            <option value="">Barcha joylashuvlar</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        )}
        <button type="submit" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          Filtrlash
        </button>
      </form>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mijoz</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2">Kirim sanasi</th>
                <th className="px-4 py-2">Mahsulot</th>
                <th className="px-4 py-2">Qadoq</th>
                <th className="px-4 py-2">Jami joy</th>
                <th className="px-4 py-2">Qolgan joy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    Omborda qoldiq yo&apos;q
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{r.client.code}</td>
                  <td className="px-4 py-2">
                    <Badge tone={stageTone(r.currentLocation, r.inTransit)}>
                      {stageLabel(r.currentLocation, r.inTransit)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{r.intakeDate.toLocaleDateString("uz-UZ")}</td>
                  <td className="px-4 py-2 text-slate-600">{r.productName ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{PACKING_LABEL[r.packingType]}</td>
                  <td className="px-4 py-2 text-slate-600">{r.packageCount}</td>
                  <td className="px-4 py-2 font-semibold text-slate-900">{r.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
