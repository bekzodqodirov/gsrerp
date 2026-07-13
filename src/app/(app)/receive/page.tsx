import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";

export default async function ReceiveListPage() {
  const session = await requireRole(["admin", "logistics", "warehouse"]);
  const myLocationId = session.user.role === "warehouse" ? session.user.locationId : null;

  const events = await prisma.loadingEvent.findMany({
    where: { status: "departed", toLocationId: myLocationId ?? undefined },
    orderBy: { createdAt: "desc" },
    include: { truck: true, fromLocation: true, toLocation: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">
        Qabul{myLocationId && <span className="text-slate-400"> — mening omborimga</span>}
      </h1>
      <p className="text-sm text-slate-500">
        Yo&apos;lda bo&apos;lgan, omboringizga kutilayotgan yuklar — karobkalarni skanerlab qabul qiling.
      </p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Mashina</th>
                <th className="px-4 py-2">Yo&apos;nalish</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Hozir kutilayotgan yuk yo&apos;q
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {e.truck.code}
                    {e.truck.plateNumber ? ` (${e.truck.plateNumber})` : ""}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {e.fromLocation.name} → {e.toLocation?.name ?? "?"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/receive/${e.id}`} className="text-sm font-medium text-accent hover:underline">
                      Skanerlash
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
