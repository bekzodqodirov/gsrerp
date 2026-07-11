import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { confirmDeliveryReconciliation } from "@/lib/actions/delivery";

const STATUS_TONE: Record<string, "amber" | "green" | "red"> = {
  pending: "amber",
  confirmed: "green",
  discrepancy: "red",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  discrepancy: "Nomuvofiqlik",
};

export default async function DeliveryPage() {
  await requireRole(["admin", "logistics", "accounting"]);

  const recons = await prisma.deliveryReconciliation.findMany({
    orderBy: { reconDate: "desc" },
    include: { client: true },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Yetkazib berish solishtiruvi (Места)</h1>
        <Link href="/delivery/new">
          <Button>+ Yangi yozuv</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mijoz</th>
                <th className="px-4 py-2">Sana</th>
                <th className="px-4 py-2">Kutilgan joy</th>
                <th className="px-4 py-2">Tasdiqlangan joy</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2">Tasdiqlash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Yozuvlar yo&apos;q
                  </td>
                </tr>
              )}
              {recons.map((r) => {
                const confirmAction = confirmDeliveryReconciliation.bind(null, r.id);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">{r.client.code}</td>
                    <td className="px-4 py-2 text-slate-600">{r.reconDate.toLocaleDateString("uz-UZ")}</td>
                    <td className="px-4 py-2 text-slate-600">{r.expectedPackageCount}</td>
                    <td className="px-4 py-2 text-slate-600">{r.confirmedPackageCount ?? "-"}</td>
                    <td className="px-4 py-2">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      {r.status === "pending" && (
                        <form action={confirmAction} className="flex gap-2">
                          <input
                            type="number"
                            name="confirmedPackageCount"
                            required
                            className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                            placeholder={String(r.expectedPackageCount)}
                          />
                          <Button type="submit" variant="secondary" className="px-2 py-1 text-xs">
                            Tasdiqlash
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
