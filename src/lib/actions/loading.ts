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

  revalidatePath("/loading");
  redirect(`/loading/${event.id}`);
}

async function recomputeBatchStatus(intakeBatchId: string) {
  const [batch, lines] = await Promise.all([
    prisma.intakeBatch.findUniqueOrThrow({ where: { id: intakeBatchId } }),
    prisma.loadingLineItem.findMany({ where: { intakeBatchId }, select: { packageCountLoaded: true } }),
  ]);
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
    include: { loadingLines: true },
  });
  if (!batch) return { error: "Partiya topilmadi" };

  const alreadyLoaded = batch.loadingLines.reduce((sum, l) => sum + l.packageCountLoaded, 0);
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

  await prisma.loadingLineItem.create({
    data: {
      loadingEventId,
      intakeBatchId: d.intakeBatchId,
      packageCountLoaded: d.packageCountLoaded,
      note: d.note,
      createdById: session.user.id,
    },
  });

  await recomputeBatchStatus(d.intakeBatchId);

  revalidatePath(`/loading/${loadingEventId}`);
  revalidatePath("/stock");
  revalidatePath("/intake");
  return {};
}

export async function updateLoadingEventStatus(loadingEventId: string, status: "loading" | "departed" | "arrived" | "cleared") {
  await requireRole(["admin", "logistics"]);

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

  revalidatePath(`/loading/${loadingEventId}`);
  revalidatePath("/trucks");
}

export async function addTransitCheckpoint(loadingEventId: string, formData: FormData) {
  await requireRole(["admin", "logistics"]);

  const locationId = String(formData.get("locationId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;
  if (!locationId) return;

  await prisma.transitCheckpoint.create({
    data: { loadingEventId, locationId, arrivedAt: new Date(), note },
  });

  revalidatePath(`/loading/${loadingEventId}`);
}

export async function addLoadingCost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "accounting"]);

  const parsed = parseOrError(loadingCostSchema, formDataToObject(formData));
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  await prisma.loadingCost.create({
    data: {
      loadingEventId: d.loadingEventId,
      costType: d.costType,
      amountCny: d.amountCny,
      notes: d.notes,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/loading/${d.loadingEventId}`);
  revalidatePath("/costs");
  return {};
}
