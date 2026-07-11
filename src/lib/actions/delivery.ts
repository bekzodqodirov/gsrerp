"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { deliveryReconciliationSchema } from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";

export async function createDeliveryReconciliation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin", "logistics", "accounting"]);

  const parsed = parseOrError(deliveryReconciliationSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const status =
    d.confirmedPackageCount === undefined
      ? "pending"
      : d.confirmedPackageCount === d.expectedPackageCount
      ? "confirmed"
      : "discrepancy";

  await prisma.deliveryReconciliation.create({
    data: {
      clientId: d.clientId,
      reconDate: new Date(d.reconDate),
      expectedPackageCount: d.expectedPackageCount,
      confirmedPackageCount: d.confirmedPackageCount,
      discrepancyNotes: d.discrepancyNotes,
      status,
    },
  });

  revalidatePath("/delivery");
  redirect("/delivery");
}

export async function confirmDeliveryReconciliation(id: string, formData: FormData) {
  await requireRole(["admin", "logistics", "accounting"]);

  const confirmedRaw = formData.get("confirmedPackageCount");
  const confirmedPackageCount = confirmedRaw ? Number(confirmedRaw) : undefined;
  if (confirmedPackageCount === undefined || Number.isNaN(confirmedPackageCount)) return;

  const recon = await prisma.deliveryReconciliation.findUniqueOrThrow({ where: { id } });
  const status = confirmedPackageCount === recon.expectedPackageCount ? "confirmed" : "discrepancy";

  await prisma.deliveryReconciliation.update({
    where: { id },
    data: { confirmedPackageCount, status },
  });

  revalidatePath("/delivery");
}
