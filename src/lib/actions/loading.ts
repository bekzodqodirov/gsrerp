"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import {
  loadingEventSchema,
  loadingLineItemSchema,
  loadingCostSchema,
} from "@/lib/validation/schemas";
import { parseOrError, formDataToObject, ActionState } from "@/lib/actions/action-state";
import { logAudit } from "@/lib/audit/log";

export async function createLoadingEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "logistics"]);

  const parsed = parseOrError(loadingEventSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const event = await prisma.loadingEvent.create({
    data: {
      truckId: d.truckId,
      loadedDate: new Date(d.loadedDate),
      fromLocationId: d.fromLocationId,
      toLocationId: d.toLocationId || null,
      createdById: session.user.id,
    },
  });

  await prisma.truck.update({ where: { id: d.truckId }, data: { status: "loading" } });
  await logAudit({
    userId: session.user.id,
    tableName: "loading_events",
    recordId: event.id,
    action: "create",
    diff: { truckId: d.truckId, fromLocationId: d.fromLocationId, toLocationId: d.toLocationId },
  });

  revalidatePath("/loading");
  redirect(`/loading/${event.id}`);
}

// A batch can move through several hops (China -> Qashqar -> Toshkent), each its own
// LoadingEvent. Only line items whose event departs FROM the batch's current location
// count toward "loaded on this leg" — earlier hops' line items no longer apply once the
// batch has physically arrived somewhere new, so it becomes fully available again there.
export async function recomputeBatchStatus(intakeBatchId: string) {
  const batch = await prisma.intakeBatch.findUniqueOrThrow({ where: { id: intakeBatchId } });
  const lines = await prisma.loadingLineItem.findMany({
    where: { intakeBatchId, loadingEvent: { fromLocationId: batch.currentLocationId } },
    select: { packageCountLoaded: true },
  });
  const loaded = lines.reduce((sum, l) => sum + l.packageCountLoaded, 0);
  const status = loaded <= 0 ? "in_stock" : loaded >= batch.packageCount ? "fully_loaded" : "partially_loaded";
  await prisma.intakeBatch.update({ where: { id: intakeBatchId }, data: { status } });
}

export async function addLoadingLineItem(loadingEventId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "logistics"]);

  const parsed = parseOrError(loadingLineItemSchema, {
    ...formDataToObject(formData),
    loadingEventId,
  });
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const batch = await prisma.intakeBatch.findUnique({
    where: { id: d.intakeBatchId },
    include: { loadingLines: { include: { loadingEvent: { select: { fromLocationId: true } } } } },
  });
  if (!batch) return { error: "Partiya topilmadi" };

  const alreadyLoaded = batch.loadingLines
    .filter((l) => l.loadingEvent.fromLocationId === batch.currentLocationId)
    .reduce((sum, l) => sum + l.packageCountLoaded, 0);
  const remaining = batch.packageCount - alreadyLoaded;

  if (d.packageCountLoaded > 0 && d.packageCountLoaded > remaining) {
    return {
      error: `Faqat ${remaining} joy qolgan, ${d.packageCountLoaded} kiritildi`,
      fieldErrors: { packageCountLoaded: `Faqat ${remaining} joy qolgan` },
    };
  }
  if (d.packageCountLoaded < 0 && alreadyLoaded + d.packageCountLoaded < 0) {
    return { error: "Manfiy tuzatish yuklangan miqdordan oshib ketdi" };
  }

  const line = await prisma.loadingLineItem.create({
    data: {
      loadingEventId,
      intakeBatchId: d.intakeBatchId,
      packageCountLoaded: d.packageCountLoaded,
      note: d.note,
      createdById: session.user.id,
    },
  });

  await recomputeBatchStatus(d.intakeBatchId);
  await logAudit({
    userId: session.user.id,
    tableName: "loading_line_items",
    recordId: line.id,
    action: "create",
    diff: { intakeBatchId: d.intakeBatchId, packageCountLoaded: d.packageCountLoaded, note: d.note },
  });

  revalidatePath(`/loading/${loadingEventId}`);
  revalidatePath("/stock");
  revalidatePath("/intake");
  return {};
}

