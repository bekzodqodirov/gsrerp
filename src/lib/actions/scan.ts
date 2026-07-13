"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";

// A QR/RFID scan is just an event: "this user saw this batch, here, now." We log it
// as an audit entry rather than a bespoke table — this is deliberately the same shape
// an RFID reader would produce later, so that migration is additive, not a rewrite.
export async function confirmScan(batchId: string, formData: FormData): Promise<void> {
  const session = await requireSession();
  const note = String(formData.get("note") ?? "").trim() || undefined;

  const batch = await prisma.intakeBatch.findUniqueOrThrow({
    where: { id: batchId },
    include: { currentLocation: true, client: true },
  });

  await logAudit({
    userId: session.user.id,
    tableName: "intake_batches",
    recordId: batchId,
    action: "qr_scan",
    diff: {
      clientCode: batch.client.code,
      letterCode: batch.letterCode ?? undefined,
      locationName: batch.currentLocation.name,
      note,
    },
  });

  revalidatePath(`/scan/${batchId}`);
  revalidatePath(`/intake/${batchId}`);
}
