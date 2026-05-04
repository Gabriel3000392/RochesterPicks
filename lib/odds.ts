import type { Outcome, Prediction } from "@prisma/client";

export type OutcomeWithPool = Outcome & {
  pool: number;
  probability: number;
  decimalOdds: number;
};

type PredictionLike = Pick<Prediction, "outcomeId" | "amount" | "status">;

export function calculateOutcomePools(outcomes: Outcome[], predictions: PredictionLike[]) {
  const activePredictions = predictions.filter((prediction) => prediction.status !== "REFUNDED");
  const totalPool = activePredictions.reduce((sum, prediction) => sum + prediction.amount, 0);
  const equalProbability = outcomes.length > 0 ? 1 / outcomes.length : 0;

  const outcomeStats: OutcomeWithPool[] = outcomes.map((outcome) => {
    const outcomePool = activePredictions
      .filter((prediction) => prediction.outcomeId === outcome.id)
      .reduce((sum, prediction) => sum + prediction.amount, 0);

    // These are credit parimutuel display odds only. There is no house edge,
    // margin, cash value, or fixed price offered by the app.
    const probability = totalPool === 0 ? equalProbability : outcomePool / totalPool;
    const decimalOdds = totalPool === 0 ? 1 / equalProbability : totalPool / Math.max(outcomePool, 1);

    return {
      ...outcome,
      pool: outcomePool,
      probability,
      decimalOdds
    };
  });

  return { totalPool, outcomeStats };
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatOdds(value: number) {
  return value.toFixed(2);
}

export function buildOddsSnapshotRows(marketId: string, outcomeStats: OutcomeWithPool[], totalPool: number) {
  return outcomeStats.map((outcome) => ({
    marketId,
    outcomeId: outcome.id,
    totalPool,
    outcomePool: outcome.pool,
    impliedProbability: outcome.probability,
    decimalOdds: outcome.decimalOdds
  }));
}
