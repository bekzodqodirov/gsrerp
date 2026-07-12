"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { intakeBatchBulkSchema, intakeBatchEditSchema } from "@/lib/validation/schemas";
import { ActionState } from "@/lib/actions/action-state";
import { logAudit } from "@/lib/audit/log";

async function filesToPhotoRows(files: File[]) {
  const valid = files.filter((f) => f instanceof File && f.size > 0 && f.type.startsWith("image/"));
  return Promise.all(
    valid.map(async (f) => ({
      data: Buffer.from(await f.arrayBuffer()),
      mimeType: f.type,
    }))
  );
}

export async function createIntakeBatchesBulk(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "warehouse"]);

  let lines: unknown;
  try {
    lines = JSON.parse(String(formData.get("linesJson") ?? "[]"));
  } catch {
    return { error: "Qatorlar formati noto'g'ri" };
  }

  const parsed = intakeBatchBulkSchema.safeParse({
    clientId: formData.get("clientId"),
    locationId: formData.get("locationId"),
    intakeDate: formData.get("intakeDate"),
    packingType: formData.get("packingType"),
    lines,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Ma'lumotlarni tekshiring", fieldErrors };
  }

  const d = parsed.data;

  // Ombor xodimi faqat o'ziga biriktirilgan omborga kirim qila oladi — frontendda
  // maydon qulflangan bo'lsa ham, so'rovni to'g'ridan-to'g'ri o'zgartirishning oldini olish.
  if (session.user.role === "warehouse" && d.locationId !== session.user.locationId) {
    return { error: "Siz faqat o'zingizga biriktirilgan omborga kirim qila olasiz" };
  }
  const client = await prisma.client.findUniqueOrThrow({ where: { id: d.clientId }, select: { code: true } });

  const receiptPhotoFiles = formData.getAll("receiptPhotos") as File[];
  const rowPhotoFiles = d.lines.map((_, i) => formData.getAll(`rowPhotos_${i}`) as File[]);

  const receipt = await prisma.intakeReceipt.create({
    data: {
      clientId: d.clientId,
      locationId: d.locationId,
      intakeDate: new Date(d.intakeDate),
      createdById: session.user.id,
    },
  });

  const created = await prisma.$transaction(
    d.lines.map((line) =>
      prisma.intakeBatch.create({
        data: {
          clientId: d.clientId,
          locationId: d.locationId,
          currentLocationId: d.locationId,
          receiptId: receipt.id,
          intakeDate: new Date(d.intakeDate),
          productName: line.productName,
          packingType: d.packingType,
          lengthM: line.lengthM,
          widthM: line.widthM,
          heightM: line.heightM,
          unitGrossWeightKg: line.unitGrossWeightKg,
          packageCount: line.packageCount,
          unitQty: line.unitQty,
          volumeCbm: line.volumeCbm,
          totalWeightKg: line.totalWeightKg,
          costNotes: line.costNotes,
          createdById: session.user.id,
        },
      })
    )
  );

  const receiptPhotos = await filesToPhotoRows(receiptPhotoFiles);
  if (receiptPhotos.length > 0) {
    await prisma.intakePhoto.createMany({
      data: receiptPhotos.map((p) => ({ ...p, intakeReceiptId: receipt.id })),
    });
  }

  for (let i = 0; i < created.length; i++) {
    const batch = created[i];
    const photos = await filesToPhotoRows(rowPhotoFiles[i] ?? []);
    if (photos.length > 0) {
      await prisma.intakePhoto.createMany({
        data: photos.map((p) => ({ ...p, intakeBatchId: batch.id })),
      });
    }

    await logAudit({
      userId: session.user.id,
      tableName: "intake_batches",
      recordId: batch.id,
      action: "create",
      diff: {
        clientCode: client.code,
        productName: batch.productName,
        packageCount: batch.packageCount,
        volumeCbm: batch.volumeCbm.toString(),
        totalWeightKg: batch.totalWeightKg.toString(),
        photoCount: photos.length,
      },
    });
  }

  await logAudit({
    userId: session.user.id,
    tableName: "intake_receipts",
    recordId: receipt.id,
    action: "create",
    diff: { clientCode: client.code, lineCount: created.length, overallPhotoCount: receiptPhotos.length },
  });

  revalidatePath("/intake");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  redirect("/intake");
}

