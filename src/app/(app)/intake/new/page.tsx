import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntakeForm } from "./intake-form";

export default async function NewIntakePage() {
  await requireRole(["admin", "warehouse"]);

  const [clients, locations] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.location.findMany({ where: { type: "warehouse" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Yangi kirim (ombor)</CardTitle>
        </CardHeader>
        <CardContent>
          <IntakeForm
            clients={clients.map((c) => ({ id: c.id, label: `${c.code} — ${c.name}` }))}
            locations={locations.map((l) => ({ id: l.id, label: l.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
