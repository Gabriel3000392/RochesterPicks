"use server";

import { BalanceTransactionType, MarketStatus, MarketType, PredictionStatus, Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSessionCookie, hashPassword, requireAdmin, requireUser, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildOddsSnapshotRows, calculateOutcomePools } from "@/lib/odds";
import {
  adminCreateUserSchema,
  balanceAdjustmentSchema,
  editUserNameSchema,
  inviteIdSchema,
  inviteCodeSchema,
  loginSchema,
  marketIdSchema,
  marketSchema,
  predictionSchema,
  registerSchema,
  resolveMarketSchema,
  userIdSchema
} from "@/lib/schemas";
import { allocatePayouts } from "@/lib/payouts";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function actionError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function actionSuccess(path: string, message: string): never {
  redirect(`${path}?success=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formValue(formData, "email"),
    name: formValue(formData, "name"),
    password: formValue(formData, "password"),
    inviteCode: formValue(formData, "inviteCode")
  });
  if (!parsed.success) actionError("/register", parsed.error.issues[0]?.message ?? "Registration failed.");

  const { email, name, password, inviteCode } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.$transaction(
      async (tx) => {
        const invite = await tx.inviteCode.findUnique({ where: { code: inviteCode } });
        if (!invite) throw new Error("invalid-invite");
        if (invite.cancelledAt) throw new Error("cancelled-invite");
        if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error("expired-invite");
        if (invite.currentUses >= invite.maxUses) throw new Error("used-invite");

        const updated = await tx.inviteCode.updateMany({
          where: {
            id: invite.id,
            cancelledAt: null,
            currentUses: { lt: invite.maxUses },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          },
          data: { currentUses: { increment: 1 } }
        });
        if (updated.count !== 1) throw new Error("used-invite");

        return tx.user.create({
          data: { email, name, passwordHash, role: Role.USER, balance: 0 }
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    await setSessionCookie(user.id);
  } catch (error) {
    if (error instanceof Error && ["invalid-invite", "expired-invite", "cancelled-invite", "used-invite"].includes(error.message)) {
      actionError("/register", error.message);
    }
    actionError("/register", "Email may already be registered.");
  }

  redirect("/markets");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password")
  });
  if (!parsed.success) actionError("/login", "Invalid login details.");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    actionError("/login", "Invalid email or password.");
  }
  if (!user.isActive) actionError("/login", "account-inactive");

  await setSessionCookie(user.id);
  redirect("/markets");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function createInviteCodeAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = inviteCodeSchema.safeParse({
    code: formValue(formData, "code"),
    maxUses: formValue(formData, "maxUses"),
    expiresAt: formValue(formData, "expiresAt")
  });
  if (!parsed.success) actionError("/admin", parsed.error.issues[0]?.message ?? "Invalid invite code.");

  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) actionError("/admin", "Invalid invite expiry.");

  try {
    await prisma.inviteCode.create({
      data: {
        code: parsed.data.code,
        maxUses: parsed.data.maxUses,
        expiresAt,
        createdById: admin.id
      }
    });
  } catch {
    actionError("/admin", "Invite code already exists.");
  }

  revalidatePath("/admin");
  actionSuccess("/admin", "invite-created");
}

export async function cancelInviteCodeAction(formData: FormData) {
  await requireAdmin();
  const parsed = inviteIdSchema.safeParse({ inviteId: formValue(formData, "inviteId") });
  if (!parsed.success) actionError("/admin", "Invalid invite code.");

  await prisma.inviteCode.updateMany({
    where: { id: parsed.data.inviteId, cancelledAt: null },
    data: { cancelledAt: new Date() }
  });

  revalidatePath("/admin");
  actionSuccess("/admin", "invite-cancelled");
}

export async function createPlayerAction(formData: FormData) {
  await requireAdmin();
  const parsed = adminCreateUserSchema.safeParse({
    email: formValue(formData, "email"),
    name: formValue(formData, "name"),
    password: formValue(formData, "password")
  });
  if (!parsed.success) actionError("/admin", parsed.error.issues[0]?.message ?? "Invalid player details.");

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.user.create({
          data: {
            email: parsed.data.email,
            name: parsed.data.name,
            passwordHash,
            role: Role.USER,
            isActive: true,
            balance: 0
          }
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch {
    actionError("/admin", "Email may already be registered.");
  }

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  actionSuccess("/admin", "player-created");
}

export async function deactivatePlayerAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = userIdSchema.safeParse({ userId: formValue(formData, "userId") });
  if (!parsed.success) actionError("/admin", "Invalid player.");
  if (parsed.data.userId === admin.id) actionError("/admin", "You cannot remove your own admin account.");

  await prisma.user.updateMany({
    where: { id: parsed.data.userId, role: Role.USER },
    data: { isActive: false }
  });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  actionSuccess("/admin", "player-deactivated");
}

export async function reactivatePlayerAction(formData: FormData) {
  await requireAdmin();
  const parsed = userIdSchema.safeParse({ userId: formValue(formData, "userId") });
  if (!parsed.success) actionError("/admin", "Invalid player.");

  await prisma.user.updateMany({
    where: { id: parsed.data.userId, role: Role.USER },
    data: { isActive: true }
  });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  actionSuccess("/admin", "player-reactivated");
}

export async function editPlayerNameAction(formData: FormData) {
  await requireAdmin();
  const parsed = editUserNameSchema.safeParse({
    userId: formValue(formData, "userId"),
    name: formValue(formData, "name")
  });
  if (!parsed.success) actionError("/admin", parsed.error.issues[0]?.message ?? "Invalid player name.");

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { name: parsed.data.name }
  });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  actionSuccess("/admin", "player-renamed");
}

function normalizedMarketData(formData: FormData) {
  const type = formValue(formData, "type") as MarketType;
  const outcomes =
    type === MarketType.YES_NO && !formValue(formData, "outcomes").trim()
      ? "Yes\nNo"
      : formValue(formData, "outcomes");

  return marketSchema.safeParse({
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    category: formValue(formData, "category"),
    type,
    closeTime: formValue(formData, "closeTime"),
    outcomes
  });
}

export async function createMarketAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = normalizedMarketData(formData);
  if (!parsed.success) actionError("/admin/markets/new", parsed.error.issues[0]?.message ?? "Invalid market.");

  const closeTime = new Date(parsed.data.closeTime);
  if (Number.isNaN(closeTime.getTime())) actionError("/admin/markets/new", "Invalid close time.");
  if (parsed.data.type === MarketType.YES_NO && parsed.data.outcomes.length !== 2) {
    actionError("/admin/markets/new", "Yes/No markets must have exactly two outcomes.");
  }

  const uniqueOutcomes = [...new Set(parsed.data.outcomes)];
  if (uniqueOutcomes.length !== parsed.data.outcomes.length) {
    actionError("/admin/markets/new", "Outcome labels must be unique.");
  }

  await prisma.market.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      type: parsed.data.type,
      closeTime,
      createdById: admin.id,
      outcomes: {
        create: parsed.data.outcomes.map((label) => ({ label }))
      }
    }
  });

  revalidatePath("/markets");
  revalidatePath("/admin");
  actionSuccess("/admin", "market-created");
}

export async function editMarketAction(formData: FormData) {
  await requireAdmin();
  const marketId = formValue(formData, "marketId");
  const parsed = normalizedMarketData(formData);
  if (!parsed.success) actionError(`/admin/markets/${marketId}/edit`, parsed.error.issues[0]?.message ?? "Invalid market.");

  const closeTime = new Date(parsed.data.closeTime);
  if (Number.isNaN(closeTime.getTime())) actionError(`/admin/markets/${marketId}/edit`, "Invalid close time.");

  await prisma.market.update({
    where: { id: marketId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      closeTime
    }
  });

  revalidatePath("/markets");
  revalidatePath(`/markets/${marketId}`);
  actionSuccess("/admin", "market-updated");
}

export async function closeMarketAction(formData: FormData) {
  await requireAdmin();
  const parsed = marketIdSchema.safeParse({ marketId: formValue(formData, "marketId") });
  if (!parsed.success) actionError("/admin", "Invalid market.");

  await prisma.market.updateMany({
    where: { id: parsed.data.marketId, status: MarketStatus.OPEN },
    data: { status: MarketStatus.CLOSED }
  });

  revalidatePath("/markets");
  revalidatePath("/admin");
  actionSuccess("/admin", "market-manually-closed");
}

export async function placePredictionAction(formData: FormData) {
  const user = await requireUser();
  const parsed = predictionSchema.safeParse({
    marketId: formValue(formData, "marketId"),
    outcomeId: formValue(formData, "outcomeId"),
    amount: formValue(formData, "amount")
  });
  const path = `/markets/${formValue(formData, "marketId")}`;
  if (!parsed.success) actionError(path, parsed.error.issues[0]?.message ?? "Invalid prediction.");

  try {
    await prisma.$transaction(
      async (tx) => {
        const market = await tx.market.findUnique({
          where: { id: parsed.data.marketId },
          include: { outcomes: true }
        });
        if (!market || market.status !== MarketStatus.OPEN || market.closeTime <= new Date()) {
          throw new Error("market-closed");
        }
        if (!market.outcomes.some((outcome) => outcome.id === parsed.data.outcomeId)) {
          throw new Error("Invalid outcome.");
        }

        // Balance is re-checked inside the transaction and decremented atomically
        // so two quick predictions cannot spend the same credits twice.
        const balanceUpdate = await tx.user.updateMany({
          where: { id: user.id, balance: { gte: parsed.data.amount } },
          data: { balance: { decrement: parsed.data.amount } }
        });
        if (balanceUpdate.count !== 1) throw new Error("insufficient-credits");

        const prediction = await tx.prediction.create({
          data: {
            userId: user.id,
            marketId: parsed.data.marketId,
            outcomeId: parsed.data.outcomeId,
            amount: parsed.data.amount
          }
        });

        await tx.balanceTransaction.create({
          data: {
            userId: user.id,
            amount: -parsed.data.amount,
            type: BalanceTransactionType.STAKE,
            marketId: parsed.data.marketId,
            predictionId: prediction.id
          }
        });

        const predictions = await tx.prediction.findMany({
          where: { marketId: market.id }
        });
        const { totalPool, outcomeStats } = calculateOutcomePools(market.outcomes, predictions);

        // Odds history is stored as a display snapshot after each prediction,
        // preserving what friends saw over time without creating fixed odds.
        await tx.oddsSnapshot.createMany({
          data: buildOddsSnapshotRows(market.id, outcomeStats, totalPool)
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Error) actionError(path, error.message);
    actionError(path, "Prediction could not be placed.");
  }

  revalidatePath(path);
  actionSuccess(path, "prediction-placed");
}

export async function adjustBalanceAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = balanceAdjustmentSchema.safeParse({
    userId: formValue(formData, "userId"),
    amount: formValue(formData, "amount")
  });
  if (!parsed.success) actionError("/admin", parsed.error.issues[0]?.message ?? "Invalid adjustment.");

  try {
    await prisma.$transaction(
      async (tx) => {
        const amount = parsed.data.amount;
        const update =
          amount < 0
            ? await tx.user.updateMany({
                where: { id: parsed.data.userId, balance: { gte: Math.abs(amount) } },
                data: { balance: { decrement: Math.abs(amount) } }
              })
            : await tx.user.updateMany({
                where: { id: parsed.data.userId },
                data: { balance: { increment: amount } }
              });

        if (update.count !== 1) throw new Error("insufficient-credits");

        // Admin adjustments are deliberately separate from prediction profit/loss.
        await tx.balanceTransaction.create({
          data: {
            userId: parsed.data.userId,
            amount,
            type: BalanceTransactionType.ADMIN_ADJUSTMENT
          }
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Error) actionError("/admin", error.message);
    actionError("/admin", "Balance update failed.");
  }

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  actionSuccess("/admin", "balance-updated");
}

export async function resolveMarketAction(formData: FormData) {
  await requireAdmin();
  const parsed = resolveMarketSchema.safeParse({
    marketId: formValue(formData, "marketId"),
    winningOutcomeId: formValue(formData, "winningOutcomeId")
  });
  if (!parsed.success) actionError("/admin", "Invalid resolution.");

  try {
    await prisma.$transaction(
      async (tx) => {
        const market = await tx.market.findUnique({
          where: { id: parsed.data.marketId },
          include: { outcomes: true, predictions: { where: { status: PredictionStatus.ACTIVE } } }
        });
        if (!market) throw new Error("Market not found.");
        if (market.status === MarketStatus.RESOLVED) throw new Error("already-resolved");
        if (market.status === MarketStatus.CANCELLED) throw new Error("already-cancelled");
        if (!market.outcomes.some((outcome) => outcome.id === parsed.data.winningOutcomeId)) {
          throw new Error("Winning outcome must belong to this market.");
        }

        const statusUpdate = await tx.market.updateMany({
          where: { id: market.id, status: { in: [MarketStatus.OPEN, MarketStatus.CLOSED] } },
          data: {
            status: MarketStatus.RESOLVED,
            winningOutcomeId: parsed.data.winningOutcomeId,
            resolvedAt: new Date()
          }
        });
        if (statusUpdate.count !== 1) throw new Error("already-resolved");

        const totalPool = market.predictions.reduce((sum, prediction) => sum + prediction.amount, 0);
        const winningPredictions = market.predictions.filter(
          (prediction) => prediction.outcomeId === parsed.data.winningOutcomeId
        );
        const totalWinningStake = winningPredictions.reduce((sum, prediction) => sum + prediction.amount, 0);

        // Winning users split the credit pool proportionally. Credits are
        // integers, so largest-remainder rounding keeps the distributed total
        // exactly equal to the pool without introducing a house margin.
        const payouts = allocatePayouts(
          winningPredictions.map((prediction) => ({
            predictionId: prediction.id,
            userId: prediction.userId,
            amount: prediction.amount,
            createdAt: prediction.createdAt
          })),
          totalPool,
          totalWinningStake
        );

        for (const prediction of market.predictions) {
          await tx.prediction.update({
            where: { id: prediction.id },
            data: {
              status:
                prediction.outcomeId === parsed.data.winningOutcomeId
                  ? PredictionStatus.WON
                  : PredictionStatus.LOST
            }
          });
        }

        for (const payout of payouts) {
          if (payout.payout <= 0) continue;
          await tx.user.update({
            where: { id: payout.userId },
            data: { balance: { increment: payout.payout } }
          });
          await tx.balanceTransaction.create({
            data: {
              userId: payout.userId,
              amount: payout.payout,
              type: BalanceTransactionType.PAYOUT,
              marketId: market.id,
              predictionId: payout.predictionId
            }
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Error) actionError("/admin", error.message);
    actionError("/admin", "Market resolution failed.");
  }

  revalidatePath("/markets");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  actionSuccess("/admin", "market-resolved");
}

export async function cancelMarketAction(formData: FormData) {
  await requireAdmin();
  const parsed = marketIdSchema.safeParse({ marketId: formValue(formData, "marketId") });
  if (!parsed.success) actionError("/admin", "Invalid market.");

  try {
    await prisma.$transaction(
      async (tx) => {
        const market = await tx.market.findUnique({
          where: { id: parsed.data.marketId },
          include: { predictions: { where: { status: PredictionStatus.ACTIVE } } }
        });
        if (!market) throw new Error("Market not found.");
        if (market.status === MarketStatus.RESOLVED) throw new Error("already-resolved");
        if (market.status === MarketStatus.CANCELLED) throw new Error("already-cancelled");

        const statusUpdate = await tx.market.updateMany({
          where: { id: market.id, status: { in: [MarketStatus.OPEN, MarketStatus.CLOSED] } },
          data: { status: MarketStatus.CANCELLED, cancelledAt: new Date() }
        });
        if (statusUpdate.count !== 1) throw new Error("already-cancelled");

        // Cancelling returns every active credit stake exactly once. The
        // prediction status plus unique refund transaction make retries safe.
        for (const prediction of market.predictions) {
          await tx.user.update({
            where: { id: prediction.userId },
            data: { balance: { increment: prediction.amount } }
          });
          await tx.prediction.update({
            where: { id: prediction.id },
            data: { status: PredictionStatus.REFUNDED }
          });
          await tx.balanceTransaction.create({
            data: {
              userId: prediction.userId,
              amount: prediction.amount,
              type: BalanceTransactionType.REFUND,
              marketId: market.id,
              predictionId: prediction.id
            }
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Error) actionError("/admin", error.message);
    actionError("/admin", "Market cancellation failed.");
  }

  revalidatePath("/markets");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  actionSuccess("/admin", "market-cancelled");
}

export async function deleteMarketAction(formData: FormData) {
  await requireAdmin();
  const parsed = marketIdSchema.safeParse({ marketId: formValue(formData, "marketId") });
  if (!parsed.success) actionError("/admin", "Invalid market.");

  try {
    await prisma.$transaction(
      async (tx) => {
        const market = await tx.market.findUnique({
          where: { id: parsed.data.marketId },
          include: { predictions: true }
        });
        if (!market) throw new Error("Market not found.");

        // Permanent deletion removes prediction history for this market. Any
        // still-active stakes are refunded first so balances are not left short.
        const activePredictions = market.predictions.filter((prediction) => prediction.status === PredictionStatus.ACTIVE);
        for (const prediction of activePredictions) {
          await tx.user.update({
            where: { id: prediction.userId },
            data: { balance: { increment: prediction.amount } }
          });
        }

        const predictionIds = market.predictions.map((prediction) => prediction.id);
        await tx.balanceTransaction.deleteMany({
          where: predictionIds.length
            ? { OR: [{ marketId: market.id }, { predictionId: { in: predictionIds } }] }
            : { marketId: market.id }
        });
        await tx.prediction.deleteMany({ where: { marketId: market.id } });
        await tx.oddsSnapshot.deleteMany({ where: { marketId: market.id } });
        await tx.market.delete({ where: { id: market.id } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Error) actionError("/admin", error.message);
    actionError("/admin", "Market deletion failed.");
  }

  revalidatePath("/markets");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  actionSuccess("/admin", "market-deleted");
}
