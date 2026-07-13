-- AlterTable
ALTER TABLE "intake_batches" ADD COLUMN     "letterCode" TEXT;

-- CreateTable
CREATE TABLE "intake_letter_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nextIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "intake_letter_counter_pkey" PRIMARY KEY ("id")
);
