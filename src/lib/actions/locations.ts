"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { locationSchema } from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";
import { logAudit } from "@/lib/audit/log";

export async function createLocation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin"]);

  const parsed = parseOrError(locationSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;

  const location = await prisma.location.create({ data: parsed.data });
  await logAudit({
    userId: session.user.id,
    tableName: "locations",
    recordId: location.id,
    action: "create",
    diff: { name: location.name, type: location.type, country: location.country },
  });

  revalidatePath("/locations");
  redirect("/locations");
}
