"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { locationSchema } from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";

export async function createLocation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);

  const parsed = parseOrError(locationSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;

  await prisma.location.create({ data: parsed.data });
  revalidatePath("/locations");
  redirect("/locations");
}
