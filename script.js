'use strict';

/* =====================================================================
   EDIT THIS BLOCK ONLY — everything you customise lives here.
   ===================================================================== */
const CONFIG = {
  // 1) The birthday person's name (shown in the big title).
  name: 'Someone Special',

  // 2) Birthday date, YYYY-MM-DD. The countdown ends at 12:00 AM (midnight)
  //    at the START of this date, so the surprise "goes live" exactly when
  //    the birthday begins.  Example: '2026-10-20' -> 20 Oct 2026, 12:00 AM.
  birthdayDate: '2026-10-20',

  // 3) Timezone as a UTC offset. India (Asia/Kolkata) is always +05:30.
  //    Using a fixed offset keeps the countdown correct on ANY phone's timezone.
  tzOffset: '+05:30',

  // 4) Music file (optional). Put an mp3 at music/birthday.mp3
  musicSrc: 'music/birthday.mp3',

  // 5) Six photos + captions. Balloon 1 -> photo1, balloon 2 -> photo2 ...
  photos: [
    { src: 'images/photo1.jpg', caption: 'A Little Memory 💗' },
    { src: 'images/photo2.jpg', caption: 'A Little Memory 💗' },
    { src: 'images/photo3.jpg', caption: 'A Little Memory 💗' },
    { src: 'images/photo4.jpg', caption: 'A Little Memory 💗' },
    { src: 'images/photo5.jpg', caption: 'A Little Memory 💗' },
    { src: 'images/photo6.jpg', caption: 'A Little Memory 💗' }
  ],

  // 6) Birthday wishes (one entry = one typed paragraph).
  wishes: [
    'Happy Birthday to Someone Truly Special! 🎂💗',
    'I hope your day is filled with endless smiles, beautiful memories, unexpected surprises, and all the happiness you deserve.',
    'You are more special than words can explain. Keep smiling, keep shining, and always remember how much you mean to the people around you. 🫂✨',
    'Today is all about YOU! 💖'
  ],

  // 7) Hidden final message. {name} is replaced automatically.
  finalMessage: [
    'Thank you for being exactly who you are. 🥹',
    'The world is brighter with you in it, {name}.',
    'Happy Birthday! 🎂💗🎈'
  ]
};
/* ===================== end of customisation ======================== */

const $ = (sel, root = document) => root.querySelector(sel);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BALLOON_HUES = [340, 270, 200, 45, 150, 15]; // pink, violet, blue, gold, mint, coral

// Sanity check: six balloons <-> six photos.
if (CONFIG.photos.length !== 6) console.error('CONFIG.photos must contain exactly 6 photos.');

document.querySelectorAll('[data-name]').forEach(el => (el.textContent = CONFIG.name));

/* ---------- Confetti (one canvas, runs only while pieces exist) ---------- */
const canvas = $('#fx'), ctx = canvas.getContext('2d');
let pieces = [], rafId = 0;
function sizeCanvas() {
  const d = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * d; canvas.height = innerHeight * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener('resize', sizeCanvas); sizeCanvas();

function confetti(count = 70, x = innerWidth / 2, y = innerHeight * 0.4) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i++) {
    pieces.push({
      x, y, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 10 - 3,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
      r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      c: `hsl(${Math.random() * 360} 90% 68%)`, age: 0
    });
  }
  if (!rafId) rafId = requestAnimationFrame(drawConfetti);
}
function drawConfetti() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  pieces = pieces.filter(p => p.y < innerHeight + 20 && p.age < 260);
  for (const p of pieces) {
    p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.age++;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
  }
  rafId = pieces.length ? requestAnimationFrame(drawConfetti) : 0;
  if (!pieces.length) ctx.clearRect(0, 0, innerWidth, innerHeight);
}

/* ---------- Floating hearts & sparkles ---------- */
const EMOJI = ['💗', '💖', '✨', '🤍', '💜', '⭐'];
function floatOne(force = false) {
  if (reduceMotion || (!force && document.hidden)) return;
  const box = $('#floaters');
  if (!force && box.childElementCount > 12) return;
  const s = document.createElement('span');
  s.textContent = EMOJI[Math.floor(Math.random() * EMOJI.length)];
  s.style.cssText = `left:${Math.random() * 100}%;font-size:${12 + Math.random() * 16}px;animation-duration:${6 + Math.random() * 6}s`;
  s.addEventListener('animationend', () => s.remove());
  box.append(s);
}
setInterval(floatOne, 900);

