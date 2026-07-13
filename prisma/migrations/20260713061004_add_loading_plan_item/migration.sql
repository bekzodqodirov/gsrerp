-- CreateTable
CREATE TABLE "loading_plan_items" (
    "id" TEXT NOT NULL,
    "loadingEventId" TEXT NOT NULL,
    "intakeBatchId" TEXT NOT NULL,
    "plannedCount" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loading_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loading_plan_items_loadingEventId_idx" ON "loading_plan_items"("loadingEventId");

-- CreateIndex
CREATE INDEX "loading_plan_items_intakeBatchId_idx" ON "loading_plan_items"("intakeBatchId");

-- AddForeignKey
ALTER TABLE "loading_plan_items" ADD CONSTRAINT "loading_plan_items_loadingEventId_fkey" FOREIGN KEY ("loadingEventId") REFERENCES "loading_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_plan_items" ADD CONSTRAINT "loading_plan_items_intakeBatchId_fkey" FOREIGN KEY ("intakeBatchId") REFERENCES "intake_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_plan_items" ADD CONSTRAINT "loading_plan_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
