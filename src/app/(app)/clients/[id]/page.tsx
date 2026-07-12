import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientForm } from "../client-form";
import { updateClient, toggleClientActive } from "@/lib/actions/clients";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "warehouse", "logistics", "sales"]);
  const { id } = await params;

  const [client, salesManagers] = await Promise.all([
    prisma.client.findUnique({ where: { id } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!client) notFound();

  const updateWithId = updateClient.bind(null, id);
  const toggleActive = async () => {
    "use server";
    await toggleClientActive(id, !client.isActive);
  };

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mijozni tahrirlash — {client.code}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={updateWithId}
            defaultValues={{
              code: client.code,
              name: client.name,
              phone: client.phone ?? undefined,
              notes: client.notes ?? undefined,
              salesManagerId: client.salesManagerId ?? undefined,
            }}
            salesManagers={salesManagers.map((m) => ({ id: m.id, label: m.name }))}
            submitLabel="Yangilash"
          />
        </CardContent>
      </Card>

      <form action={toggleActive}>
        <Button variant={client.isActive ? "danger" : "secondary"} type="submit">
          {client.isActive ? "Nofaol qilish" : "Faollashtirish"}
        </Button>
      </form>
    </div>
  );
}
