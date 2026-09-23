const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const colorVar = (c) => `var(--${c})`;
const COLORS = ['blue', 'red', 'yellow', 'green'];

const club = await fetch('club.json').then((r) => r.json());

// ---------- Static text ----------
document.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = club[el.dataset.bind]; });
$('#join-link').href = club.joinUrl;
$('#email-link').href = `mailto:${club.contactEmail}`;
$('#insta-link').href = club.instagram;
$('#socials').innerHTML = [
  `<a href="${club.instagram}" target="_blank" rel="noopener">Instagram ${esc(club.instagramHandle)}</a>`,
  `<a href="${club.linktree}" target="_blank" rel="noopener">Linktree</a>`,
  `<a href="mailto:${club.contactEmail}">${esc(club.contactEmail)}</a>`,
  // Discord placeholder until club.discord has an invite link
  club.discord ? `<a href="${club.discord}" target="_blank" rel="noopener">Discord</a>` : `<span class="soon">Discord · coming soon</span>`,
].join('');
document.querySelectorAll('[data-bind-offer]').forEach((el) => { el.textContent = club.studentOffer[el.dataset.bindOffer]; });
$('#offer-link').href = club.studentOffer.url;

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
selectTool(Math.max(0, club.integrations.findIndex((t) => t.product === 'Gemini Notebook')));

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
  : `<li class="empty">New workshops dropping soon. Follow ${esc(club.instagramHandle)} on Instagram so you don't miss them.</li>`;

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

// ---------- Gigi chatbot ----------
const fab = $('#chat-fab');
const panel = $('#chat');
const log = $('#chat-log');
const form = $('#chat-form');
const input = $('#chat-input');
const history = [];

function openChat(open = panel.hidden) {
  panel.hidden = !open;
  fab.setAttribute('aria-expanded', String(open));
  if (open) {
    if (!log.children.length) addMsg('model', `Hi, I'm Gigi 🐝 the Gemini Campus Club mascot! Ask me about upcoming workshops, how to join, or getting Gemini free as a student.`, false);
    input.focus();
  }
}
fab.addEventListener('click', () => openChat());
$('#chat-close').addEventListener('click', () => openChat(false));
document.querySelectorAll('[data-open-chat]').forEach((b) => b.addEventListener('click', () => openChat(true)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) openChat(false); });

const suggestions = ["What's the next event?", 'How do I join?', 'Who runs the club?', 'How do I get Gemini free?', 'What is Gemini Notebook?', 'Do I need to code?'];
$('#chat-suggest').innerHTML = suggestions.map((s) => `<button type="button">${esc(s)}</button>`).join('');
$('#chat-suggest').addEventListener('click', (e) => { if (e.target.matches('button')) send(e.target.textContent); });

function addMsg(role, text, record = true) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  el.innerHTML = esc(text).replace(/https?:\/\/[^\s<]+[^\s<.,!?)]/g, (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
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

  await new Promise((r) => setTimeout(r, 450));
  const reply = localAnswer(text);
  typingEl.remove();
  addMsg('model', reply);
  btn.disabled = false;
}

// Gigi is a rule-based FAQ helper: keyword intents first, then best word-overlap match against the FAQ list.
function localAnswer(q) {
  const s = q.toLowerCase();
  const has = (...words) => words.some((w) => s.includes(w));
  const faq = (start) => club.faq.find((f) => f.q.startsWith(start)).a;
  const fmt = (e) => `${e.title} on ${parseDate(e.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${e.time} (${e.location})`;

  if (has('free gemini', 'gemini free', 'gemini for free', 'get gemini', 'ai pro', 'pro plan', 'discount', 'student offer', 'perk')) {
    return `${club.studentOffer.description} Claim it here: ${club.studentOffer.url}`;
  }
  if (has('gigi', 'mascot', 'bee', 'who are you', 'your name')) return `That's me! ${club.mascot} Buzz buzz.`;
  if (has('notebooklm', 'notebook lm')) return 'NotebookLM is now officially called Gemini Notebook! Load your lecture slides and readings, then get study guides, quizzes, and Audio Overviews. We have a whole workshop on it.';
  if (has('partner', 'collab', 'sponsor', 'custom')) return faq('Can my org');
  // A question naming a specific event ("when is build night?") gets that event.
  const generic = new Set(['gemini', 'workshop', 'event', 'your', 'with', 'when', 'what']);
  const named = upcoming.find((e) => (e.title.toLowerCase().match(/[a-z]{4,}/g) || []).some((w) => !generic.has(w) && s.includes(w)));
  if (named) return `${fmt(named)}. ${named.description}`;
  if (has('next', 'upcoming', 'event', 'workshop', 'when', 'meeting', 'schedule')) {
    if (!upcoming.length) return "No events are on the calendar right now, but new ones are coming soon. Join the mailing list to hear first!";
    const [next, ...rest] = upcoming;
    return `Next up: ${fmt(next)}. ${next.description}${rest.length ? `\n\nAfter that: ${rest.map((e) => e.title).join(', ')}.` : ''}`;
  }
  if (has('who', 'lead', 'run', 'president', 'ambassador', 'gauri', 'ishita', 'founder')) {
    return `${club.short} is led by ${club.leads.map((l) => l.name).join(' and ')}, Georgia Tech's Google Student Ambassadors. Scroll to the Team section to meet them!`;
  }
  if (has('code', 'coding', 'program', 'experience', 'beginner')) return faq('Do I need');
  if (has('bring', 'laptop', 'need')) return faq('What should');
  if (has('cost', 'free', 'pay', 'price', 'dues')) return faq('How much');
  if (has('often', 'frequen', 'every week')) return faq('How often');
  if (has('join', 'member', 'sign up', 'signup', 'mailing', 'involved')) return `${club.membership} Start here: ${club.linktree}`;
  if (has('discord', 'server')) return club.discord ? `Join our Discord: ${club.discord}` : `Our Discord is coming soon! Follow ${club.instagramHandle} on Instagram to hear when it launches.`;
  if (has('instagram', 'insta', 'social') || /\big\b/.test(s)) return `Follow us on Instagram at ${club.instagramHandle}: ${club.instagram}`;
  if (has('linktree', 'links')) return `All our links are here: ${club.linktree}`;
  if (has('contact', 'email', 'reach', 'message')) return `Email us at ${club.contactEmail}, or DM ${club.instagramHandle} on Instagram. We'd love to hear from you!`;
  const tool = club.integrations.find((t) => s.includes(t.product.toLowerCase()));
  if (tool) return `Gemini in ${tool.product} is one of our favorites. For example: ${tool.useCase} We cover it hands-on in our workshops.`;
  if (has('gemini', 'what is', 'what do', 'about', 'purpose', 'club')) return club.mission;
  if (/\b(hi|hello|hey|yo|sup)\b/.test(s)) return 'Hey hey! Ask me about upcoming events, joining, or what Gemini can do across Google apps.';
  const words = s.match(/[a-z]{4,}/g) || [];
  const best = club.faq
    .map((f) => ({ f, score: words.filter((w) => f.q.toLowerCase().includes(w)).length }))
    .sort((a, b) => b.score - a.score)[0];
  if (best?.score) return best.f.a;
  return `I only know the basics about the club, so I'm not sure about that one! Try asking about events, joining, or free Gemini for students, or email ${club.contactEmail}.`;
}
