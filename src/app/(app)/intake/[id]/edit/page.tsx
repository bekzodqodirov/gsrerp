import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditBatchForm } from "./edit-form";

export default async function EditIntakeBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["admin", "warehouse"]);
  const { id } = await params;

  const batch = await prisma.intakeBatch.findUnique({ where: { id }, include: { client: true } });
  if (!batch) notFound();

  if (session.user.role === "warehouse" && batch.currentLocationId !== session.user.locationId) {
    redirect("/intake");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link href={`/intake/${id}`} className="text-sm font-medium text-slate-600 hover:underline">
        ← Partiya sahifasiga qaytish
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>
            Kirimni tahrirlash — {batch.client.code}
            {batch.letterCode && <span className="ml-1 text-slate-400">· {batch.letterCode}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditBatchForm
            batchId={batch.id}
            defaultValues={{
              productName: batch.productName ?? "",
              packageCount: String(batch.packageCount),
              volumeCbm: batch.volumeCbm.toString(),
              totalWeightKg: batch.totalWeightKg.toString(),
              lengthM: batch.lengthM?.toString() ?? "",
              widthM: batch.widthM?.toString() ?? "",
              heightM: batch.heightM?.toString() ?? "",
              unitGrossWeightKg: batch.unitGrossWeightKg?.toString() ?? "",
              costNotes: batch.costNotes ?? "",
              packingType: batch.packingType,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
