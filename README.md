# Content Hub — huugly

A private, self-hosted content curation and idea management app. Track creators across YouTube, X, and websites. Get AI-generated content ideas. Build posts in a Kanban board. Export to JSON for Claude Code handoff.

---

## What this app does

1. **Watchlist** — Add YouTube channels, X profiles, and websites to track
2. **Feed** — See recent content from all sources, grouped by platform and recency. AI (Claude Haiku) automatically generates 2 content ideas per item
3. **Post Builder** — Kanban board where you save ideas, organised by target platform (LinkedIn, X, YouTube, Instagram, Newsletter). Export all ideas as JSON for pasting into Claude Code

This replaces and upgrades the Python-based `huugly/content-radar/` tool with a proper web interface, database, and AI integration.

---

## One-time setup

### 1. Supabase project

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial.sql`
3. Copy your project URL and API keys from **Settings → API**
4. In **Authentication → URL Configuration**, add your app URL (e.g. `https://your-app.vercel.app`) to "Site URL" and `https://your-app.vercel.app/**` to "Redirect URLs". Also add `http://localhost:3000/**` for local dev.
5. In **Authentication → Email**, enable "Magic Link" (it's on by default)
6. Since there's no sign-up flow, you need to **manually create your user**: go to **Authentication → Users** → "Invite user" → enter your email. This triggers the `on_auth_user_created` trigger that creates the profile and settings rows.

### 2. YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable **YouTube Data API v3**
4. Create an API key under **Credentials**
5. Restrict it to YouTube Data API v3 for security

### 3. Anthropic API key

Get your API key from [console.anthropic.com](https://console.anthropic.com/). The app uses `claude-haiku-4-5-20251001` for cost-effective idea generation.

### 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (**never expose to browser**) |
| `OWNER_EMAIL` | Your email — the only address that can log in |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `CRON_SECRET` | Random string for GitHub Actions auth (run `openssl rand -hex 32`) |
| `RSSHUB_BASE_URL` | RSSHub instance URL (see X feeds section below) |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL (no trailing slash) |

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`. Enter your email and click "Send magic link".

---

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Set all environment variables in **Vercel Dashboard → Settings → Environment Variables**:
   - `NEXT_PUBLIC_*` vars → all environments
   - `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `YOUTUBE_API_KEY` → Production only (server-side, never exposed to browser)
4. Deploy

---

## GitHub Actions — automated daily fetch

The workflow in `.github/workflows/daily-fetch.yml` runs every hour. It calls `/api/fetch-all` with the cron secret. The API route checks the fetch schedule stored in the database and only runs a full fetch at your configured UTC hour.

**Set these secrets in your GitHub repo** (Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `APP_URL` | Your Vercel app URL, e.g. `https://your-app.vercel.app` |
| `CRON_SECRET` | Same value as your `CRON_SECRET` env var |

### Changing the fetch time

Go to the app → click the **gear icon** in the sidebar footer → change "Daily fetch time" → Save. No redeploy needed. GitHub Actions checks every hour; your setting controls when the full fetch actually runs.

---

## X (Twitter) feeds via RSSHub

X feeds are fetched using [RSSHub](https://docs.rsshub.app/), which converts X profiles into RSS feeds.

**Option A: Public instance** (default, `https://rsshub.app`)
- Free, no setup needed
- Rate-limited and sometimes unreliable
- Set `RSSHUB_BASE_URL=https://rsshub.app`

**Option B: Self-hosted** (recommended for reliability)
- Deploy your own RSSHub: [docs.rsshub.app/deploy](https://docs.rsshub.app/deploy/)
- Set `RSSHUB_BASE_URL=https://your-rsshub-instance.com`

---

## Using the JSON export with Claude Code

In the **Post Builder**, click **"Copy board JSON"**. This copies a structured JSON payload to your clipboard with all your ideas and source metadata.

Paste this into Claude Code with a prompt like:

> Here are my content ideas. Write a LinkedIn post based on the first idea. Match my brand voice from `_shared/brand-voice.md`.

The JSON format is:
```json
{
  "export_date": "2025-01-15",
  "platform_filter": "all",
  "ideas": [
    {
      "id": "uuid",
      "idea": "The full idea text",
      "target_platform": "linkedin",
      "status": "backlog",
      "source": {
        "creator": "Creator Name",
        "title": "Original content title",
        "url": "https://...",
        "platform": "youtube",
        "published_at": "2025-01-12"
      }
    }
  ]
}
```

---

## How to run

```bash
# Install
npm install

# Development
npm run dev

# Production build check
npm run build

# Start production server
npm start
```
