import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "../client-form";
import { createClient } from "@/lib/actions/clients";
import { getSuggestedClientCode } from "@/lib/actions/gs-code";
import { requireRole } from "@/lib/auth/guards";

export default async function NewClientPage() {
  await requireRole(["admin", "warehouse", "logistics"]);
  const suggestedCode = await getSuggestedClientCode();

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi mijoz qo&apos;shish</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm action={createClient} submitLabel="Saqlash" defaultValues={{ code: suggestedCode }} />
          <p className="mt-2 text-xs text-slate-500">
            Kod avtomatik taklif qilindi ({suggestedCode}) — maxsus kod kerak bo&apos;lsa
            (masalan GS777, GS5909) o&apos;zgartirib yozishingiz mumkin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
