-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SCHEDULED', 'SENDING', 'SENT', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL, "googleId" TEXT NOT NULL, "email" TEXT NOT NULL,
  "name" TEXT NOT NULL, "avatarUrl" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "subject" TEXT NOT NULL, "body" TEXT NOT NULL,
  "senderAddress" TEXT NOT NULL, "startAt" TIMESTAMP(3) NOT NULL, "delayMs" INTEGER NOT NULL,
  "hourlyLimit" INTEGER NOT NULL, "idempotencyKey" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Campaign_idempotencyKey_key" ON "Campaign"("idempotencyKey");
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailDelivery" (
  "id" TEXT NOT NULL, "campaignId" TEXT NOT NULL, "recipient" TEXT NOT NULL, "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL, "senderAddress" TEXT NOT NULL, "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" "EmailStatus" NOT NULL DEFAULT 'SCHEDULED', "sentAt" TIMESTAMP(3), "failedAt" TIMESTAMP(3),
  "failureReason" TEXT, "messageId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailDelivery_messageId_key" ON "EmailDelivery"("messageId");
CREATE INDEX "EmailDelivery_campaignId_status_scheduledFor_idx" ON "EmailDelivery"("campaignId", "status", "scheduledFor");
CREATE INDEX "EmailDelivery_status_scheduledFor_idx" ON "EmailDelivery"("status", "scheduledFor");
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "QueueOutbox" (
  "id" TEXT NOT NULL, "deliveryId" TEXT NOT NULL, "dispatchedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QueueOutbox_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "QueueOutbox_deliveryId_key" ON "QueueOutbox"("deliveryId");
CREATE INDEX "QueueOutbox_dispatchedAt_createdAt_idx" ON "QueueOutbox"("dispatchedAt", "createdAt");
ALTER TABLE "QueueOutbox" ADD CONSTRAINT "QueueOutbox_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "EmailDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
