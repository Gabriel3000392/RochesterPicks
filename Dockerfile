FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fake_markets?schema=public
ENV AUTH_SECRET=build-time-placeholder-secret-with-32-characters
ENV APP_URL=http://localhost:3000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node server.js"]
