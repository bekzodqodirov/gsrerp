import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_TONE: Record<string, "amber" | "blue" | "green" | "slate"> = {
  loading: "amber",
  departed: "blue",
  arrived: "green",
  cleared: "slate",
};

const STATUS_LABEL: Record<string, string> = {
  loading: "Yuklanmoqda",
  departed: "Yo'lda",
  arrived: "Yetib keldi",
  cleared: "Yopildi",
};

export default async function LoadingListPage() {
  await requireRole(["admin", "logistics"]);

  const events = await prisma.loadingEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: { truck: true, fromLocation: true, toLocation: true },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Yuklash hodisalari</h1>
        <Link href="/loading/new">
          <Button>+ Yangi yuklash</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mashina</th>
                <th className="px-4 py-2">Sana</th>
                <th className="px-4 py-2">Qayerdan</th>
                <th className="px-4 py-2">Qayerga</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Yuklash hodisalari yo&apos;q
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{e.truck.code}</td>
                  <td className="px-4 py-2 text-slate-600">{e.loadedDate.toLocaleDateString("uz-UZ")}</td>
                  <td className="px-4 py-2 text-slate-600">{e.fromLocation.name}</td>
                  <td className="px-4 py-2 text-slate-600">{e.toLocation?.name ?? "-"}</td>
                  <td className="px-4 py-2">
                    <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/loading/${e.id}`} className="text-sm font-medium text-slate-700 hover:underline">
                      Ochish
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
