-- CreateEnum
CREATE TYPE "CartonStatus" AS ENUM ('in_stock', 'loaded', 'delivered');

-- CreateTable
CREATE TABLE "carton_serial_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "carton_serial_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_cartons" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sscc" TEXT NOT NULL,
    "sequenceInBatch" INTEGER NOT NULL,
    "status" "CartonStatus" NOT NULL DEFAULT 'in_stock',
    "loadingLineItemId" TEXT,
    "loadedAt" TIMESTAMP(3),
    "deliveryReconciliationId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_cartons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intake_cartons_sscc_key" ON "intake_cartons"("sscc");

-- CreateIndex
CREATE INDEX "intake_cartons_batchId_idx" ON "intake_cartons"("batchId");

-- CreateIndex
CREATE INDEX "intake_cartons_status_idx" ON "intake_cartons"("status");

-- CreateIndex
CREATE INDEX "intake_cartons_loadingLineItemId_idx" ON "intake_cartons"("loadingLineItemId");

-- CreateIndex
CREATE INDEX "intake_cartons_deliveryReconciliationId_idx" ON "intake_cartons"("deliveryReconciliationId");

-- AddForeignKey
ALTER TABLE "intake_cartons" ADD CONSTRAINT "intake_cartons_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "intake_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_cartons" ADD CONSTRAINT "intake_cartons_loadingLineItemId_fkey" FOREIGN KEY ("loadingLineItemId") REFERENCES "loading_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_cartons" ADD CONSTRAINT "intake_cartons_deliveryReconciliationId_fkey" FOREIGN KEY ("deliveryReconciliationId") REFERENCES "delivery_reconciliations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
