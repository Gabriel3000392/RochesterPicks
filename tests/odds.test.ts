import { describe, expect, it } from "vitest";
import { calculateOutcomePools } from "../lib/odds";

const baseOutcome = { marketId: "m1", createdAt: new Date() };

describe("calculateOutcomePools", () => {
  it("shows equal probabilities when the pool is empty", () => {
    const { totalPool, outcomeStats } = calculateOutcomePools(
      [
        { ...baseOutcome, id: "yes", label: "Yes" },
        { ...baseOutcome, id: "no", label: "No" }
      ],
      []
    );

    expect(totalPool).toBe(0);
    expect(outcomeStats.map((outcome) => outcome.probability)).toEqual([0.5, 0.5]);
    expect(outcomeStats.map((outcome) => outcome.decimalOdds)).toEqual([2, 2]);
  });

  it("calculates parimutuel probabilities and decimal odds from credit pools", () => {
    const { totalPool, outcomeStats } = calculateOutcomePools(
      [
        { ...baseOutcome, id: "yes", label: "Yes" },
        { ...baseOutcome, id: "no", label: "No" }
      ],
      [
        { outcomeId: "yes", amount: 200, status: "ACTIVE" },
        { outcomeId: "no", amount: 100, status: "ACTIVE" }
      ]
    );

    expect(totalPool).toBe(300);
    expect(outcomeStats[0].probability).toBeCloseTo(2 / 3);
    expect(outcomeStats[0].decimalOdds).toBeCloseTo(1.5);
    expect(outcomeStats[1].probability).toBeCloseTo(1 / 3);
    expect(outcomeStats[1].decimalOdds).toBeCloseTo(3);
  });
});
