# Gemini @ GT

Website for Georgia Tech's Gemini campus club: workshops and events on Gemini, NotebookLM, and Gemini across Google Workspace. Led by Google Student Ambassadors Gauri Menon and Ishita Sukul.

## Run locally

```bash
npm install
cp .env.example .env   # optional: add a GEMINI_API_KEY for the live chatbot
npm run dev            # http://localhost:8080
```

## Editing content

Almost everything on the page (events, team, use cases, FAQ, contact) lives in **`public/club.json`**. Edit it and refresh; no code changes needed. Past events hide themselves automatically.

- **Headshots:** drop `gauri.jpg` and `ishita.jpg` into `public/assets/` (square, ~400px). Initials show until then.
- **Logo:** replace the sparkle `<svg class="brand-mark">` in the nav/footer of `public/index.html` with an `<img>`.
- **Join link / email:** `joinUrl` and `contactEmail` in `club.json`.

## Gem, the chatbot

The bubble in the bottom-right is **Gem**. `POST /api/chat` in `server.js` sends the conversation to the Gemini API, with `club.json` injected as the system prompt, so Gem only knows what's on the site and stays up to date when you edit the JSON. The API key stays on the server, and each IP is rate-limited to 12 messages a minute.

With no `GEMINI_API_KEY` (or when hosted as static files), Gem falls back to a built-in keyword FAQ in `public/app.js`, so the site never shows a broken bot.

## Deploy (Cloud Run)

```bash
gcloud run deploy geminiatgt --source . --region us-east1 --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```
