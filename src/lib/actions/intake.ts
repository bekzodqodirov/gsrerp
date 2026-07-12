"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { intakeBatchSchema } from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";

export async function createIntakeBatch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "warehouse"]);

  const parsed = parseOrError(intakeBatchSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  await prisma.intakeBatch.create({
    data: {
      clientId: d.clientId,
      locationId: d.locationId,
      intakeDate: new Date(d.intakeDate),
      productName: d.productName,
      packingType: d.packingType,
      lengthM: d.lengthM,
      widthM: d.widthM,
      heightM: d.heightM,
      packageCount: d.packageCount,
      unitQty: d.unitQty,
      volumeCbm: d.volumeCbm,
      totalWeightKg: d.totalWeightKg,
      costNotes: d.costNotes,
      createdById: session.user.id,
    },
  });

  revalidatePath("/intake");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  redirect("/intake");
}
