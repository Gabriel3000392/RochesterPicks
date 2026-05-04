import { describe, expect, it } from "vitest";
import { allocatePayouts } from "../lib/payouts";

describe("allocatePayouts", () => {
  it("splits the full credit pool proportionally", () => {
    const payouts = allocatePayouts(
      [
        { predictionId: "a", userId: "user-a", amount: 50, createdAt: new Date("2026-01-01") },
        { predictionId: "b", userId: "user-b", amount: 50, createdAt: new Date("2026-01-02") }
      ],
      300,
      100
    );

    expect(payouts.map((payout) => payout.payout)).toEqual([150, 150]);
    expect(payouts.reduce((sum, payout) => sum + payout.payout, 0)).toBe(300);
  });

  it("uses deterministic largest-remainder rounding for integer credits", () => {
    const payouts = allocatePayouts(
      [
        { predictionId: "a", userId: "user-a", amount: 1, createdAt: new Date("2026-01-01") },
        { predictionId: "b", userId: "user-b", amount: 1, createdAt: new Date("2026-01-02") },
        { predictionId: "c", userId: "user-c", amount: 1, createdAt: new Date("2026-01-03") }
      ],
      10,
      3
    );

    expect(payouts.reduce((sum, payout) => sum + payout.payout, 0)).toBe(10);
    expect(payouts.map((payout) => payout.payout)).toEqual([4, 3, 3]);
  });
});
