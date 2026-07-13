-- AlterTable
ALTER TABLE "intake_batches" ADD COLUMN     "receiptId" TEXT;

-- CreateTable
CREATE TABLE "intake_receipts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "intakeDate" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_photos" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "intakeReceiptId" TEXT,
    "intakeBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intake_receipts_clientId_idx" ON "intake_receipts"("clientId");

-- CreateIndex
CREATE INDEX "intake_photos_intakeReceiptId_idx" ON "intake_photos"("intakeReceiptId");

-- CreateIndex
CREATE INDEX "intake_photos_intakeBatchId_idx" ON "intake_photos"("intakeBatchId");

-- CreateIndex
CREATE INDEX "intake_batches_receiptId_idx" ON "intake_batches"("receiptId");

-- AddForeignKey
ALTER TABLE "intake_receipts" ADD CONSTRAINT "intake_receipts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_receipts" ADD CONSTRAINT "intake_receipts_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_receipts" ADD CONSTRAINT "intake_receipts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_photos" ADD CONSTRAINT "intake_photos_intakeReceiptId_fkey" FOREIGN KEY ("intakeReceiptId") REFERENCES "intake_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_photos" ADD CONSTRAINT "intake_photos_intakeBatchId_fkey" FOREIGN KEY ("intakeBatchId") REFERENCES "intake_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_batches" ADD CONSTRAINT "intake_batches_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "intake_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
