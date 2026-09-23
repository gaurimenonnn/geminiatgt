import dotenv from 'dotenv';
import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.GEMINI_API_KEY;
// Floating alias: pinned versions like gemini-2.5-flash get retired for new keys.
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const loadClub = () => JSON.parse(readFileSync(path.join(__dirname, 'public/club.json'), 'utf8'));

function systemPrompt(club) {
  return `You are "Gigi", the club's mascot (a cheerful Gemini-colored bee) and the friendly assistant on the website of ${club.name}, a student club at Georgia Tech.
Answer questions about the club using ONLY the club info below. Keep answers short (1–3 sentences), warm, and a little playful. An occasional bee pun is welcome, but don't overdo it.
If asked something the info doesn't cover, say you're not sure and suggest emailing ${club.contactEmail}.
"Gemini Notebook" is the official new name for NotebookLM; always call it Gemini Notebook.
If students ask about getting Gemini, point them to the free-for-a-year student offer at ${club.studentOffer.url}.
You may briefly explain what Gemini, Gemini Notebook, or a Google Workspace integration does in general if a student asks, but always tie it back to the club.
Never invent event dates, locations, or people. Plain text only, no markdown headings.
Today's date is ${new Date().toISOString().slice(0, 10)}.

CLUB INFO (JSON):
${JSON.stringify(club)}`;
}

// Tiny per-IP limiter so a public page can't drain the free-tier quota.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 12;
}

const app = express();
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const history = Array.isArray(req.body?.messages) ? req.body.messages.slice(-10) : [];
  const contents = history
    .filter((m) => typeof m?.text === 'string' && m.text.trim())
    .map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text.slice(0, 1000) }],
    }));
  if (!contents.length) return res.status(400).json({ error: 'No message' });

  // No key → the client falls back to its built-in FAQ matcher.
  if (!API_KEY) return res.status(503).json({ error: 'demo' });
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'Slow down a sec!' });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt(loadClub()) }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );
    const data = await r.json();
    if (!r.ok) {
      console.error('Gemini error', r.status, data?.error?.message);
      return res.status(502).json({ error: 'upstream' });
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    res.json({ text: text.trim() || "Hmm, I blanked on that one. Try asking another way?" });
  } catch (err) {
    console.error('Chat failed:', err.message);
    res.status(502).json({ error: 'upstream' });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini Campus Club site running on http://localhost:${PORT} (${API_KEY ? MODEL : 'demo mode, no GEMINI_API_KEY'})`);
});
