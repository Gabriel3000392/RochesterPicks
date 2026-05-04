export type WinningPredictionShare = {
  predictionId: string;
  userId: string;
  amount: number;
  createdAt: Date;
};

export type PayoutAllocation = WinningPredictionShare & {
  payout: number;
};

export function allocatePayouts(
  winningPredictions: WinningPredictionShare[],
  totalPool: number,
  totalWinningStake: number
): PayoutAllocation[] {
  if (totalPool <= 0 || totalWinningStake <= 0 || winningPredictions.length === 0) {
    return [];
  }

  const base = winningPredictions.map((prediction) => {
    const numerator = prediction.amount * totalPool;
    return {
      ...prediction,
      payout: Math.floor(numerator / totalWinningStake),
      remainder: numerator % totalWinningStake
    };
  });

  let leftover = totalPool - base.reduce((sum, item) => sum + item.payout, 0);
  const byRemainder = [...base].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    if (a.createdAt.getTime() !== b.createdAt.getTime()) return a.createdAt.getTime() - b.createdAt.getTime();
    return a.predictionId.localeCompare(b.predictionId);
  });

  for (const item of byRemainder) {
    if (leftover <= 0) break;
    item.payout += 1;
    leftover -= 1;
  }

  return base.map(({ remainder: _remainder, ...allocation }) => allocation);
}
