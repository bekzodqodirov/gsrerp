import { prisma } from "@/lib/db/prisma";
import { Users, Boxes, Package, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guards";

const STAT_STYLES = [
  { icon: Users, chip: "bg-indigo-100 text-indigo-600" },
  { icon: Boxes, chip: "bg-emerald-100 text-emerald-600" },
  { icon: Package, chip: "bg-amber-100 text-amber-600" },
  { icon: Truck, chip: "bg-sky-100 text-sky-600" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;
  const session = await requireSession();
  const myLocationId = session.user.role === "warehouse" ? session.user.locationId : null;

  const [activeClients, stockAgg, trucksInTransit, recentIntakes] = await Promise.all([
    prisma.client.count({ where: { isActive: true } }),
    prisma.intakeBatch.aggregate({
      where: {
        status: { in: ["in_stock", "partially_loaded"] },
        currentLocationId: myLocationId ?? undefined,
      },
      _sum: { packageCount: true, volumeCbm: true },
      _count: true,
    }),
    prisma.truck.count({ where: { status: "loading" } }).then(async (loading) => ({
      loading,
      departed: await prisma.truck.count({ where: { status: "departed" } }),
    })),
    prisma.intakeBatch.findMany({
      where: { currentLocationId: myLocationId ?? undefined },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: true, location: true },
    }),
  ]);

  const stats = [
    { label: "Faol mijozlar", value: activeClients.toString() },
    { label: myLocationId ? "Ombordagi partiyalar (mening omborim)" : "Omborda partiyalar", value: (stockAgg._count ?? 0).toString() },
    { label: "Omborda hajm (m³)", value: Number(stockAgg._sum.volumeCbm ?? 0).toFixed(2) },
    { label: "Yuklanmoqda / Yo'lda", value: `${trucksInTransit.loading} / ${trucksInTransit.departed}` },
  ];

  return (
    <div className="space-y-6">
      {denied && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Sizda bu sahifaga kirish huquqi yo&apos;q.
        </div>
      )}
      <h1 className="text-xl font-semibold text-slate-900">Boshqaruv paneli</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => {
          const { icon: Icon, chip } = STAT_STYLES[i % STAT_STYLES.length];
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-2xl font-bold tracking-tight text-slate-900">{s.value}</div>
                  <div className="truncate text-sm text-slate-500">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{myLocationId ? "Mening omborimdagi so'nggi kirimlar" : "So'nggi kirimlar"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Mijoz</th>
                <th className="px-4 py-2.5">Joylashuv</th>
                <th className="px-4 py-2.5">Sana</th>
                <th className="px-4 py-2.5">Joylar soni</th>
                <th className="px-4 py-2.5">Hajm (m³)</th>
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
                  <td className="px-4 py-2.5 font-medium text-slate-900">{batch.client.code}</td>
                  <td className="px-4 py-2.5 text-slate-600">{batch.location.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {batch.intakeDate.toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{batch.packageCount}</td>
                  <td className="px-4 py-2.5 text-slate-600">{Number(batch.volumeCbm).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