/* ---------- Music (starts only after the visitor taps) ---------- */
const audio = new Audio(); audio.loop = true; audio.preload = 'none'; audio.src = CONFIG.musicSrc;
const musicBtn = $('#musicBtn');
function setMusicLabel(on) {
  musicBtn.textContent = on ? '🎵 Music ON' : '🎵 Music OFF';
  musicBtn.setAttribute('aria-pressed', String(on));
}
function playMusic() {
  return audio.play().then(() => setMusicLabel(true)).catch(() => {
    musicBtn.textContent = '🎵 No music file'; // file missing or blocked
  });
}
musicBtn.addEventListener('click', () => (audio.paused ? playMusic() : (audio.pause(), setMusicLabel(false))));

/* ---------- Opening transition ---------- */
$('#openBtn').addEventListener('click', () => {
  const welcome = $('#welcome');
  welcome.classList.add('leave');
  document.body.classList.add('opened');
  $('#main').hidden = false;
  musicBtn.hidden = false;
  confetti(90);
  for (let i = 0; i < 8; i++) setTimeout(() => floatOne(true), i * 120);
  playMusic();
  setTimeout(() => { welcome.hidden = true; scrollTo(0, 0); }, reduceMotion ? 0 : 1100);
});

/* ---------- Balloons -> photos ---------- */
const sky = $('#sky'), gallery = $('#gallery'), note = $('#placeholderNote'), counter = $('#popCount');
let popped = 0;

// Sample picture shown ONLY when the real file is missing.
function placeholder(i) {
  const h = BALLOON_HUES[i];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},90%,90%)'/><stop offset='1' stop-color='hsl(${h + 40},80%,76%)'/></linearGradient></defs><rect width='400' height='500' fill='url(#g)'/><text x='200' y='240' font-size='90' text-anchor='middle'>💗</text><text x='200' y='320' font-size='28' text-anchor='middle' fill='#6b4a85' font-family='sans-serif'>Photo ${i + 1}</text><text x='200' y='356' font-size='18' text-anchor='middle' fill='#6b4a85' font-family='sans-serif'>images/photo${i + 1}.jpg</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function burst(x, y, hue) {
  if (reduceMotion) return;
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('i'); s.className = 'spark';
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
    s.style.cssText = `left:${x}px;top:${y}px;background:hsl(${hue + Math.random() * 60 - 30} 90% 65%)`;
    document.body.append(s);
    s.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0 }
    ], { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
  }
}

function revealPhoto(i) {
  const fig = document.createElement('figure'); fig.className = 'card'; fig.style.order = i;
  const img = new Image(); img.width = 400; img.height = 500; img.decoding = 'async';
  img.alt = `Memory ${i + 1}`;
  img.onerror = () => { img.onerror = null; img.src = placeholder(i); note.hidden = false; };
  img.src = CONFIG.photos[i].src;
  const cap = document.createElement('figcaption'); cap.textContent = CONFIG.photos[i].caption;
  fig.append(img, cap); gallery.append(fig);
  fig.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
}

function popBalloon(btn) {
  if (btn.dataset.popped) return;           // a balloon can only pop once
  btn.dataset.popped = '1';
  const i = Number(btn.dataset.index);
  const r = btn.querySelector('.b').getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  burst(x, y, BALLOON_HUES[i]); confetti(26, x, y);
  btn.classList.add('popped'); btn.disabled = true;
  revealPhoto(i);
  counter.textContent = `${++popped} / 6 memories found` + (popped === 6 ? ' 💗' : '');
}

