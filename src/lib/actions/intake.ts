"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { intakeBatchBulkSchema } from "@/lib/validation/schemas";
import { ActionState } from "@/lib/actions/action-state";
import { logAudit } from "@/lib/audit/log";

export async function createIntakeBatchesBulk(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "warehouse"]);

  let lines: unknown;
  try {
    lines = JSON.parse(String(formData.get("linesJson") ?? "[]"));
  } catch {
    return { error: "Qatorlar formati noto'g'ri" };
  }

  const parsed = intakeBatchBulkSchema.safeParse({
    clientId: formData.get("clientId"),
    locationId: formData.get("locationId"),
    intakeDate: formData.get("intakeDate"),
    packingType: formData.get("packingType"),
    lines,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Ma'lumotlarni tekshiring", fieldErrors };
  }

  const d = parsed.data;
  const client = await prisma.client.findUniqueOrThrow({ where: { id: d.clientId }, select: { code: true } });

  const created = await prisma.$transaction(
    d.lines.map((line) =>
      prisma.intakeBatch.create({
        data: {
          clientId: d.clientId,
          locationId: d.locationId,
          currentLocationId: d.locationId,
          intakeDate: new Date(d.intakeDate),
          productName: line.productName,
          packingType: d.packingType,
          lengthM: line.lengthM,
          widthM: line.widthM,
          heightM: line.heightM,
          unitGrossWeightKg: line.unitGrossWeightKg,
          packageCount: line.packageCount,
          unitQty: line.unitQty,
          volumeCbm: line.volumeCbm,
          totalWeightKg: line.totalWeightKg,
          costNotes: line.costNotes,
          createdById: session.user.id,
        },
      })
    )
  );

  for (const batch of created) {
    await logAudit({
      userId: session.user.id,
      tableName: "intake_batches",
      recordId: batch.id,
      action: "create",
      diff: {
        clientCode: client.code,
        productName: batch.productName,
        packageCount: batch.packageCount,
        volumeCbm: batch.volumeCbm.toString(),
        totalWeightKg: batch.totalWeightKg.toString(),
      },
    });
  }

  revalidatePath("/intake");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  redirect("/intake");
}
