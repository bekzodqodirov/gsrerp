"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireRole, requireSession } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { generateSscc, extractScanCode } from "@/lib/sscc";
import { recomputeBatchStatus } from "@/lib/actions/loading";
import type { IntakeCarton } from "@/generated/prisma";

// Global, never-reused serial sequence backing every carton's SSCC — same pattern as
// the client GS-code and intake-letter counters elsewhere in this app.
async function assignNextSerials(count: number): Promise<number[]> {
  if (count <= 0) return [];
  return prisma.$transaction(async (tx) => {
    const counter = await tx.cartonSerialCounter.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    const start = counter.nextValue;
    await tx.cartonSerialCounter.update({ where: { id: 1 }, data: { nextValue: start + count } });
    return Array.from({ length: count }, (_, i) => start + i);
  });
}

export async function createCartonsForBatch(batchId: string, packageCount: number): Promise<void> {
  if (packageCount <= 0) return;
  const serials = await assignNextSerials(packageCount);
  await prisma.intakeCarton.createMany({
    data: serials.map((serial, i) => ({
      batchId,
      sscc: generateSscc(serial),
      sequenceInBatch: i + 1,
    })),
  });
}

// Lazily backfills cartons for batches created before per-carton tracking existed (e.g.
// on a machine that hasn't run this feature's migration path from creation time) — so
// printing labels or scanning always has real cartons to work with, no manual step needed.
export async function ensureCartonsForBatch(batchId: string): Promise<IntakeCarton[]> {
  const existing = await prisma.intakeCarton.findMany({
    where: { batchId },
    orderBy: { sequenceInBatch: "asc" },
  });
  if (existing.length > 0) return existing;

  const batch = await prisma.intakeBatch.findUniqueOrThrow({ where: { id: batchId } });
  await createCartonsForBatch(batchId, batch.packageCount);
  return prisma.intakeCarton.findMany({ where: { batchId }, orderBy: { sequenceInBatch: "asc" } });
}

type ScanResult = { ok: boolean; message: string };

// Scanning a carton while loading a truck: auto-finds (or creates) the LoadingLineItem
// for that carton's batch within this event and bumps its count by one — staff never
// have to pre-select a batch, they just scan boxes as they physically load them.
export async function scanCartonForLoading(loadingEventId: string, rawCode: string): Promise<ScanResult> {
  const session = await requireRole(["admin", "logistics", "warehouse"]);
  const sscc = extractScanCode(rawCode);

  const event = await prisma.loadingEvent.findUnique({ where: { id: loadingEventId }, include: { fromLocation: true } });
  if (!event) return { ok: false, message: "Yuklash hodisasi topilmadi" };
  if (session.user.role === "warehouse" && event.fromLocationId !== session.user.locationId) {
    return { ok: false, message: "Bu yuklash sizning omboringizdan emas" };
  }

  const carton = await prisma.intakeCarton.findUnique({
    where: { sscc },
    include: { batch: { include: { client: true } } },
  });
  if (!carton) return { ok: false, message: "Karobka topilmadi" };
  if (carton.status === "delivered") return { ok: false, message: "Bu karobka allaqachon yetkazilgan" };
  if (carton.status === "loaded") return { ok: false, message: "Bu karobka allaqachon yuklangan" };
  if (carton.batch.currentLocationId !== event.fromLocationId) {
    return { ok: false, message: `Bu karobka "${event.fromLocation.name}" da emas` };
  }

  let lineItem = await prisma.loadingLineItem.findFirst({
    where: { loadingEventId, intakeBatchId: carton.batchId },
  });
  if (lineItem) {
    lineItem = await prisma.loadingLineItem.update({
      where: { id: lineItem.id },
      data: { packageCountLoaded: lineItem.packageCountLoaded + 1 },
    });
  } else {
    lineItem = await prisma.loadingLineItem.create({
      data: {
        loadingEventId,
        intakeBatchId: carton.batchId,
        packageCountLoaded: 1,
        note: "QR skanerlash orqali",
        createdById: session.user.id,
      },
    });
  }

  await prisma.intakeCarton.update({
    where: { id: carton.id },
    data: { status: "loaded", loadingLineItemId: lineItem.id, loadedAt: new Date() },
  });
  await recomputeBatchStatus(carton.batchId);

  const label = `${carton.batch.client.code}${carton.batch.letterCode ? `-${carton.batch.letterCode}` : ""} (${carton.sequenceInBatch}/${carton.batch.packageCount})`;
  await logAudit({
    userId: session.user.id,
    tableName: "intake_cartons",
    recordId: carton.id,
    action: "carton_loaded",
    diff: { sscc, clientCode: carton.batch.client.code, letterCode: carton.batch.letterCode, loadingEventId },
  });

  revalidatePath(`/loading/${loadingEventId}`);
  revalidatePath("/stock");
  revalidatePath("/intake");
  return { ok: true, message: `✓ ${label} yuklandi` };
}

