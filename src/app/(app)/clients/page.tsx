import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GsCodeSettingsForm } from "./gs-code-settings-form";

export default async function ClientsPage() {
  const session = await requireSession();
  const canManage = ["admin", "warehouse", "logistics"].includes(session.user.role);
  const isAdmin = session.user.role === "admin";

  const [clients, counter] = await Promise.all([
    prisma.client.findMany({ orderBy: { code: "asc" } }),
    canManage ? prisma.gsCodeCounter.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }) : null,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Mijozlar</h1>
        <div className="flex items-center gap-3">
          {counter && (
            <span className="text-sm text-slate-500">
              Keyingi kod: <span className="font-medium text-slate-700">{counter.prefix}{counter.nextValue}</span>
            </span>
          )}
          {canManage && (
            <Link href="/clients/new">
              <Button>+ Yangi mijoz</Button>
            </Link>
          )}
        </div>
      </div>

      {isAdmin && counter && (
        <Card>
          <CardHeader>
            <CardTitle>GS-kod ketma-ketligi</CardTitle>
          </CardHeader>
          <CardContent>
            <GsCodeSettingsForm prefix={counter.prefix} nextValue={counter.nextValue} />
            <p className="mt-2 text-xs text-slate-500">
              Yangi mijoz qo&apos;shishda shu raqam taklif qilinadi. Faqat taklif qilingan kod ishlatilganda
              avtomatik oshadi — maxsus kod yozilsa o&apos;zgarmaydi.
            </p>
          </CardContent>
        </Card>
      )}

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
