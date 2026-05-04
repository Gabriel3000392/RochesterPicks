CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "MarketType" AS ENUM ('YES_NO', 'MULTIPLE_CHOICE');
CREATE TYPE "MarketStatus" AS ENUM ('OPEN', 'CLOSED', 'RESOLVED', 'CANCELLED');
CREATE TYPE "PredictionStatus" AS ENUM ('ACTIVE', 'WON', 'LOST', 'REFUNDED');
CREATE TYPE "BalanceTransactionType" AS ENUM ('ADMIN_ADJUSTMENT', 'STAKE', 'PAYOUT', 'REFUND');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InviteCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "maxUses" INTEGER NOT NULL,
  "currentUses" INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Market" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "type" "MarketType" NOT NULL,
  "status" "MarketStatus" NOT NULL DEFAULT 'OPEN',
  "closeTime" TIMESTAMP(3) NOT NULL,
  "winningOutcomeId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Outcome" (
  "id" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prediction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "outcomeId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "PredictionStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BalanceTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "type" "BalanceTransactionType" NOT NULL,
  "marketId" TEXT,
  "predictionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BalanceTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");
CREATE INDEX "InviteCode_createdById_idx" ON "InviteCode"("createdById");
CREATE INDEX "Market_status_closeTime_idx" ON "Market"("status", "closeTime");
CREATE INDEX "Market_createdById_idx" ON "Market"("createdById");
CREATE INDEX "Market_winningOutcomeId_idx" ON "Market"("winningOutcomeId");
CREATE UNIQUE INDEX "Outcome_marketId_label_key" ON "Outcome"("marketId", "label");
CREATE INDEX "Outcome_marketId_idx" ON "Outcome"("marketId");
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");
CREATE INDEX "Prediction_marketId_idx" ON "Prediction"("marketId");
CREATE INDEX "Prediction_outcomeId_idx" ON "Prediction"("outcomeId");
CREATE INDEX "Prediction_status_idx" ON "Prediction"("status");
CREATE UNIQUE INDEX "BalanceTransaction_predictionId_type_key" ON "BalanceTransaction"("predictionId", "type");
CREATE INDEX "BalanceTransaction_userId_idx" ON "BalanceTransaction"("userId");
CREATE INDEX "BalanceTransaction_marketId_idx" ON "BalanceTransaction"("marketId");
CREATE INDEX "BalanceTransaction_type_idx" ON "BalanceTransaction"("type");

ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Market" ADD CONSTRAINT "Market_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Market" ADD CONSTRAINT "Market_winningOutcomeId_fkey" FOREIGN KEY ("winningOutcomeId") REFERENCES "Outcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
