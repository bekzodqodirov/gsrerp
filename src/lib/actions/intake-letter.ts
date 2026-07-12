"use server";

import { prisma } from "@/lib/db/prisma";
import { sequenceLetter } from "@/lib/qr";

// Assigns `count` consecutive letters (continuing the global sequence across every
// intake ever created) atomically, so two product lines submitted together in one
// receipt get adjacent letters, and the next receipt picks up right after them.
export async function assignNextLetters(count: number): Promise<string[]> {
  if (count <= 0) return [];
  return prisma.$transaction(async (tx) => {
    const counter = await tx.intakeLetterCounter.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    const start = counter.nextIndex;
    await tx.intakeLetterCounter.update({ where: { id: 1 }, data: { nextIndex: start + count } });
    return Array.from({ length: count }, (_, i) => sequenceLetter(start + i));
  });
}
