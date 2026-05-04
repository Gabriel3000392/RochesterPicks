import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters."),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DEFAULT_ADMIN_EMAIL: z.string().email().default("admin@example.test"),
  DEFAULT_ADMIN_NAME: z.string().trim().min(1).default("Admin"),
  DEFAULT_ADMIN_PASSWORD: z.string().min(8).default("ChangeMeFake123!")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/fake_markets?schema=public",
  AUTH_SECRET: process.env.AUTH_SECRET,
  APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? "admin@example.test",
  DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME ?? "Admin",
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ?? "ChangeMeFake123!"
});
