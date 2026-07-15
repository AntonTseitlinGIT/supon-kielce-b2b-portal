-- CreateIndex
CREATE INDEX "Branch_clientId_idx" ON "Branch"("clientId");

-- CreateIndex
CREATE INDEX "DeliveryAddress_branchId_idx" ON "DeliveryAddress"("branchId");

-- CreateIndex
CREATE INDEX "User_clientId_idx" ON "User"("clientId");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "Employee_branchId_deletedAt_idx" ON "Employee"("branchId", "deletedAt");

-- CreateIndex
CREATE INDEX "IssuedItem_employeeId_idx" ON "IssuedItem"("employeeId");

-- CreateIndex
CREATE INDEX "IssuedItem_productId_idx" ON "IssuedItem"("productId");

-- CreateIndex
CREATE INDEX "EmployeeHistory_employeeId_idx" ON "EmployeeHistory"("employeeId");

-- CreateIndex
CREATE INDEX "PpeLimit_categoryId_idx" ON "PpeLimit"("categoryId");

-- CreateIndex
CREATE INDEX "PpeLimitUsage_employeeId_idx" ON "PpeLimitUsage"("employeeId");

-- CreateIndex
CREATE INDEX "PpeLimitUsage_ppeLimitId_idx" ON "PpeLimitUsage"("ppeLimitId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "ClientProduct_productId_idx" ON "ClientProduct"("productId");

-- CreateIndex
CREATE INDEX "Order_clientId_status_deletedAt_idx" ON "Order"("clientId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

-- CreateIndex
CREATE INDEX "Order_createdById_idx" ON "Order"("createdById");

-- CreateIndex
CREATE INDEX "Order_ticketId_idx" ON "Order"("ticketId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_employeeId_idx" ON "OrderItem"("employeeId");

-- CreateIndex
CREATE INDEX "Delivery_orderId_idx" ON "Delivery"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryItem_deliveryId_idx" ON "DeliveryItem"("deliveryId");

-- CreateIndex
CREATE INDEX "WzDocument_clientId_idx" ON "WzDocument"("clientId");

-- CreateIndex
CREATE INDEX "WzDocument_orderId_idx" ON "WzDocument"("orderId");

-- CreateIndex
CREATE INDEX "WzDocument_branchId_idx" ON "WzDocument"("branchId");

-- CreateIndex
CREATE INDEX "WzDocument_createdById_idx" ON "WzDocument"("createdById");

-- CreateIndex
CREATE INDEX "WzItem_wzDocId_idx" ON "WzItem"("wzDocId");

-- CreateIndex
CREATE INDEX "Ticket_clientId_status_idx" ON "Ticket"("clientId", "status");

-- CreateIndex
CREATE INDEX "Ticket_branchId_idx" ON "Ticket"("branchId");

-- CreateIndex
CREATE INDEX "Ticket_orderId_idx" ON "Ticket"("orderId");

-- CreateIndex
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");

-- CreateIndex
CREATE INDEX "Ticket_employeeId_idx" ON "Ticket"("employeeId");

-- CreateIndex
CREATE INDEX "Ticket_productId_idx" ON "Ticket"("productId");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "TicketMessage_senderId_idx" ON "TicketMessage"("senderId");

-- CreateIndex
CREATE INDEX "InternalNote_ticketId_idx" ON "InternalNote"("ticketId");

-- CreateIndex
CREATE INDEX "InternalNote_authorId_idx" ON "InternalNote"("authorId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