// Ombor xodimi kirimni noto'g'ri kiritib qo'ysa (yoki keyinroq o'zgarish bo'lsa) tuzatishi
// uchun — faqat o'ziga biriktirilgan ombordagi partiyalarni tahrirlay oladi.
export async function updateIntakeBatch(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "warehouse"]);

  const batch = await prisma.intakeBatch.findUnique({ where: { id }, include: { client: true } });
  if (!batch) return { error: "Partiya topilmadi" };
  if (session.user.role === "warehouse" && batch.currentLocationId !== session.user.locationId) {
    return { error: "Siz faqat o'zingizning omboringizdagi partiyalarni tahrirlay olasiz" };
  }

  const parsed = intakeBatchEditSchema.safeParse({
    productName: formData.get("productName"),
    packageCount: formData.get("packageCount"),
    volumeCbm: formData.get("volumeCbm"),
    totalWeightKg: formData.get("totalWeightKg"),
    lengthM: formData.get("lengthM") || undefined,
    widthM: formData.get("widthM") || undefined,
    heightM: formData.get("heightM") || undefined,
    unitGrossWeightKg: formData.get("unitGrossWeightKg") || undefined,
    costNotes: formData.get("costNotes"),
    packingType: formData.get("packingType"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Ma'lumotlarni tekshiring", fieldErrors };
  }

  const d = parsed.data;
  await prisma.intakeBatch.update({
    where: { id },
    data: {
      productName: d.productName,
      packageCount: d.packageCount,
      volumeCbm: d.volumeCbm,
      totalWeightKg: d.totalWeightKg,
      lengthM: d.lengthM,
      widthM: d.widthM,
      heightM: d.heightM,
      unitGrossWeightKg: d.unitGrossWeightKg,
      costNotes: d.costNotes,
      packingType: d.packingType,
    },
  });

  await logAudit({
    userId: session.user.id,
    tableName: "intake_batches",
    recordId: id,
    action: "update",
    diff: {
      clientCode: batch.client.code,
      productName: d.productName,
      packageCount: d.packageCount,
      volumeCbm: d.volumeCbm.toString(),
      totalWeightKg: d.totalWeightKg.toString(),
    },
  });

  revalidatePath("/intake");
  revalidatePath(`/intake/${id}`);
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  redirect(`/intake/${id}`);
}

// Xato kiritilgan partiyani butunlay o'chirish — lekin undan allaqachon yuklama qilingan
// bo'lsa (audit tarixi buzilmasligi uchun) o'chirishga ruxsat berilmaydi.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState
export async function deleteIntakeBatch(id: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  const session = await requireRole(["admin", "warehouse"]);

  const batch = await prisma.intakeBatch.findUnique({
    where: { id },
    include: { client: true, loadingLines: true },
  });
  if (!batch) return { error: "Partiya topilmadi" };
  if (session.user.role === "warehouse" && batch.currentLocationId !== session.user.locationId) {
    return { error: "Siz faqat o'zingizning omboringizdagi partiyalarni o'chira olasiz" };
  }
  if (batch.loadingLines.length > 0) {
    return { error: "Bu partiyadan allaqachon yuklama qilingan, shuning uchun o'chirib bo'lmaydi" };
  }

  await prisma.intakePhoto.deleteMany({ where: { intakeBatchId: id } });
  await prisma.intakeBatch.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    tableName: "intake_batches",
    recordId: id,
    action: "delete",
    diff: { clientCode: batch.client.code, productName: batch.productName, packageCount: batch.packageCount },
  });

  revalidatePath("/intake");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  redirect("/intake");
}
