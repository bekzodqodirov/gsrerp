"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { userSchema } from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);

  const parsed = parseOrError(userSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) {
    return { error: "Bu email allaqachon mavjud", fieldErrors: { email: "Bu email allaqachon mavjud" } };
  }

  const passwordHash = await bcrypt.hash(d.password, 10);
  await prisma.user.create({
    data: { email: d.email, name: d.name, role: d.role, passwordHash },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUserActive(id: string, isActive: boolean) {
  await requireRole(["admin"]);
  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/users");
}
