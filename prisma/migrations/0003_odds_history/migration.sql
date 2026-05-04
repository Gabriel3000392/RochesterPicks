CREATE TABLE "OddsSnapshot" (
  "id" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "outcomeId" TEXT NOT NULL,
  "totalPool" INTEGER NOT NULL,
  "outcomePool" INTEGER NOT NULL,
  "impliedProbability" DOUBLE PRECISION NOT NULL,
  "decimalOdds" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OddsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OddsSnapshot_marketId_createdAt_idx" ON "OddsSnapshot"("marketId", "createdAt");
CREATE INDEX "OddsSnapshot_outcomeId_createdAt_idx" ON "OddsSnapshot"("outcomeId", "createdAt");

ALTER TABLE "OddsSnapshot" ADD CONSTRAINT "OddsSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OddsSnapshot" ADD CONSTRAINT "OddsSnapshot_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
