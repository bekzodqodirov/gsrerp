import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function ClientsPage() {
  const session = await requireSession();
  const canManage = ["admin", "warehouse", "logistics"].includes(session.user.role);

  const clients = await prisma.client.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Mijozlar</h1>
        {canManage && (
          <Link href="/clients/new">
            <Button>+ Yangi mijoz</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Kod</th>
                <th className="px-4 py-2">Nomi</th>
                <th className="px-4 py-2">Telefon</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Mijozlar yo&apos;q
                  </td>
                </tr>
              )}
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{c.code}</td>
                  <td className="px-4 py-2 text-slate-600">{c.name}</td>
                  <td className="px-4 py-2 text-slate-600">{c.phone ?? "-"}</td>
                  <td className="px-4 py-2">
                    <Badge tone={c.isActive ? "green" : "slate"}>
                      {c.isActive ? "Faol" : "Nofaol"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canManage && (
                      <Link href={`/clients/${c.id}`} className="text-sm font-medium text-slate-700 hover:underline">
                        Tahrirlash
                      </Link>
                    )}
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