export async function updateLoadingEventStatus(loadingEventId: string, status: "loading" | "departed" | "arrived" | "cleared") {
  const session = await requireRole(["admin", "logistics", "warehouse"]);

  if (session.user.role === "warehouse") {
    // Sklad xodimi faqat o'ziga tegishli bosqichni bajaradi: jo'natish (o'z omboridan
    // chiqayotgan bo'lsa) yoki qabul (o'z omboriga kelayotgan bo'lsa) — boshqa amallar yo'q.
    const existing = await prisma.loadingEvent.findUniqueOrThrow({ where: { id: loadingEventId } });
    const allowed =
      (status === "departed" && existing.fromLocationId === session.user.locationId) ||
      (status === "arrived" && existing.toLocationId === session.user.locationId);
    if (!allowed) redirect("/dashboard?denied=1");
  }

  const event = await prisma.loadingEvent.update({
    where: { id: loadingEventId },
    data: { status },
    include: { truck: true },
  });

  if (status === "departed") {
    await prisma.truck.update({ where: { id: event.truckId }, data: { status: "departed" } });
  } else if (status === "arrived" || status === "cleared") {
    await prisma.truck.update({
      where: { id: event.truckId },
      data: { status: "arrived", currentLocationId: event.toLocationId ?? undefined },
    });
  }

  const lines = await prisma.loadingLineItem.findMany({
    where: { loadingEventId },
    select: { intakeBatchId: true },
    distinct: ["intakeBatchId"],
  });
  const intakeBatchIds = lines.map((l) => l.intakeBatchId);

  if (intakeBatchIds.length > 0) {
    if (status === "departed") {
      await prisma.intakeBatch.updateMany({
        where: { id: { in: intakeBatchIds } },
        data: { inTransit: true, currentLocationId: event.fromLocationId },
      });
    } else if ((status === "arrived" || status === "cleared") && event.toLocationId) {
      await prisma.intakeBatch.updateMany({
        where: { id: { in: intakeBatchIds } },
        data: { inTransit: false, currentLocationId: event.toLocationId },
      });
      // Batch just arrived at a new location — its "loaded" ledger was scoped to the leg
      // it just finished, so status must be recomputed against the new currentLocationId
      // (otherwise it stays "fully_loaded" forever and can never be allocated to the next hop).
      await Promise.all(intakeBatchIds.map((id) => recomputeBatchStatus(id)));
      // Cartons scanned onto this leg become scannable again for the next hop (or for
      // final delivery) — same reasoning as the batch-level ledger reset above.
      await prisma.intakeCarton.updateMany({
        where: { loadingLineItem: { loadingEventId }, status: "loaded" },
        data: { status: "in_stock", loadingLineItemId: null },
      });
    } else if (status === "loading") {
      await prisma.intakeBatch.updateMany({
        where: { id: { in: intakeBatchIds } },
        data: { inTransit: false, currentLocationId: event.fromLocationId },
      });
    }
  }

  await logAudit({
    userId: session.user.id,
    tableName: "loading_events",
    recordId: loadingEventId,
    action: "status_change",
    diff: { status },
  });

  revalidatePath(`/loading/${loadingEventId}`);
  revalidatePath("/trucks");
  revalidatePath("/stock");
  revalidatePath("/intake");
  revalidatePath("/dashboard");
}

export async function addTransitCheckpoint(loadingEventId: string, formData: FormData) {
  const session = await requireRole(["admin", "logistics"]);

  const locationId = String(formData.get("locationId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;
  if (!locationId) return;

  const checkpoint = await prisma.transitCheckpoint.create({
    data: { loadingEventId, locationId, arrivedAt: new Date(), note },
  });
  await logAudit({
    userId: session.user.id,
    tableName: "transit_checkpoints",
    recordId: checkpoint.id,
    action: "create",
    diff: { locationId, note },
  });

  revalidatePath(`/loading/${loadingEventId}`);
}

export async function addLoadingCost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "accounting"]);

  const parsed = parseOrError(loadingCostSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const cost = await prisma.loadingCost.create({
    data: {
      loadingEventId: d.loadingEventId,
      costType: d.costType,
      amountCny: d.amountCny,
      notes: d.notes,
      createdById: session.user.id,
    },
  });
  await logAudit({
    userId: session.user.id,
    tableName: "loading_costs",
    recordId: cost.id,
    action: "create",
    diff: { costType: d.costType, amountCny: d.amountCny.toString(), notes: d.notes },
  });

  revalidatePath(`/loading/${d.loadingEventId}`);
  revalidatePath("/costs");
  return {};
}
