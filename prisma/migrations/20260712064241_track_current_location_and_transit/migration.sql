/*
  Warnings:

  - Added the required column `currentLocationId` to the `intake_batches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "intake_batches" ADD COLUMN     "currentLocationId" TEXT NOT NULL,
ADD COLUMN     "inTransit" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "intake_batches_currentLocationId_idx" ON "intake_batches"("currentLocationId");

-- AddForeignKey
ALTER TABLE "intake_batches" ADD CONSTRAINT "intake_batches_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