// Scanning a carton off the truck at an intermediate/destination warehouse, confirming it
// physically arrived on THIS leg. This is a per-carton audit trail only — the actual state
// flip (carton back to "in_stock", batch location update) still happens in bulk when the
// receiving worker closes out the leg via updateLoadingEventStatus(id, "arrived"), so a
// partial scan session here can't leave data in an inconsistent half-arrived state.
export async function scanCartonForReceiving(loadingEventId: string, rawCode: string): Promise<ScanResult> {
  const session = await requireRole(["admin", "logistics", "warehouse"]);
  const sscc = extractScanCode(rawCode);

  const event = await prisma.loadingEvent.findUnique({ where: { id: loadingEventId }, include: { toLocation: true } });
  if (!event) return { ok: false, message: "Yuklash hodisasi topilmadi" };
  if (session.user.role === "warehouse" && event.toLocationId !== session.user.locationId) {
    return { ok: false, message: "Bu yuk sizning omboringizga kelmayapti" };
  }

  const carton = await prisma.intakeCarton.findUnique({
    where: { sscc },
    include: { batch: { include: { client: true } }, loadingLineItem: true },
  });
  if (!carton) return { ok: false, message: "Karobka topilmadi" };
  if (carton.loadingLineItem?.loadingEventId !== loadingEventId) {
    return { ok: false, message: "Bu karobka shu yuklash bilan bog'liq emas" };
  }

  const label = `${carton.batch.client.code}${carton.batch.letterCode ? `-${carton.batch.letterCode}` : ""} (${carton.sequenceInBatch}/${carton.batch.packageCount})`;
  await logAudit({
    userId: session.user.id,
    tableName: "intake_cartons",
    recordId: carton.id,
    action: "carton_received",
    diff: { sscc, clientCode: carton.batch.client.code, letterCode: carton.batch.letterCode, loadingEventId },
  });

  revalidatePath(`/receive/${loadingEventId}`);
  return { ok: true, message: `✓ ${label} qabul qilindi` };
}

// Scanning a carton at the receiving end for a specific delivery reconciliation record —
// only cartons that have actually shipped at least once (loadedAt set) can be confirmed
// delivered; a carton still sitting untouched at the origin warehouse is rejected.
export async function scanCartonForDelivery(reconciliationId: string, rawCode: string): Promise<ScanResult> {
  const session = await requireRole(["admin", "logistics", "accounting"]);
  const sscc = extractScanCode(rawCode);

  const recon = await prisma.deliveryReconciliation.findUnique({ where: { id: reconciliationId } });
  if (!recon) return { ok: false, message: "Yozuv topilmadi" };

  const carton = await prisma.intakeCarton.findUnique({
    where: { sscc },
    include: { batch: { include: { client: true } } },
  });
  if (!carton) return { ok: false, message: "Karobka topilmadi" };
  if (carton.batch.clientId !== recon.clientId) {
    return { ok: false, message: "Bu karobka boshqa mijozga tegishli" };
  }
  if (carton.status === "delivered") return { ok: false, message: "Bu karobka allaqachon yetkazilgan" };
  // "loaded" = hozir yo'lda; "in_stock" bilan loadedAt to'ldirilgan = biror bosqichda
  // yuklanib, oxirgi bekatga yetib kelgach qayta bo'shatilgan (recomputeBatchStatus/hop
  // reset). Hech qachon yuklanmagan (hali manba omborida turgan) karobka rad etiladi.
  if (!carton.loadedAt) return { ok: false, message: "Bu karobka hali yuklanmagan/jo'natilmagan" };

  await prisma.intakeCarton.update({
    where: { id: carton.id },
    data: { status: "delivered", deliveryReconciliationId: reconciliationId, deliveredAt: new Date() },
  });

  const label = `${carton.batch.client.code}${carton.batch.letterCode ? `-${carton.batch.letterCode}` : ""} (${carton.sequenceInBatch}/${carton.batch.packageCount})`;
  await logAudit({
    userId: session.user.id,
    tableName: "intake_cartons",
    recordId: carton.id,
    action: "carton_delivered",
    diff: { sscc, clientCode: carton.batch.client.code, letterCode: carton.batch.letterCode, reconciliationId },
  });

  revalidatePath(`/delivery/${reconciliationId}`);
  revalidatePath("/delivery");
  return { ok: true, message: `✓ ${label} yetkazildi` };
}

// Generic "I scanned this box" confirmation for the standalone mobile scan page — same
// spirit as the batch-level confirmScan: a plain audit event, not tied to a specific
// loading/delivery operation. Useful for spot checks and inventory audits.
export async function confirmCartonScan(cartonId: string, formData: FormData): Promise<void> {
  const session = await requireSession();
  const note = String(formData.get("note") ?? "").trim() || undefined;

  const carton = await prisma.intakeCarton.findUniqueOrThrow({
    where: { id: cartonId },
    include: { batch: { include: { client: true } } },
  });

  await logAudit({
    userId: session.user.id,
    tableName: "intake_cartons",
    recordId: cartonId,
    action: "qr_scan",
    diff: {
      clientCode: carton.batch.client.code,
      letterCode: carton.batch.letterCode,
      sscc: carton.sscc,
      note,
    },
  });

  revalidatePath(`/scan/carton/${carton.sscc}`);
}
