import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const COST_TYPE_LABEL: Record<string, string> = {
  forklift: "Avtopogruzchik",
  customs: "Bojxona",
  tax_refund: "Soliq qaytarish",
  other: "Boshqa",
};

export default async function CostsPage() {
  await requireRole(["admin", "accounting"]);

  const costs = await prisma.loadingCost.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { loadingEvent: { include: { truck: true } } },
  });

  const total = costs.reduce((sum, c) => sum + Number(c.amountCny), 0);
  const byType = costs.reduce<Record<string, number>>((acc, c) => {
    acc[c.costType] = (acc[c.costType] ?? 0) + Number(c.amountCny);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Xarajatlar</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-slate-900">{total.toFixed(2)} CNY</div>
            <div className="text-sm text-slate-500">Jami xarajat</div>
          </CardContent>
        </Card>
        {Object.entries(byType).map(([type, amount]) => (
          <Card key={type}>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-slate-900">{amount.toFixed(2)} CNY</div>
              <div className="text-sm text-slate-500">{COST_TYPE_LABEL[type] ?? type}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mashina</th>
                <th className="px-4 py-2">Turi</th>
                <th className="px-4 py-2">Summa</th>
                <th className="px-4 py-2">Izoh</th>
                <th className="px-4 py-2">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {costs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Xarajatlar yo&apos;q
                  </td>
                </tr>
              )}
              {costs.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{c.loadingEvent.truck.code}</td>
                  <td className="px-4 py-2">
                    <Badge tone="blue">{COST_TYPE_LABEL[c.costType] ?? c.costType}</Badge>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{Number(c.amountCny).toFixed(2)} CNY</td>
                  <td className="px-4 py-2 text-slate-600">{c.notes ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{c.createdAt.toLocaleDateString("uz-UZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
