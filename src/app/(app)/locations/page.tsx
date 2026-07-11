import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  warehouse: "Ombor",
  border_crossing: "Chegara",
  customs: "Bojxona",
};

export default async function LocationsPage() {
  await requireRole(["admin"]);
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Joylashuvlar</h1>
        <Link href="/locations/new">
          <Button>+ Yangi joylashuv</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nomi</th>
                <th className="px-4 py-2">Turi</th>
                <th className="px-4 py-2">Davlat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Joylashuvlar yo&apos;q
                  </td>
                </tr>
              )}
              {locations.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{l.name}</td>
                  <td className="px-4 py-2">
                    <Badge tone="blue">{TYPE_LABELS[l.type] ?? l.type}</Badge>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{l.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
