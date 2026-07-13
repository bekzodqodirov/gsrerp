-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locationId" TEXT;

-- CreateIndex
CREATE INDEX "users_locationId_idx" ON "users"("locationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
