"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { truckSchema } from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";
import { logAudit } from "@/lib/audit/log";

export async function createTruck(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "logistics"]);

  const parsed = parseOrError(truckSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;

  const existing = await prisma.truck.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return { error: "Bu kod allaqachon mavjud", fieldErrors: { code: "Bu kod allaqachon mavjud" } };
  }

  const truck = await prisma.truck.create({
    data: {
      code: parsed.data.code,
      plateNumber: parsed.data.plateNumber,
      currentLocationId: parsed.data.currentLocationId || null,
    },
  });
  await logAudit({
    userId: session.user.id,
    tableName: "trucks",
    recordId: truck.id,
    action: "create",
    diff: { code: truck.code, plateNumber: truck.plateNumber },
  });

  revalidatePath("/trucks");
  redirect("/trucks");
}
