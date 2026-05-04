ALTER TABLE "InviteCode" ADD COLUMN "cancelledAt" TIMESTAMP(3);
CREATE INDEX "InviteCode_cancelledAt_idx" ON "InviteCode"("cancelledAt");
