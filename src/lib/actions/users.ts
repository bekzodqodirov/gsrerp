"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { userSchema } from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";
import { logAudit } from "@/lib/audit/log";

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin"]);

  const parsed = parseOrError(userSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) {
    return { error: "Bu email allaqachon mavjud", fieldErrors: { email: "Bu email allaqachon mavjud" } };
  }

  const passwordHash = await bcrypt.hash(d.password, 10);
  const user = await prisma.user.create({
    data: {
      email: d.email,
      name: d.name,
      role: d.role,
      passwordHash,
      locationId: d.role === "warehouse" ? d.locationId : null,
    },
  });
  await logAudit({
    userId: session.user.id,
    tableName: "users",
    recordId: user.id,
    action: "create",
    diff: { email: user.email, name: user.name, role: user.role, locationId: user.locationId },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUserActive(id: string, isActive: boolean) {
  const session = await requireRole(["admin"]);
  await prisma.user.update({ where: { id }, data: { isActive } });
  await logAudit({
    userId: session.user.id,
    tableName: "users",
    recordId: id,
    action: isActive ? "activate" : "deactivate",
  });
  revalidatePath("/users");
}
