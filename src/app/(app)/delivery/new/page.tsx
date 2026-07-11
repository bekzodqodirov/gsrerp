import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryForm } from "./delivery-form";

export default async function NewDeliveryPage() {
  await requireRole(["admin", "logistics", "accounting"]);
  const clients = await prisma.client.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } });

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi yetkazib berish solishtiruvi</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryForm clients={clients.map((c) => ({ id: c.id, label: `${c.code} — ${c.name}` }))} />
        </CardContent>
      </Card>
    </div>
  );
}
