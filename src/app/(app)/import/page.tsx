import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  await requireRole(["admin", "warehouse"]);
  const locations = await prisma.location.findMany({ where: { type: "warehouse" }, orderBy: { name: "asc" } });

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Excel import (tarixiy kirim ma&apos;lumotlari)</h1>
      <p className="text-sm text-slate-500">
        Mavjud 装车清单/库存清单 Excel fayllaringizni yuklang. Tizim 长/宽/高/件数/品名/数量/包装/入库日期/费用明细 ustunlarini
        avtomatik aniqlaydi va mijoz kodlarini (货号/唛头) o&apos;zi yaratadi.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Fayl yuklash</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportClient locations={locations.map((l) => ({ id: l.id, label: l.name }))} />
        </CardContent>
      </Card>
    </div>
  );
}
