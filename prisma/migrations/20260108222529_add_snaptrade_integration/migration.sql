/*
  Warnings:

  - A unique constraint covering the columns `[snaptradeUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Holding" ADD COLUMN     "brokerageAccountId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "snaptradeUserId" TEXT,
ADD COLUMN     "snaptradeUserSecret" TEXT;

-- CreateTable
CREATE TABLE "BrokerageConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snaptradeConnectionId" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerageConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerageAccount" (
    "id" TEXT NOT NULL,
    "brokerageConnectionId" TEXT NOT NULL,
    "snaptradeAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerageAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerageConnection_snaptradeConnectionId_key" ON "BrokerageConnection"("snaptradeConnectionId");

-- CreateIndex
CREATE INDEX "BrokerageConnection_userId_idx" ON "BrokerageConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerageAccount_snaptradeAccountId_key" ON "BrokerageAccount"("snaptradeAccountId");

-- CreateIndex
CREATE INDEX "BrokerageAccount_brokerageConnectionId_idx" ON "BrokerageAccount"("brokerageConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_snaptradeUserId_key" ON "User"("snaptradeUserId");

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_brokerageAccountId_fkey" FOREIGN KEY ("brokerageAccountId") REFERENCES "BrokerageAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerageConnection" ADD CONSTRAINT "BrokerageConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerageAccount" ADD CONSTRAINT "BrokerageAccount_brokerageConnectionId_fkey" FOREIGN KEY ("brokerageConnectionId") REFERENCES "BrokerageConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
