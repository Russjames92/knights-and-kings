# Deploying Knights & Kings to Railway

## Prerequisites
- A Railway account (railway.app) on the Hobby plan ($5/mo)
- This repo connected to Railway via GitHub

## Step 1: Create a new Railway project
1. Go to railway.app and create a new project
2. Choose "Empty Project"

## Step 2: Add Postgres
1. Click "+ New" > "Database" > "PostgreSQL"
2. Railway auto-creates a `DATABASE_URL` variable

## Step 3: Add Redis
1. Click "+ New" > "Database" > "Redis"
2. Railway auto-creates a `REDIS_URL` variable

## Step 4: Deploy the API service
1. Click "+ New" > "GitHub Repo" > select `knights-and-kings`
2. In Settings:
   - Service Name: `api`
   - Build Command: `pnpm install && pnpm db:generate`
   - Start Command: `pnpm start:api`
3. In Variables, add:
   - `DATABASE_URL` — reference the Postgres service variable
   - `REDIS_URL` — reference the Redis service variable
   - `PORT` — `4000`
   - `NODE_ENV` — `production`
   - `NEXTAUTH_SECRET` — generate a random string (32+ chars)
4. Generate a public domain (Settings > Networking > Generate Domain)

## Step 5: Deploy the Worker service
1. Click "+ New" > "GitHub Repo" > select `knights-and-kings`
2. In Settings:
   - Service Name: `worker`
   - Build Command: `pnpm install && pnpm db:generate`
   - Start Command: `pnpm start:worker`
3. In Variables, add:
   - `DATABASE_URL` — reference the Postgres service variable
   - `REDIS_URL` — reference the Redis service variable
   - `NODE_ENV` — `production`
4. No public domain needed (worker is internal)

## Step 6: Deploy the Web service
1. Click "+ New" > "GitHub Repo" > select `knights-and-kings`
2. In Settings:
   - Service Name: `web`
   - Build Command: `pnpm install && pnpm build:web`
   - Start Command: `pnpm start:web`
3. In Variables, add:
   - `DATABASE_URL` — reference the Postgres service variable
   - `NEXT_PUBLIC_API_URL` — the API service's public URL (e.g., https://api-production-xxxx.up.railway.app)
   - `NEXTAUTH_URL` — the Web service's public URL
   - `NEXTAUTH_SECRET` — same secret as the API
   - `NEXT_PUBLIC_DEV_AUTH` — `true` (until OAuth is configured)
   - `NODE_ENV` — `production`
4. Generate a public domain

## Step 7: Initialize the database
1. Open the API service's terminal in Railway (or use `railway run`)
2. Run: `pnpm db:deploy` (pushes the schema to Postgres)
3. Run: `pnpm db:seed` (seeds initial card templates and regions)

## Step 8: Access your game
Open the Web service's public URL in your browser!

## Environment Variable Reference
| Variable | Service | Description |
|----------|---------|-------------|
| DATABASE_URL | api, worker, web | Postgres connection string |
| REDIS_URL | api, worker | Redis connection string |
| PORT | api (4000), web (auto) | Service port |
| NEXT_PUBLIC_API_URL | web | API service public URL |
| NEXTAUTH_URL | web | Web service public URL |
| NEXTAUTH_SECRET | api, web | Shared secret for JWT auth |
| NEXT_PUBLIC_DEV_AUTH | web | Enable dev login (true/false) |
| WEB_URL | api | Web service URL for CORS |
