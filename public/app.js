const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const colorVar = (c) => `var(--${c})`;
const COLORS = ['blue', 'red', 'yellow', 'green'];

const club = await fetch('club.json').then((r) => r.json());

// ---------- Static text ----------
document.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = club[el.dataset.bind]; });
$('#join-link').href = club.joinUrl;
$('#email-link').href = `mailto:${club.contactEmail}`;

// ---------- Nav border on scroll ----------
const nav = $('.nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });

// ---------- Marquee ----------
const marqueeItems = club.integrations.map((t) => `<span><i style="background:${colorVar(t.color)}"></i>${esc(t.product)}</span>`).join('');
$('#marquee').innerHTML = marqueeItems + marqueeItems; // doubled for a seamless loop

// ---------- Hero prompt typewriter ----------
const heroPrompts = [
  'Make me a study guide from my CS 1332 lecture slides',
  'Summarize this group chat thread and draft a reply',
  'Turn my club budget into a chart in Sheets',
  'Find every deadline in my Drive for this week',
  'Plan my finals week around my Calendar',
];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
async function typeLoop(el, lines) {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  if (reduceMotion) { el.textContent = lines[0]; return; }
  for (let i = 0; ; i = (i + 1) % lines.length) {
    for (const ch of lines[i]) { el.textContent += ch; await wait(38); }
    await wait(1800);
    while (el.textContent) { el.textContent = el.textContent.slice(0, -1); await wait(14); }
    await wait(300);
  }
}
typeLoop($('#hero-prompt'), heroPrompts);

// ---------- Use-case explorer ----------
const chips = $('#tool-chips');
const card = $('#tool-card');
chips.innerHTML = club.integrations.map((t, i) =>
  `<button class="chip" role="tab" data-i="${i}" style="--c:${colorVar(t.color)}" aria-selected="false"><i></i>${esc(t.product)}</button>`
).join('');
let typing = 0;
function selectTool(i) {
  const t = club.integrations[i];
  chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-selected', String(+c.dataset.i === i)));
  card.style.setProperty('--c', colorVar(t.color));
  $('#tool-badge').textContent = t.product[0];
  $('#tool-name').textContent = t.product;
  const target = $('#tool-usecase');
  const run = ++typing;
  if (reduceMotion) { target.textContent = t.useCase; return; }
  target.textContent = '';
  let n = 0;
  (function step() {
    if (run !== typing) return;
    target.textContent = t.useCase.slice(0, ++n);
    if (n < t.useCase.length) setTimeout(step, 14);
  })();
}
chips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) selectTool(+chip.dataset.i);
});
selectTool(Math.max(0, club.integrations.findIndex((t) => t.product === 'NotebookLM')));

// ---------- Events ----------
const today = new Date(new Date().toDateString());
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const upcoming = club.events.filter((e) => parseDate(e.date) >= today).sort((a, b) => a.date.localeCompare(b.date));

function calendarUrl(e) {
  // Google Calendar "template" link. Pulls the start/end hour out of the "6:00 – 7:30 PM" style time string.
  const d = e.date.replaceAll('-', '');
  const m = e.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let dates = `${d}/${d}`;
  if (m) {
    const to24 = (h, mer) => (+h % 12) + (mer.toUpperCase() === 'PM' ? 12 : 0);
    const endMer = m[6];
    const startMer = m[3] || endMer;
    const pad = (n) => String(n).padStart(2, '0');
    dates = `${d}T${pad(to24(m[1], startMer))}${m[2]}00/${d}T${pad(to24(m[4], endMer))}${m[5]}00`;
  }
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: `${e.title} · ${club.short}`, dates, ctz: 'America/New_York',
    details: e.description, location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

$('#events-list').innerHTML = upcoming.length
  ? upcoming.map((e, i) => {
      const dt = parseDate(e.date);
      const c = colorVar(COLORS[i % 4]);
      return `<li class="event reveal" style="--c:${c}">
        <div class="event-date"><div class="m">${dt.toLocaleString('en-US', { month: 'short' })}</div><div class="d">${dt.getDate()}</div></div>
        <div>
          <span class="tag">${esc(e.type)}</span>
          <h3>${esc(e.title)}</h3>
          <div class="event-meta"><span>${dt.toLocaleString('en-US', { weekday: 'long' })} · ${esc(e.time)}</span><span>${esc(e.location)}</span></div>
          <p>${esc(e.description)}</p>
        </div>
        <a class="btn btn-ghost btn-small cal-btn" href="${calendarUrl(e)}" target="_blank" rel="noopener">+ Calendar</a>
      </li>`;
    }).join('')
  : `<li class="empty">New workshops dropping soon. Join the mailing list so you don't miss them.</li>`;

// ---------- Leads ----------
$('#leads').innerHTML = club.leads.map((l) => {
  const initials = l.name.split(' ').map((w) => w[0]).join('');
  return `<article class="lead reveal">
    <div class="headshot">
      <img src="${esc(l.photo)}" alt="${esc(l.name)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'initials',textContent:'${initials}'}))" />
    </div>
    <div>
      <h3>${esc(l.name)}</h3>
      <p class="role">${esc(l.role)}</p>
      <div class="lead-facts"><span>${esc(l.major)}</span><span>${esc(l.year)}</span></div>
    </div>
  </article>`;
}).join('');

// ---------- FAQ ----------
$('#faq-list').innerHTML = club.faq.map((f) => `<details class="reveal"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');

// ---------- Scroll reveal ----------
document.querySelectorAll('.section-head, .pillar, .tools, .join').forEach((el) => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(el); });

// ---------- Gem chatbot ----------
const fab = $('#chat-fab');
const panel = $('#chat');
const log = $('#chat-log');
const form = $('#chat-form');
const input = $('#chat-input');
const history = [];
let demoMode = false;

function openChat(open = panel.hidden) {
  panel.hidden = !open;
  fab.setAttribute('aria-expanded', String(open));
  if (open) {
    if (!log.children.length) addMsg('model', `Hi! I'm Gem ✦ Ask me anything about ${club.short}: upcoming workshops, how to join, or what we do.`, false);
    input.focus();
  }
}
fab.addEventListener('click', () => openChat());
$('#chat-close').addEventListener('click', () => openChat(false));
document.querySelectorAll('[data-open-chat]').forEach((b) => b.addEventListener('click', () => openChat(true)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) openChat(false); });

