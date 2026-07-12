"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { clientSchema } from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";
import { advanceCounterIfUsed } from "@/lib/actions/gs-code";
import { logAudit } from "@/lib/audit/log";

export async function createClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "logistics", "sales"]);

  const parsed = parseOrError(clientSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;

  // Read raw, not via formDataToObject: an empty selection must clear the field (null),
  // not be silently dropped (formDataToObject filters out empty strings entirely).
  const salesManagerId = String(formData.get("salesManagerId") ?? "").trim() || null;

  const existing = await prisma.client.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return { error: "Bu kod allaqachon mavjud", fieldErrors: { code: "Bu kod allaqachon mavjud" } };
  }

  const client = await prisma.client.create({ data: { ...parsed.data, salesManagerId } });
  await advanceCounterIfUsed(parsed.data.code);
  await logAudit({
    userId: session.user.id,
    tableName: "clients",
    recordId: client.id,
    action: "create",
    diff: { code: client.code, name: client.name, phone: client.phone, salesManagerId },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "logistics", "sales"]);

  const parsed = parseOrError(clientSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;

  const salesManagerId = String(formData.get("salesManagerId") ?? "").trim() || null;

  const existing = await prisma.client.findFirst({ where: { code: parsed.data.code, NOT: { id } } });
  if (existing) {
    return { error: "Bu kod allaqachon mavjud", fieldErrors: { code: "Bu kod allaqachon mavjud" } };
  }

  await prisma.client.update({ where: { id }, data: { ...parsed.data, salesManagerId } });
  await logAudit({
    userId: session.user.id,
    tableName: "clients",
    recordId: id,
    action: "update",
    diff: { code: parsed.data.code, name: parsed.data.name, phone: parsed.data.phone, salesManagerId },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function toggleClientActive(id: string, isActive: boolean) {
  const session = await requireRole(["admin"]);
  await prisma.client.update({ where: { id }, data: { isActive } });
  await logAudit({
    userId: session.user.id,
    tableName: "clients",
    recordId: id,
    action: isActive ? "activate" : "deactivate",
  });
  revalidatePath("/clients");
}
