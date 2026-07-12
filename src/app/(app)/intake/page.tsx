import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { stageLabel, stageTone } from "@/lib/stage-label";

const PACKING_LABEL: Record<string, string> = {
  carton: "Karton",
  woven_bag: "Paket",
  pallet: "Pallet",
  other: "Boshqa",
};

function PhotoThumbs({ photoIds }: { photoIds: string[] }) {
  if (photoIds.length === 0) return <span className="text-slate-300">-</span>;
  const shown = photoIds.slice(0, 3);
  const extra = photoIds.length - shown.length;
  return (
    <div className="flex items-center gap-1">
      {shown.map((id) => (
        <a key={id} href={`/api/photos/${id}`} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/photos/${id}`} alt="" className="h-8 w-8 rounded object-cover ring-1 ring-slate-200" />
        </a>
      ))}
      {extra > 0 && <span className="text-xs text-slate-400">+{extra}</span>}
    </div>
  );
}

export default async function IntakePage() {
  await requireRole(["admin", "warehouse"]);

  const batches = await prisma.intakeBatch.findMany({
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Kirim (Ombor)</h1>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-slate-400">
                    Kirim yozuvlari yo&apos;q
                  </td>
                </tr>
              )}
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{b.client.code}</td>
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
                    <PhotoThumbs photoIds={b.photos.map((p) => p.id)} />
                  </td>
                  <td className="px-4 py-2">
                    <PhotoThumbs photoIds={b.receipt?.photos.map((p) => p.id) ?? []} />
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={stageTone(b.currentLocation, b.inTransit)}>
                      {stageLabel(b.currentLocation, b.inTransit)}
                    </Badge>
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