const suggestions = ["What's the next event?", 'How do I join?', 'Who runs the club?', 'Do I need to code?', 'What is NotebookLM?'];
$('#chat-suggest').innerHTML = suggestions.map((s) => `<button type="button">${esc(s)}</button>`).join('');
$('#chat-suggest').addEventListener('click', (e) => { if (e.target.matches('button')) send(e.target.textContent); });

function addMsg(role, text, record = true) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  el.textContent = text;
  log.append(el);
  log.scrollTop = log.scrollHeight;
  if (record) history.push({ role, text });
  return el;
}

form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });

async function send(raw) {
  const text = raw.trim();
  if (!text) return;
  input.value = '';
  addMsg('user', text);
  const btn = form.querySelector('button');
  btn.disabled = true;
  const typingEl = document.createElement('div');
  typingEl.className = 'msg model typing';
  typingEl.innerHTML = '<i></i><i></i><i></i><i></i>';
  log.append(typingEl);
  log.scrollTop = log.scrollHeight;

  let reply;
  if (!demoMode) {
    try {
      const r = await fetch('api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (r.ok) reply = (await r.json()).text;
      else if (r.status === 429) reply = "Whoa, that's a lot of questions at once. Give me a few seconds and try again!";
      else if (r.status === 503 || r.status === 404 || r.status === 405) demoMode = true; // no key or static hosting
    } catch { demoMode = true; }
    if (demoMode) $('#chat-status').textContent = 'Club assistant · offline FAQ mode';
  }
  if (!reply) {
    await new Promise((r) => setTimeout(r, 450));
    reply = localAnswer(text);
  }
  typingEl.remove();
  addMsg('model', reply);
  btn.disabled = false;
}

// Keyword fallback so Gem still answers when the Gemini API isn't configured.
function localAnswer(q) {
  const s = q.toLowerCase();
  const has = (...words) => words.some((w) => s.includes(w));
  const fmt = (e) => `${e.title} on ${parseDate(e.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${e.time} (${e.location})`;

  if (has('next', 'upcoming', 'event', 'workshop', 'when', 'meeting', 'schedule')) {
    if (!upcoming.length) return "No events are on the calendar right now, but new ones are coming soon. Join the mailing list to hear first!";
    const [next, ...rest] = upcoming;
    return `Next up: ${fmt(next)}. ${next.description}${rest.length ? `\n\nAfter that: ${rest.map((e) => e.title).join(', ')}.` : ''}`;
  }
  if (has('who', 'lead', 'run', 'president', 'ambassador', 'gauri', 'ishita', 'founder')) {
    return `${club.short} is led by ${club.leads.map((l) => l.name).join(' and ')}, Georgia Tech's Google Student Ambassadors. Scroll to the Team section to meet them!`;
  }
  if (has('code', 'coding', 'program', 'experience', 'beginner')) return club.faq[0].a;
  if (has('bring', 'laptop', 'need')) return club.faq[1].a;
  if (has('cost', 'free', 'pay', 'price', 'dues')) return club.faq[2].a;
  if (has('often', 'frequen', 'every week')) return club.faq[3].a;
  if (has('partner', 'collab', 'sponsor', 'custom')) return `${club.faq[4].a} Reach us at ${club.contactEmail}.`;
  if (has('join', 'member', 'sign up', 'signup', 'mailing')) return `${club.membership} Hit "Join" in the top right to get started.`;
  if (has('contact', 'email', 'instagram', 'reach')) return `Email us at ${club.contactEmail}. We'd love to hear from you!`;
  const tool = club.integrations.find((t) => s.includes(t.product.toLowerCase()));
  if (tool) return `Gemini in ${tool.product} is one of our favorites. For example: ${tool.useCase} We cover it hands-on in our workshops.`;
  if (has('gemini', 'what is', 'what do', 'about', 'purpose', 'club')) return club.mission;
  if (/\b(hi|hello|hey|yo|sup)\b/.test(s)) return 'Hey hey! Ask me about upcoming events, joining, or what Gemini can do across Google apps.';
  return `I'm not totally sure about that one. Try asking about events, joining, or the team, or email ${club.contactEmail}.`;
}
