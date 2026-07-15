-- AlterTable: link each delivery item to its exact source order item line
ALTER TABLE "DeliveryItem" ADD COLUMN "orderItemId" TEXT;

-- CreateIndex
CREATE INDEX "DeliveryItem_orderItemId_idx" ON "DeliveryItem"("orderItemId");
