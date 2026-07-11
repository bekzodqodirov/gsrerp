-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'warehouse', 'logistics', 'accounting');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('warehouse', 'border_crossing', 'customs');

-- CreateEnum
CREATE TYPE "PackingType" AS ENUM ('carton', 'woven_bag', 'pallet', 'other');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('in_stock', 'partially_loaded', 'fully_loaded');

-- CreateEnum
CREATE TYPE "TruckStatus" AS ENUM ('loading', 'departed', 'arrived');

-- CreateEnum
CREATE TYPE "LoadingEventStatus" AS ENUM ('loading', 'departed', 'arrived', 'cleared');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('forklift', 'customs', 'tax_refund', 'other');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('pending', 'confirmed', 'discrepancy');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "portalUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_batches" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "intakeDate" TIMESTAMP(3) NOT NULL,
    "productName" TEXT,
    "packingType" "PackingType" NOT NULL,
    "lengthM" DECIMAL(8,3) NOT NULL,
    "widthM" DECIMAL(8,3) NOT NULL,
    "heightM" DECIMAL(8,3) NOT NULL,
    "packageCount" INTEGER NOT NULL,
    "unitQty" INTEGER,
    "volumeCbm" DECIMAL(10,3) NOT NULL,
    "unitGrossWeightKg" DECIMAL(10,2),
    "totalWeightKg" DECIMAL(10,2),
    "costNotes" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'in_stock',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trucks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plateNumber" TEXT,
    "currentLocationId" TEXT,
    "status" "TruckStatus" NOT NULL DEFAULT 'loading',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trucks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loading_events" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "loadedDate" TIMESTAMP(3) NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT,
    "status" "LoadingEventStatus" NOT NULL DEFAULT 'loading',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loading_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loading_line_items" (
    "id" TEXT NOT NULL,
    "loadingEventId" TEXT NOT NULL,
    "intakeBatchId" TEXT NOT NULL,
    "packageCountLoaded" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loading_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loading_costs" (
    "id" TEXT NOT NULL,
    "loadingEventId" TEXT NOT NULL,
    "costType" "CostType" NOT NULL,
    "amountCny" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loading_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit_checkpoints" (
    "id" TEXT NOT NULL,
    "loadingEventId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "arrivedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "transit_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_reconciliations" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "reconDate" TIMESTAMP(3) NOT NULL,
    "expectedPackageCount" INTEGER NOT NULL,
    "confirmedPackageCount" INTEGER,
    "discrepancyNotes" TEXT,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "diffJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_portalUserId_key" ON "clients"("portalUserId");

-- CreateIndex
CREATE INDEX "intake_batches_clientId_idx" ON "intake_batches"("clientId");

-- CreateIndex
CREATE INDEX "intake_batches_locationId_idx" ON "intake_batches"("locationId");

-- CreateIndex
CREATE INDEX "intake_batches_status_idx" ON "intake_batches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trucks_code_key" ON "trucks"("code");

-- CreateIndex
CREATE INDEX "loading_events_truckId_idx" ON "loading_events"("truckId");

-- CreateIndex
CREATE INDEX "loading_line_items_loadingEventId_idx" ON "loading_line_items"("loadingEventId");

-- CreateIndex
CREATE INDEX "loading_line_items_intakeBatchId_idx" ON "loading_line_items"("intakeBatchId");

-- CreateIndex
CREATE INDEX "loading_costs_loadingEventId_idx" ON "loading_costs"("loadingEventId");

-- CreateIndex
CREATE INDEX "transit_checkpoints_loadingEventId_idx" ON "transit_checkpoints"("loadingEventId");

-- CreateIndex
CREATE INDEX "delivery_reconciliations_clientId_idx" ON "delivery_reconciliations"("clientId");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");

-- AddForeignKey
ALTER TABLE "intake_batches" ADD CONSTRAINT "intake_batches_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_batches" ADD CONSTRAINT "intake_batches_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_batches" ADD CONSTRAINT "intake_batches_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_events" ADD CONSTRAINT "loading_events_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_events" ADD CONSTRAINT "loading_events_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_events" ADD CONSTRAINT "loading_events_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_events" ADD CONSTRAINT "loading_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_line_items" ADD CONSTRAINT "loading_line_items_loadingEventId_fkey" FOREIGN KEY ("loadingEventId") REFERENCES "loading_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_line_items" ADD CONSTRAINT "loading_line_items_intakeBatchId_fkey" FOREIGN KEY ("intakeBatchId") REFERENCES "intake_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_line_items" ADD CONSTRAINT "loading_line_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_costs" ADD CONSTRAINT "loading_costs_loadingEventId_fkey" FOREIGN KEY ("loadingEventId") REFERENCES "loading_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_costs" ADD CONSTRAINT "loading_costs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_checkpoints" ADD CONSTRAINT "transit_checkpoints_loadingEventId_fkey" FOREIGN KEY ("loadingEventId") REFERENCES "loading_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_checkpoints" ADD CONSTRAINT "transit_checkpoints_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_reconciliations" ADD CONSTRAINT "delivery_reconciliations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
