# Job Tracker

A pipeline tracker for people applying to a lot of jobs and internships at once. A kanban board shows where every application stands. A strip above it tells you what needs action today: who to follow up with, which applications have gone quiet, and which OA deadlines or interviews are coming up.

Built for the Groww product hiring task. It runs entirely in the browser: no backend, no login, and all data stays in `localStorage`.

## What's in it

- **Board (`/`)**: six columns (Wishlist → Applied → OA → Interview → Offer → Rejected). You can drag cards between columns or reorder them within one. Every stage change is stamped with the date it happened. On a phone, press and hold a card to drag it, or change the stage from the detail panel.
- **Needs-attention strip**: shows applications sitting in Applied for 7+ days (follow up), for 14+ days (stale), and any OA deadline or interview in the next 7 days. Click a pill to see the list, then click a row to open that application.
- **Quick add**: only company and role are required, and Enter saves. Press `N` anywhere to open it.
- **Detail panel**: every field can be edited in place. It also has a stage timeline with the gap between stages, a per-application prep checklist, notes that save as you type, a link to the posting, an optional "next date" (OA deadline / interview), and delete with confirmation.
- **Filters**: search by company or role, plus stage, priority, source and date range (last 7, 30 or 90 days). Different filters combine with AND. Multiple values inside one filter combine with OR.
- **Analytics (`/analytics`)**: total, response rate, offer rate, average days in pipeline, applications per stage, applications by source, and the average days between each stage change.
- **Settings (`/settings`)**: an optional name (the header reads "Job Tracker", or "{Name}'s Job Tracker" once set), resume versions, JSON export/import, and a reset back to the demo data.

## How the numbers are worked out

- **Total applications** counts everything past Wishlist. Wishlist items aren't applications yet, so they're shown separately.
- **Response rate** is the share of submitted applications that reached OA, Interview or Offer at any point. This includes ones that were rejected after an OA.
- **Offer rate** is offers ÷ submitted applications.
- **Avg. days in pipeline** runs from the first stage date to today for open applications, and to the closing date for offers and rejections.

Each stat card shows its raw counts (e.g. "5 of 7 got an OA or interview"), so you can check the maths by hand.

## About the demo data

The eight seed applications match the brief: same companies, stages, priorities, sources and gaps between stage dates. The only difference is that the whole timeline is moved forward so the newest entry is 9 days old on the day you first open the app. Left on the original Nov 2024 dates, every Applied card would be two years old and the alert strip would have nothing useful to show.

Razorpay also gets an OA deadline of "tomorrow", so the This Week alert has something real in it. **Settings → Reset** rebuilds the demo relative to the current day.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

`dist/` deploys as-is to Netlify, Vercel or any static host. `_redirects` and `vercel.json` are already included so `/analytics` and `/settings` work on refresh.

`npm run build:single` produces one self-contained `dist-single/index.html` that uses hash routes (`#/analytics`). This is handy where URL rewrites aren't available.

## Stack

React 18 + TypeScript, Vite, Tailwind CSS, @dnd-kit (drag and drop), React Router, Recharts, Lucide icons.

```
src/
  lib/          constants, dates, seed data, storage + import validation, alerts/analytics maths, filters
  store/        app data (reducer + localStorage sync) and UI state (drawer, modal, toasts)
  components/   board, card, alert strip, filter bar, quick-add modal, detail drawer, dialogs
  pages/        Board, Analytics, Settings
```

## Deliberately left out

As scoped in the brief: LinkedIn integration of any kind, email scraping, calendar sync, auto-apply, AI resume tools, accounts or multi-user use, push notifications, and a backend. The job URL is pasted in by hand and saved as a link.
