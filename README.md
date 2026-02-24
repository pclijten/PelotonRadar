# PelotonRadar on Vercel (Free)

This is a Next.js (App Router) + Prisma + Postgres backend that:
- stores riders, races, watchlist
- checks FirstCycling startlists + results
- emails you on startlist detection and results

## 1) Create a free Postgres DB
Recommended: Supabase or Neon.
Copy the connection string into `DATABASE_URL` (with sslmode=require if needed).

## 2) Deploy to Vercel
- Import this repo in Vercel
- Set env vars (Project Settings → Environment Variables):
  - DATABASE_URL
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO
  - (optional) CRON_SECRET

## 3) Prisma migrate
In Vercel, add a one-time command locally:
```bash
npm install
npx prisma migrate dev --name init
```
For production, you can run:
```bash
npx prisma migrate deploy
```
(You may also run migrations via a CI step; simplest is local migrate before first deploy.)

## 4) Vercel Cron
`vercel.json` schedules `/api/run-check` every 15 minutes.

If you set `CRON_SECRET`, add it in Vercel Cron request headers by switching to Vercel Cron UI (or call with header manually).
This project also supports GET/POST on /api/run-check.

## API
- POST /api/riders { name, fcRiderId }
- GET /api/riders
- POST /api/races { name, fcRaceId, year }
- GET /api/races
- POST /api/watchlist { riderId, raceId }
- GET /api/riders/:id/history
