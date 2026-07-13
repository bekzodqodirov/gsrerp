-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'sales';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "salesManagerId" TEXT;

-- CreateIndex
CREATE INDEX "clients_salesManagerId_idx" ON "clients"("salesManagerId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_salesManagerId_fkey" FOREIGN KEY ("salesManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
