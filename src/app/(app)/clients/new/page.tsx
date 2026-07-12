import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "../client-form";
import { createClient } from "@/lib/actions/clients";
import { getSuggestedClientCode } from "@/lib/actions/gs-code";
import { requireRole } from "@/lib/auth/guards";

export default async function NewClientPage() {
  const session = await requireRole(["admin", "logistics", "sales"]);
  const [suggestedCode, salesManagers] = await Promise.all([
    getSuggestedClientCode(),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi mijoz qo&apos;shish</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={createClient}
            submitLabel="Saqlash"
            defaultValues={{ code: suggestedCode, salesManagerId: session.user.role === "sales" ? session.user.id : undefined }}
            salesManagers={salesManagers.map((m) => ({ id: m.id, label: m.name }))}
          />
          <p className="mt-2 text-xs text-slate-500">
            Kod avtomatik taklif qilindi ({suggestedCode}) — maxsus kod kerak bo&apos;lsa
            (masalan GS777, GS5909) o&apos;zgartirib yozishingiz mumkin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