CONFIG.photos.forEach((_, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'balloon'; b.dataset.index = i;
  b.style.setProperty('--h', BALLOON_HUES[i]);
  b.style.setProperty('--d', (3.2 + i * 0.45) + 's');
  b.setAttribute('aria-label', `Balloon ${i + 1} of 6: pop to reveal memory ${i + 1}`);
  b.innerHTML = '<span class="b"></span><span class="string"></span>';
  b.addEventListener('click', () => popBalloon(b));   // whole button = big touch target
  sky.append(b);
});

/* ---------- Countdown ----------
   Target = 12:00 AM at the start of CONFIG.birthdayDate in CONFIG.tzOffset.
   Test it quickly: open index.html?test=10 (counts down 10 seconds). */
function getTarget() {
  const t = Number(new URLSearchParams(location.search).get('test'));
  if (t > 0) return Date.now() + t * 1000;
  return new Date(`${CONFIG.birthdayDate}T00:00:00${CONFIG.tzOffset}`).getTime();
}
const target = getTarget();
const unitEls = { d: $('[data-u=d]'), h: $('[data-u=h]'), m: $('[data-u=m]'), s: $('[data-u=s]') };
const cdMsg = $('#cdMsg');
const startedBefore = target > Date.now();
const pad = n => String(n).padStart(2, '0');

function setUnit(el, val) {
  if (el.textContent === val) return;
  el.textContent = val;
  if (!reduceMotion) el.animate([{ transform: 'translateY(-35%)', opacity: 0 }, { transform: 'none', opacity: 1 }], 240);
}

function finishCountdown() {
  Object.values(unitEls).forEach(el => (el.textContent = '00'));   // never show negatives
  cdMsg.hidden = false;
  const sinceMs = Date.now() - target;
  if (Number.isNaN(target)) {
    cdMsg.textContent = 'Please set a valid birthdayDate in script.js';
  } else if (startedBefore || sinceMs < 86400000) {
    cdMsg.textContent = "IT'S YOUR SPECIAL DAY! 🎂🥳💗";               // within the birthday itself
    if (startedBefore) { confetti(160); for (let i = 0; i < 10; i++) floatOne(true); }
  } else {
    cdMsg.textContent = 'Your special day has passed, but the celebration never ends 💗';
  }
}

function tick() {
  const ms = target - Date.now();
  if (!(ms > 0)) return finishCountdown();                           // done (also covers NaN)
  const s = Math.floor(ms / 1000);
  setUnit(unitEls.d, pad(Math.floor(s / 86400)));
  setUnit(unitEls.h, pad(Math.floor((s % 86400) / 3600)));
  setUnit(unitEls.m, pad(Math.floor((s % 3600) / 60)));
  setUnit(unitEls.s, pad(s % 60));
  setTimeout(tick, 1000 - (Date.now() % 1000));                      // stays aligned to real seconds
}
tick();

/* ---------- Wishes: typing animation + final surprise ---------- */
const letter = $('#letter'), lastBtn = $('#lastBtn'), finalBox = $('#final');

function typeInto(el, text) {
  return new Promise(done => {
    const chars = Array.from(text);                                  // emoji-safe
    if (reduceMotion) { el.textContent = text; return done(); }
    let i = 0; el.classList.add('typing');
    (function step() {
      el.textContent = chars.slice(0, ++i).join('');
      if (i < chars.length) setTimeout(step, 28);
      else { el.classList.remove('typing'); setTimeout(done, 350); }
    })();
  });
}

async function playLetter() {
  for (const line of CONFIG.wishes) {
    const p = document.createElement('p'); letter.append(p);
    await typeInto(p, line);
  }
  lastBtn.hidden = false;
}

new IntersectionObserver((entries, obs) => {
  if (entries.some(e => e.isIntersecting)) { obs.disconnect(); playLetter(); }
}, { threshold: 0.35 }).observe($('#wishes'));

finalBox.innerHTML = '';
CONFIG.finalMessage.forEach(t => {
  const p = document.createElement('p'); p.textContent = t.replace('{name}', CONFIG.name); finalBox.append(p);
});

lastBtn.addEventListener('click', () => {
  lastBtn.disabled = true;
  finalBox.hidden = false; finalBox.classList.add('show');
  confetti(160); for (let i = 0; i < 14; i++) setTimeout(() => floatOne(true), i * 90);
  finalBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
});
