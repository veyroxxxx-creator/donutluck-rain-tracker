# DonutLuck Rain Tracker

A live dashboard for the DonutLuck Rain event — a real-time countdown, participant/prize stats,
and configurable browser notifications + alarm sounds when a new rain event starts.

Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Features

- Live status pulled from the DonutLuck rain API, polled every 7 seconds
- A smooth, second-by-second countdown that runs entirely in the browser between polls, anchored
  to timestamps so it stays accurate even if the tab is throttled or backgrounded
- Browser notifications and a custom/default alarm sound, triggered exactly once per new rain
  event (not once per poll)
- Optional push notifications (via a service worker + server) that arrive even when the tab isn't
  open — needs a small amount of setup, see "Push notifications: setup" below
- Upload your own alarm sound (MP3/WAV/OGG), stored locally in IndexedDB — never uploaded anywhere
- Two polished themes: Cream White and Black Purple, persisted across reloads
- Graceful handling of API downtime: a visible connection status, retries with backoff, and the
  UI never crashes on a failed fetch
- Installable as a PWA
- Fully responsive, keyboard-accessible, semantic HTML

## How to install

Requires Node.js 18.18+ and npm.

```bash
npm install
```

## How to run locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Other useful scripts:

```bash
npm run build      # production build
npm run start       # run the production build locally
npm run lint         # lint
npm run typecheck   # TypeScript check with no output
```

## How the API works

The dashboard's source of truth is:

```
https://donutluck.com/api/chat/rain/state
```

which currently returns:

```json
{
  "active": false,
  "time_remaining": 658,
  "participants_count": 0,
  "prize": 545862489
}
```

**The browser never calls that URL directly.** Instead:

1. The client polls our own same-origin route, `GET /api/rain`
   (`src/app/api/rain/route.ts`), every `POLL_INTERVAL_MS` (7s, see
   `src/lib/constants.ts`).
2. That route fetches `donutluck.com` server-side and returns the JSON as-is. This sidesteps any
   CORS restriction the upstream API might apply, and keeps the upstream URL out of the browser's
   network tab beyond one internal hop.
3. All client-side fetching logic — including retries with exponential backoff — lives in
   `src/services/donutluck.ts`. Nothing else in the app calls `fetch` for rain data directly.

**Countdown logic:** when a fresh snapshot arrives, the client computes
`targetAt = receivedAt + time_remaining * 1000` and stores that single timestamp
(`src/context/RainContext.tsx`). The on-screen timer (`src/hooks/useCountdown.ts`) recomputes
`targetAt - Date.now()` once a second — it never just decrements a counter — so a throttled or
backgrounded tab snaps back to the correct value the instant it's active again, instead of
drifting. `time_remaining` is treated the same way regardless of `active`: when rain is active
it's time until it ends; when inactive it's time until the next event, if the API is providing
one. No other meaning is assumed for it, and no fields beyond the four documented ones are read.

**Connection status** cycles through `connecting → connected → degraded → offline` based on how
long it's been since the last successful poll, and the UI shows a subtle badge for it at all
times without ever crashing on a failed request.

## How notifications work

There are two layers here, and it's worth understanding both:

**Tab-open notifications (always available, no setup):** With the "Rain alerts" and "Browser
notifications" toggles on, the app requests Notification permission and fires a notification (plus,
if enabled, the alarm sound) the moment it detects `active` flip from `false` to `true`
(`src/context/RainContext.tsx`) — exactly once per event, never repeating while `active` stays
`true`. This only works while the tab is open and its poll loop is running, which browsers
throttle once a tab is backgrounded (e.g. you've switched to another tab) — so it can be delayed,
and won't fire at all if the tab/browser is closed.

**Push notifications (optional, needs setup — see below):** These arrive as real OS notifications
sent by a server, so they work even if this tab isn't open at all. A service worker
(`public/sw.js`) receives the push and calls `showNotification()`. When both are active for the
same event, the app skips the tab-open notification to avoid a duplicate
(`src/context/RainContext.tsx`, gated on `pushStatus === 'subscribed'`) — the sound alarm still
only plays if the tab happens to be open, since push payloads can't carry a custom sound.

"Test notification" and "Test alarm" buttons on the Alerts and Settings pages test the tab-open
path without waiting for a real event.

## Push notifications: setup

This is the part that makes alerts reliable even when you're on another tab (or the browser is
closed). It needs three things, all free-tier friendly except the scheduling step:

