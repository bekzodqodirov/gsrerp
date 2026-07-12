import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";

export async function logAudit(params: {
  userId: string;
  tableName: string;
  recordId: string;
  action: string;
  diff?: Record<string, string | number | boolean | null | undefined>;
}) {
  await prisma.auditLog.create({
    data: {
      tableName: params.tableName,
      recordId: params.recordId,
      action: params.action,
      userId: params.userId,
      diffJson: params.diff ? (params.diff as Prisma.InputJsonValue) : undefined,
    },
  });
}
