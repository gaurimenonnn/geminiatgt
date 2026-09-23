// Local dev server only. The site is fully static (everything lives in public/),
// so production hosting is Firebase Hosting; see firebase.json and the README.
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

express()
  .use(express.static(path.join(__dirname, 'public')))
  .listen(PORT, () => console.log(`Gemini Campus Club site running on http://localhost:${PORT}`));
