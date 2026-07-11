import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";

export default async function ReportsPage() {
  await requireRole(["admin", "accounting"]);

  const clients = await prisma.client.findMany({
    orderBy: { code: "asc" },
    include: {
      intakeBatches: { include: { loadingLines: true } },
      deliveryReconciliations: true,
    },
  });

  const ledger = clients.map((c) => {
    const intake = c.intakeBatches.reduce((sum, b) => sum + b.packageCount, 0);
    const loaded = c.intakeBatches.reduce(
      (sum, b) => sum + b.loadingLines.reduce((s, l) => s + l.packageCountLoaded, 0),
      0
    );
    const delivered = c.deliveryReconciliations
      .filter((r) => r.status === "confirmed")
      .reduce((sum, r) => sum + (r.confirmedPackageCount ?? 0), 0);
    return {
      code: c.code,
      name: c.name,
      intake,
      loaded,
      remaining: intake - loaded,
      delivered,
    };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Mijoz bo&apos;yicha hisobot</h1>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mijoz</th>
                <th className="px-4 py-2">Kirim (jami joy)</th>
                <th className="px-4 py-2">Yuklangan</th>
                <th className="px-4 py-2">Omborda qolgan</th>
                <th className="px-4 py-2">Yetkazilgan (tasdiqlangan)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Ma&apos;lumot yo&apos;q
                  </td>
                </tr>
              )}
              {ledger.map((row) => (
                <tr key={row.code}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {row.code} <span className="text-slate-400">— {row.name}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{row.intake}</td>
                  <td className="px-4 py-2 text-slate-600">{row.loaded}</td>
                  <td className="px-4 py-2 font-semibold text-slate-900">{row.remaining}</td>
                  <td className="px-4 py-2 text-slate-600">{row.delivered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