**1. Generate VAPID keys** (identifies this app to browsers' push services):

```bash
npm run generate-vapid-keys
```

Put the public key in both `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PUBLIC_KEY`, and the private
key in `VAPID_PRIVATE_KEY`. Set `VAPID_SUBJECT` to `mailto:you@example.com` (any contact the push
services can use if they need to reach you). See `.env.example`.

**2. Add Redis storage for subscriptions** (a serverless function can't remember who subscribed
between requests, so this needs to live somewhere):

- In your Vercel project, go to **Storage → Browse → Upstash for Redis → Create**, on the free
  tier.
- Copy the REST URL/token it gives you into `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN`.

**3. Set up something to check for rain periodically and trigger the push.**
`GET /api/push/check` (`src/app/api/push/check/route.ts`) does the actual work: it fetches the
rain state, compares it to the last known state (in Redis), and — only on a `false → true`
transition — sends a push to every stored subscription via `web-push`, cleaning up any
subscription the push service reports as expired (404/410).

That route is authorized by a secret (`CRON_SECRET` — set it to any long random string) sent
either as `Authorization: Bearer <secret>` or `?secret=<secret>`. It refuses to run at all if
`CRON_SECRET` isn't set, so nothing calls it by accident. You have two ways to trigger it on a
schedule:

- **Vercel Cron, if you're on the Pro plan** ($20/mo): add to `vercel.json`
  ```json
  {
    "crons": [{ "path": "/api/push/check", "schedule": "* * * * *" }]
  }
  ```
  Vercel injects `CRON_SECRET` and sends it automatically as the `Authorization` header — you
  still need to set the same `CRON_SECRET` value as an env var yourself for the route to check
  against. **Don't add this on the free Hobby plan** — Hobby caps cron at once a day, and
  Vercel will refuse to deploy a more frequent schedule.
- **A free external scheduler, on any Vercel plan** — e.g. [cron-job.org](https://cron-job.org):
  create a job that hits `https://<your-domain>/api/push/check?secret=<your CRON_SECRET>` (or
  set the `Authorization` header instead, if the service supports custom headers, so the secret
  isn't sitting in a URL) once a minute.

Once all three are set and deployed, "Browser notifications" in Settings will show "push enabled"
instead of just "enabled for this tab" — that's your confirmation it's actually wired up, not
just falling back to the tab-open path.

**If you skip this section entirely:** the app still works — notifications and sound alerts just
require the tab to be open, same as before.

## How custom sounds are stored

- Uploaded sounds (MP3, WAV, OGG) are saved to **IndexedDB**, in this browser only
  (`src/lib/indexedDb.ts`) — they are never sent to any server.
- A default alarm tone (`public/sounds/default-alarm.wav`) is used until you upload your own.
- You can preview the current sound, upload a replacement, or remove a custom sound to fall back
  to the default, all from Settings.
- Browsers block audio autoplay until a user gesture has occurred on the page. The first time you
  click "Test alarm" (or trigger any alert-related interaction), playback is unlocked for the
  rest of the session, so a real rain-start alert can play automatically afterward. If a browser
  still blocks it, the UI surfaces a clear message rather than failing silently.
- This only applies to the tab-open alarm sound — push notifications use the browser/OS's own
  notification sound, since push payloads can't include custom audio.

## Themes

- **Cream White** — warm cream backgrounds, soft shadows, subtle beige gradients, dark charcoal
  text.
- **Black Purple** — deep black backgrounds, purple accents and glow, white/muted-gray text.

Both are defined as CSS variables in `src/app/globals.css` and switched via a `data-theme`
attribute on `<html>`, with a smooth transition. The selected theme is saved to `localStorage`
and restored on reload.

## Project structure

```
src/
  app/                 routes: dashboard, alerts, settings, about
                        /api/rain         browser-facing rain-state proxy
                        /api/push/subscribe   save/remove a push subscription
                        /api/push/check       scheduled: detect new rain, send pushes
  components/          UI components
  context/             SettingsContext (preferences), PushContext (push subscription),
                        RainContext (polling/state)
  hooks/               useCountdown, useAlarmSound, useLocalStorage, useNowTick
  services/donutluck.ts   the only place that fetches rain data client-side
  lib/                 constants, formatters, IndexedDB wrapper, notifications helper,
                        rainSource (shared upstream fetch), redis, pushStore, pushClient
  types/rain.ts        API response type + runtime type guard
public/
  icons/               favicon, PWA icons, Open Graph image
  sounds/              default alarm tone
  sw.js                service worker (push notifications)
  manifest.json        PWA manifest
```

## Deploying to Vercel

1. Push this project to a Git repository (GitHub, GitLab, or Bitbucket).
2. In Vercel, choose **Add New → Project** and import the repository. Vercel auto-detects
   Next.js — no build configuration is needed.
3. The dashboard itself needs no environment variables or API keys — the DonutLuck endpoint is
   public. If you also want push notifications, set the variables in `.env.example` (see "Push
   notifications: setup" above) in the Vercel project's **Settings → Environment Variables**
   before or after the first deploy.
4. Deploy.

## Connecting the custom domain (donutluckraintracker.com)

1. In the Vercel project, open **Settings → Domains**.
2. Add `donutluckraintracker.com` (and optionally `www.donutluckraintracker.com`, redirecting to
   the apex or vice versa).
3. Vercel will show the DNS records to add at your domain registrar:
   - For the apex domain, add an **A record** pointing to Vercel's IP (Vercel shows the exact
     value in the dashboard), or use Vercel's recommended **ALIAS/ANAME** if your registrar
     supports it.
   - For `www`, add a **CNAME record** pointing to `cname.vercel-dns.com`.
4. Wait for DNS propagation (usually minutes, occasionally longer) — Vercel will show the domain
   as "Valid" once it's live, and automatically provisions an SSL certificate.

## Notes on testing

This project was developed and reviewed in a sandboxed environment without outbound package-
registry access, so `npm install` / `next build` could not be executed here. Before relying on it
in production, run locally:

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

The live API call, JSON shape, countdown math, single-fire alert logic, and WAV file were each
verified independently during development. The VAPID-key base64url decoding used by the push
subscription flow was also verified against Node's own base64url encoder as ground truth. What
could **not** be verified here, for lack of a real deployment, database, or push-capable browser
to test against: an actual end-to-end push send (subscribe → `/api/push/check` → real
notification arriving), the Upstash Redis calls, and the service worker's behavior in a real
browser. Please test the full push flow for real after deploying — subscribe from a real browser,
then hit `/api/push/check?secret=...` manually (or wait for your scheduler) and confirm a
notification actually arrives — before depending on it.
