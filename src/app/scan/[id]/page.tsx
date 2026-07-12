import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";
import { confirmScan } from "@/lib/actions/scan";
import { ScanView } from "../scan-view";

export default async function ScanTargetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const batch = await prisma.intakeBatch.findUnique({
    where: { id },
    include: { client: true, currentLocation: true },
  });

  const lastScans = batch
    ? await prisma.auditLog.findMany({
        where: { tableName: "intake_batches", recordId: id, action: "qr_scan" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: true },
      })
    : [];

  if (!batch) notFound();

  const confirmWithBatch = confirmScan.bind(null, batch.id);

  return (
    <ScanView
      batch={batch}
      userName={session.user.name ?? session.user.email ?? ""}
      lastScans={lastScans}
      confirmAction={confirmWithBatch}
    />
  );
}
