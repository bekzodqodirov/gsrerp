import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { stageLabel, stageTone } from "@/lib/stage-label";
import { PhotoLightbox } from "@/components/photo-lightbox";

const PACKING_LABEL: Record<string, string> = {
  carton: "Karton",
  woven_bag: "Paket",
  pallet: "Pallet",
  other: "Boshqa",
};

export default async function IntakePage() {
  const session = await requireRole(["admin", "warehouse"]);
  const myLocationId = session.user.role === "warehouse" ? session.user.locationId : null;

  const batches = await prisma.intakeBatch.findMany({
    where: { currentLocationId: myLocationId ?? undefined },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      client: true,
      location: true,
      currentLocation: true,
      photos: { select: { id: true } },
      receipt: { select: { photos: { select: { id: true } } } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">
          Kirim (Ombor){myLocationId && <span className="text-slate-400"> — mening omborim</span>}
        </h1>
        <Link href="/intake/new">
          <Button>+ Yangi kirim</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mijoz</th>
                <th className="px-4 py-2">Kod</th>
                <th className="px-4 py-2">Joylashuv</th>
                <th className="px-4 py-2">Sana</th>
                <th className="px-4 py-2">Mahsulot</th>
                <th className="px-4 py-2">Qadoq</th>
                <th className="px-4 py-2">Joylar</th>
                <th className="px-4 py-2">Hajm (m³)</th>
                <th className="px-4 py-2">Og&apos;irlik (kg)</th>
                <th className="px-4 py-2">Mahsulot rasmi</th>
                <th className="px-4 py-2">Qabul rasmi</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-6 text-center text-slate-400">
                    Kirim yozuvlari yo&apos;q
                  </td>
                </tr>
              )}
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{b.client.code}</td>
                  <td className="px-4 py-2">
                    {b.letterCode && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                        {b.letterCode}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{b.location.name}</td>
                  <td className="px-4 py-2 text-slate-600">{b.intakeDate.toLocaleDateString("uz-UZ")}</td>
                  <td className="px-4 py-2 text-slate-600">{b.productName ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{PACKING_LABEL[b.packingType]}</td>
                  <td className="px-4 py-2 text-slate-600">{b.packageCount}</td>
                  <td className="px-4 py-2 text-slate-600">{Number(b.volumeCbm).toFixed(2)}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {b.totalWeightKg ? Number(b.totalWeightKg).toFixed(1) : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <PhotoLightbox photoIds={b.photos.map((p) => p.id)} />
                  </td>
                  <td className="px-4 py-2">
                    <PhotoLightbox photoIds={b.receipt?.photos.map((p) => p.id) ?? []} />
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={stageTone(b.currentLocation, b.inTransit)}>
                      {stageLabel(b.currentLocation, b.inTransit)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/intake/${b.id}/edit`} className="text-sm font-medium text-slate-600 hover:underline">
                        Tahrirlash
                      </Link>
                      <Link href={`/intake/${b.id}`} className="text-sm font-medium text-accent hover:underline">
                        QR
                      </Link>
                    </div>
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
