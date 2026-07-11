import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_TONE: Record<string, "amber" | "blue" | "green"> = {
  loading: "amber",
  departed: "blue",
  arrived: "green",
};

const STATUS_LABEL: Record<string, string> = {
  loading: "Yuklanmoqda",
  departed: "Yo'lda",
  arrived: "Yetib keldi",
};

export default async function TrucksPage() {
  await requireRole(["admin", "logistics"]);
  const trucks = await prisma.truck.findMany({
    orderBy: { createdAt: "desc" },
    include: { currentLocation: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Mashinalar</h1>
        <Link href="/trucks/new">
          <Button>+ Yangi mashina</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Kod</th>
                <th className="px-4 py-2">Davlat raqami</th>
                <th className="px-4 py-2">Joriy joylashuv</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trucks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Mashinalar yo&apos;q
                  </td>
                </tr>
              )}
              {trucks.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{t.code}</td>
                  <td className="px-4 py-2 text-slate-600">{t.plateNumber ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{t.currentLocation?.name ?? "-"}</td>
                  <td className="px-4 py-2">
                    <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/loading?truckId=${t.id}`} className="text-sm font-medium text-slate-700 hover:underline">
                      Yuklash
                    </Link>
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
