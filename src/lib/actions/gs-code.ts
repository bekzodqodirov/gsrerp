"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ActionState } from "@/lib/actions/action-state";
import { logAudit } from "@/lib/audit/log";

async function getOrCreateCounter() {
  return prisma.gsCodeCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

export async function getSuggestedClientCode(): Promise<string> {
  const counter = await getOrCreateCounter();
  return `${counter.prefix}${counter.nextValue}`;
}

// Called after a client is successfully created. Only advances the counter when the
// code used matches the currently suggested one — a manually typed special code
// (GS777, GS5909, USMON...) leaves the sequence untouched for next time.
export async function advanceCounterIfUsed(usedCode: string) {
  const counter = await getOrCreateCounter();
  const suggested = `${counter.prefix}${counter.nextValue}`;
  if (usedCode === suggested) {
    await prisma.gsCodeCounter.update({ where: { id: 1 }, data: { nextValue: counter.nextValue + 1 } });
  }
}

export async function setGsCodeCounter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin"]);

  const prefix = String(formData.get("prefix") ?? "").trim() || "GS";
  const nextValue = Number(formData.get("nextValue"));
  if (!Number.isInteger(nextValue) || nextValue < 1) {
    return { error: "Keyingi raqam musbat butun son bo'lishi kerak", fieldErrors: { nextValue: "Noto'g'ri qiymat" } };
  }

  await prisma.gsCodeCounter.upsert({
    where: { id: 1 },
    update: { prefix, nextValue },
    create: { id: 1, prefix, nextValue },
  });
  await logAudit({
    userId: session.user.id,
    tableName: "gs_code_counter",
    recordId: "1",
    action: "update",
    diff: { prefix, nextValue },
  });

  revalidatePath("/clients");
  revalidatePath("/clients/new");
  return {};
}
