# Rochester Picks

Rochester Picks is a self-hosted, invite-only sports prediction market app for friends using credits and leaderboard points.

This project has no real-money functionality. It does not support deposits, withdrawals, cash value, crypto, prizes, payment processing, bookmaker margins, house profit, or external gambling integrations.

## Configure

Copy `.env.example` to `.env` and change the values:

```bash
DATABASE_URL="postgresql://postgres:postgres@db:5432/fake_markets?schema=public"
AUTH_SECRET="replace-this-with-at-least-32-random-characters"
APP_URL="http://localhost:3000"
DEFAULT_ADMIN_EMAIL="admin@example.test"
DEFAULT_ADMIN_NAME="Rochester Admin"
DEFAULT_ADMIN_PASSWORD="ChangeMeFake123!"
```

Change the default admin password immediately after first login.

## Run With Docker

```bash
docker compose up -d
```

The app listens at [http://localhost:3000](http://localhost:3000). The app container runs Prisma migrations and the seed script on startup.

Default admin login:

- Email: `admin@example.test`, unless changed in `.env`
- Name: `Rochester Admin`, unless changed in `.env`
- Password: `ChangeMeFake123!`, unless changed in `.env`

## Local Development

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

For local development outside Docker, set `DATABASE_URL` to a reachable PostgreSQL database.

## Common Workflows

- Create users: login as admin, create invite codes from `/admin`, then share a code with a friend. Registration is blocked without a valid, unexpired code with remaining uses.
- Cancel invite codes: login as admin and use **Cancel** next to an active invite code. Cancelled codes cannot create accounts.
- Add or remove players: login as admin and use **Add player** or **Remove** in `/admin`. Removing a player deactivates their account so prediction history stays intact.
- Create a market: go to `/admin`, choose **New market**, enter the title, sport/category, close time, and outcomes.
- Add credits: in `/admin`, enter a positive or negative integer next to a user. Admin adjustments are shown separately from prediction profit/loss.
- Place predictions: users open `/markets`, pick a market, choose an outcome, and stake credits. Stakes are deducted immediately.
- Resolve a market: in `/admin`, select the winning outcome and resolve. Winners split the credit pool proportionally.
- Cancel a market: in `/admin`, choose **Cancel and refund**. Active stakes are returned exactly once.

## Odds

Odds are credit parimutuel display odds only:

- `totalPool = total credits staked on all outcomes`
- `outcomePool = total credits staked on one outcome`
- `impliedProbability = outcomePool / totalPool`
- `decimalOdds = totalPool / outcomePool`

When the total pool is zero, the app shows equal probabilities across all outcomes and avoids division by zero. No margin or house edge is added.

## Testing

Automated math tests:

```bash
npm test
```

Manual checklist:

- Register with a valid invite code.
- Block registration with an invalid invite code.
- Block expired or fully used invite codes.
- Login as admin and create a market.
- Add credits to a user.
- Place a valid prediction.
- Block staking more credits than the user has.
- Block zero or negative stakes.
- Block predictions after close time.
- Confirm odds update from credit pools.
- Resolve a market and confirm balances/leaderboard update.
- Retry resolution and confirm users are not paid twice.
- Cancel a market and confirm active stakes are refunded.
- Retry cancellation and confirm users are not refunded twice.
- Confirm normal users cannot access `/admin` pages.

## Production Notes

- Use a strong `AUTH_SECRET`.
- Change the seeded admin password.
- Keep PostgreSQL data on the persistent Docker volume.
- Put the app behind HTTPS in production so secure cookies are protected.
- Keep all wording and workflows credits-only with no real-money functionality.
"# RochesterPicks" 
