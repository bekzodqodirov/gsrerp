import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "../client-form";
import { createClient } from "@/lib/actions/clients";
import { requireRole } from "@/lib/auth/guards";

export default async function NewClientPage() {
  await requireRole(["admin", "warehouse", "logistics"]);

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi mijoz qo&apos;shish</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm action={createClient} submitLabel="Saqlash" />
        </CardContent>
      </Card>
    </div>
  );
}
