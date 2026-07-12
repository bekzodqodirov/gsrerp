import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/nav";
import { toggleUserActive } from "@/lib/actions/users";
import type { Role } from "@/lib/auth/guards";

export default async function UsersPage() {
  await requireRole(["admin"]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Foydalanuvchilar</h1>
        <Link href="/users/new">
          <Button>+ Yangi foydalanuvchi</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Ism</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const toggleAction = toggleUserActive.bind(null, u.id, !u.isActive);
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-2 text-slate-600">{u.email}</td>
                    <td className="px-4 py-2 text-slate-600">{ROLE_LABELS[u.role as Role]}</td>
                    <td className="px-4 py-2">
                      <Badge tone={u.isActive ? "green" : "slate"}>{u.isActive ? "Faol" : "Nofaol"}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <form action={toggleAction}>
                        <button type="submit" className="text-sm font-medium text-slate-700 hover:underline">
                          {u.isActive ? "Nofaol qilish" : "Faollashtirish"}
                        </button>
                      </form>
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
