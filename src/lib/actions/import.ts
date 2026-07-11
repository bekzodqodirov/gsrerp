"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import type { ParsedIntakeRow } from "@/lib/import/excel-mapper";

export async function importIntakeBatches(locationId: string, rows: ParsedIntakeRow[]) {
  const session = await requireRole(["admin", "warehouse"]);

  if (!locationId || rows.length === 0) {
    return { imported: 0, error: "Joylashuv yoki qatorlar tanlanmagan" };
  }

  const codes = Array.from(new Set(rows.map((r) => r.clientCode)));
  const existingClients = await prisma.client.findMany({ where: { code: { in: codes } } });
  const clientByCode = new Map(existingClients.map((c) => [c.code, c]));

  for (const code of codes) {
    if (!clientByCode.has(code)) {
      const created = await prisma.client.create({ data: { code, name: code } });
      clientByCode.set(code, created);
    }
  }

  let imported = 0;
  for (const row of rows) {
    const client = clientByCode.get(row.clientCode);
    if (!client) continue;

    const volumeCbm = row.lengthM * row.widthM * row.heightM * row.packageCount;
    const totalWeightKg = row.unitGrossWeightKg ? row.unitGrossWeightKg * row.packageCount : undefined;

    await prisma.intakeBatch.create({
      data: {
        clientId: client.id,
        locationId,
        intakeDate: row.intakeDate ? new Date(row.intakeDate) : new Date(),
        productName: row.productName,
        packingType: row.packingType,
        lengthM: row.lengthM,
        widthM: row.widthM,
        heightM: row.heightM,
        packageCount: row.packageCount,
        unitQty: row.unitQty,
        volumeCbm,
        unitGrossWeightKg: row.unitGrossWeightKg,
        totalWeightKg,
        costNotes: row.costNotes,
        createdById: session.user.id,
      },
    });
    imported++;
  }

  revalidatePath("/intake");
  revalidatePath("/stock");
  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return { imported };
}
