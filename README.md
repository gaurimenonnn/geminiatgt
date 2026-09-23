# Gemini Campus Club @ Georgia Tech

Website for the Gemini Campus Club at Georgia Tech: workshops and events on Gemini, Gemini Notebook, and Gemini across Google Workspace. Led by Google Student Ambassadors Gauri Menon and Ishita Sukul.

## Run locally

```bash
npm install            # first time only
cp .env.example .env   # optional: add a GEMINI_API_KEY for the live chatbot
npm run dev            # then open http://localhost:8080
```

## Editing content

Almost everything on the page (events, team, use cases, FAQ, contact) lives in **`public/club.json`**. Edit it and refresh; no code changes needed. Past events hide themselves automatically.

- **Headshots:** drop `gauri.jpg` and `ishita.jpg` into `public/assets/` (square, ~400px). Initials show until then.
- **Logos:** `public/assets/` holds web-sized copies (`gigi-buzz.png` nav logo, `gigi.png` chat avatar, `logo-text-black.png` footer, `gemini-spark.png` intro). Full-res originals live in `assets-src/` (gitignored).
- **Intro animation:** plays once per browser session (skipped for reduced-motion users). To replay, open the site in a new tab/window or clear session storage.
- **Join link / email:** `joinUrl` and `contactEmail` in `club.json`.

## Gigi, the chatbot

The bubble in the bottom-right is **Gigi**, the club mascot. `POST /api/chat` in `server.js` sends the conversation to the Gemini API, with `club.json` injected as the system prompt, so Gem only knows what's on the site and stays up to date when you edit the JSON. The API key stays on the server, and each IP is rate-limited to 12 messages a minute.

With no `GEMINI_API_KEY` (or when hosted as static files), Gigi falls back to a built-in keyword FAQ in `public/app.js`, so the site never shows a broken bot.

## Deploy (Cloud Run)

```bash
gcloud run deploy geminiatgt --source . --region us-east1 --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```
