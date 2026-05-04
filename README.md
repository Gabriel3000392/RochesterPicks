# Rochester Picks

Rochester Picks is a self-hosted, invite-only sports prediction market app for friends using credits and leaderboard points.

This app is for private play only. It has no real-money functionality and does not support deposits, withdrawals, cash value, crypto, prizes, payment processing, bookmaker margins, house profit, or external gambling integrations.

## Features

- Invite-only registration with cancellable invite codes
- Admin-created players with editable names and balances
- User/admin roles with server-side admin protection
- Sports prediction markets with Yes/No or multiple-choice outcomes
- Credit staking with parimutuel-style display odds
- Odds history graphs on market pages
- Market close, resolve, cancel/refund, and permanent delete tools
- Mobile-friendly market pages and leaderboard
- PostgreSQL + Prisma with Docker Compose

## Environment

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/fake_markets?schema=public"
AUTH_SECRET="replace-this-with-at-least-32-random-characters"
APP_URL="https://your-domain.duckdns.org"
DEFAULT_ADMIN_EMAIL="admin@example.test"
DEFAULT_ADMIN_NAME="Rochester Admin"
DEFAULT_ADMIN_PASSWORD="ChangeMeFake123!"
```

Generate a strong secret:

```bash
openssl rand -base64 32
```

Change the default admin password after first login.

## Run From Docker Hub

Use this style on your server after pushing the image to Docker Hub:

```yaml
services:
  app:
    image: gabriel3003456345/rochester-picks:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      AUTH_SECRET: ${AUTH_SECRET}
      APP_URL: ${APP_URL}
      DEFAULT_ADMIN_EMAIL: ${DEFAULT_ADMIN_EMAIL}
      DEFAULT_ADMIN_NAME: ${DEFAULT_ADMIN_NAME}
      DEFAULT_ADMIN_PASSWORD: ${DEFAULT_ADMIN_PASSWORD}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fake_markets
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d fake_markets"]
      interval: 5s
      timeout: 5s
      retries: 20

volumes:
  postgres_data:
```

Start or update:

```bash
docker compose pull
docker compose up -d
```

## HTTPS With DuckDNS And Nginx Proxy Manager

1. Create a DuckDNS name, for example `rochesterpicks.duckdns.org`.
2. Forward router ports `80` and `443` to Nginx Proxy Manager.
3. Add a proxy host:
   - Domain: `rochesterpicks.duckdns.org`
   - Scheme: `http`
   - Forward host/IP: your app server IP
   - Forward port: `3000`
   - Enable Websockets Support and Block Common Exploits
4. Request a Let's Encrypt certificate in the SSL tab.
5. Set:

```env
APP_URL="https://rochesterpicks.duckdns.org"
```

Then restart:

```bash
docker compose up -d
```

Use the HTTPS URL. Production cookies are secure, so plain HTTP can cause button clicks to send you back to login.

## Admin Workflows

- Add players from `/admin`; new players start with `0` credits.
- Edit player names from `/admin`.
- Adjust player credits with positive or negative integers.
- Create, cancel, or reactivate invite access through invite codes.
- Create, edit, close, resolve, cancel/refund, or permanently delete markets.
- Permanent market delete removes that market's predictions, odds history, and related activity records. Active stakes are refunded first.

## Odds

Odds are credit parimutuel display odds only:

- `totalPool = total credits staked on all outcomes`
- `outcomePool = total credits staked on one outcome`
- `impliedProbability = outcomePool / totalPool`
- `decimalOdds = totalPool / outcomePool`

When the total pool is zero, the app shows equal probabilities across outcomes. No margin or house edge is added.

## Local Development

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

For local development outside Docker, set `DATABASE_URL` to a reachable PostgreSQL database.

## Testing

```bash
npm test
npm run lint
```

Manual checks:

- Register with a valid invite code.
- Block invalid, expired, cancelled, or fully used invite codes.
- Login as admin and create a market.
- Add credits to a user.
- Place a valid prediction.
- Block over-staking and zero/negative stakes.
- Block predictions after close time.
- Confirm odds and odds history update after predictions.
- Resolve a market and confirm balances/leaderboard update.
- Confirm double resolution does not pay twice.
- Cancel a market and confirm active stakes are refunded once.
- Confirm normal users cannot access admin pages.

## Backups

Back up PostgreSQL:

```bash
docker compose exec db pg_dump -U postgres fake_markets > rochester-picks-backup.sql
```

Keep the `postgres_data` Docker volume safe. It contains your app data.
