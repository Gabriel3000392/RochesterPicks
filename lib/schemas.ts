import { MarketType } from "@prisma/client";
import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

export const registerSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2).max(80),
  password: passwordSchema,
  inviteCode: z.string().trim().min(2).max(80)
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1)
});

export const adminCreateUserSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2).max(80),
  password: passwordSchema
});

export const inviteIdSchema = z.object({
  inviteId: z.string().min(1)
});

export const userIdSchema = z.object({
  userId: z.string().min(1)
});

export const editUserNameSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2).max(80)
});

export const inviteCodeSchema = z.object({
  code: z.string().trim().min(3).max(80),
  maxUses: z.coerce.number().int().min(1).max(1000),
  expiresAt: z.string().trim().optional()
});

export const marketSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(1).max(2000),
  category: z.string().trim().min(2).max(80),
  type: z.nativeEnum(MarketType),
  closeTime: z.string().min(1),
  outcomes: z
    .string()
    .transform((value) =>
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.string().min(1).max(80)).min(2).max(12))
});

export const predictionSchema = z.object({
  marketId: z.string().min(1),
  outcomeId: z.string().min(1),
  amount: z.coerce.number().int().positive("Stake must be a positive whole number.")
});

export const balanceAdjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int().refine((amount) => amount !== 0, "Adjustment cannot be zero.")
});

export const resolveMarketSchema = z.object({
  marketId: z.string().min(1),
  winningOutcomeId: z.string().min(1)
});

export const marketIdSchema = z.object({
  marketId: z.string().min(1)
});
