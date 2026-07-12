/*
  Warnings:

  - Made the column `totalWeightKg` on table `intake_batches` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "intake_batches" ALTER COLUMN "lengthM" DROP NOT NULL,
ALTER COLUMN "widthM" DROP NOT NULL,
ALTER COLUMN "heightM" DROP NOT NULL,
ALTER COLUMN "totalWeightKg" SET NOT NULL;
