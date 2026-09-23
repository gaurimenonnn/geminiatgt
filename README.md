# Gemini Campus Club @ Georgia Tech

Website for the Gemini Campus Club at Georgia Tech: workshops and events on Gemini, Gemini Notebook, and Gemini across Google Workspace. Led by Google Student Ambassadors Gauri Menon and Ishita Sukul.

## Run locally

Needs Node.js 20+.

```bash
npm install     # first time only
npm run dev     # then open http://localhost:8080
```

## Editing content

Almost everything on the page (events, team, use cases, FAQ, links) lives in **`public/club.json`**. Edit it and refresh; no code changes needed. Past events hide themselves automatically.

- **Headshots:** drop `gauri.jpg` and `ishita.jpg` into `public/assets/` (square, ~400px). Initials show until then.
- **Discord:** paste the invite link into `"discord"` in `club.json`. Until then the footer shows "Discord · coming soon".
- **Logos:** `public/assets/` holds web-sized copies (`gigi-buzz.png` nav logo, `gigi.png` chat avatar, `logo-text-black.png` footer, `gemini-spark.png` intro). Full-res originals live in `assets-src/` (gitignored).
- **Intro animation:** plays once per browser session (skipped for reduced-motion users). Open the site in a new tab to see it again.

## Gigi, the FAQ helper

The bubble in the bottom-right is **Gigi**, the club mascot. Gigi runs entirely in the browser (`localAnswer` in `public/app.js`): keyword rules for common questions (events, joining, socials, free Gemini), then a best match against the FAQ list in `club.json`. Adding an FAQ entry automatically teaches Gigi the answer.

## Deploy (Firebase Hosting)

The site is static, so it runs on Firebase Hosting's free plan with a custom domain and free SSL.

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # pick or create your Firebase project
firebase deploy --only hosting
```

Then in the Firebase console: Hosting → Add custom domain, and add the DNS records it gives you at your domain registrar (e.g. Cloudflare, with the proxy turned off for those records).
