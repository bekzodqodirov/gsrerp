import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;
  const [activeClients, stockAgg, trucksInTransit, recentIntakes] = await Promise.all([
    prisma.client.count({ where: { isActive: true } }),
    prisma.intakeBatch.aggregate({
      where: { status: { in: ["in_stock", "partially_loaded"] } },
      _sum: { packageCount: true, volumeCbm: true },
      _count: true,
    }),
    prisma.truck.count({ where: { status: "loading" } }).then(async (loading) => ({
      loading,
      departed: await prisma.truck.count({ where: { status: "departed" } }),
    })),
    prisma.intakeBatch.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: true, location: true },
    }),
  ]);

  const stats = [
    { label: "Faol mijozlar", value: activeClients.toString() },
    { label: "Omborda partiyalar", value: (stockAgg._count ?? 0).toString() },
    { label: "Omborda hajm (m³)", value: Number(stockAgg._sum.volumeCbm ?? 0).toFixed(2) },
    { label: "Yuklanmoqda / Yo'lda mashinalar", value: `${trucksInTransit.loading} / ${trucksInTransit.departed}` },
  ];

  return (
    <div className="space-y-6">
      {denied && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Sizda bu sahifaga kirish huquqi yo&apos;q.
        </div>
      )}
      <h1 className="text-xl font-semibold text-slate-900">Boshqaruv paneli</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>So&apos;nggi kirimlar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mijoz</th>
                <th className="px-4 py-2">Joylashuv</th>
                <th className="px-4 py-2">Sana</th>
                <th className="px-4 py-2">Joylar soni</th>
                <th className="px-4 py-2">Hajm (m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentIntakes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Hozircha kirim yozuvlari yo&apos;q
                  </td>
                </tr>
              )}
              {recentIntakes.map((batch) => (
                <tr key={batch.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{batch.client.code}</td>
                  <td className="px-4 py-2 text-slate-600">{batch.location.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {batch.intakeDate.toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{batch.packageCount}</td>
                  <td className="px-4 py-2 text-slate-600">{Number(batch.volumeCbm).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
