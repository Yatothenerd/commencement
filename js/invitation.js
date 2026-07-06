/* ═══════════════════════════════════════════════════════════
   PIU Commencement 2026 — Invitation Logic
   ═══════════════════════════════════════════════════════════ */

/** Read a URL query parameter. */
function param(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/** Safely set an element's text content if the element exists. */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Scale the invitation content so the whole card fits within one screen
 * (no clipping, no page scroll), on any device height.
 */
function fitInvitation() {
  const page = document.querySelector('.page-invite');
  const body = document.querySelector('.page-invite .inv-body');
  if (!page || !body) return;

  // Content is shown at full size; the page scrolls if it's taller than
  // the screen, so nothing is ever cropped.
  body.style.transform = 'none';
}
window.addEventListener('resize', fitInvitation);
window.addEventListener('load', fitInvitation);
// Re-fit once webfonts (Ivy Presto) finish loading — they change text height.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(fitInvitation);
}




/* ══════════════════════════════════════
   TWINKLING STARS
══════════════════════════════════════ */
function makeStars(container, count, onTop) {
  if (!container) return;
  if (container.querySelector(':scope > .starfield')) return; // avoid duplicates
  const field = document.createElement('div');
  field.className = 'starfield' + (onTop ? ' over' : '');
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    const size = Math.random() * 2 + 1;            // 1–3px
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.animationDuration = (1.6 + Math.random() * 2.6) + 's';
    s.style.animationDelay = (Math.random() * 3) + 's';
    field.appendChild(s);
  }
  container.prepend(field);
}

/* ══════════════════════════════════════
   AUDIO — background music + seal sound
══════════════════════════════════════ */
function playSealSound() {
  const s = document.getElementById('sealSound');
  if (!s) return;
  try { s.currentTime = 0; s.volume = 0.9; s.play().catch(() => {}); } catch {}
}

function updateMusicBtn(playing) {
  const b = document.getElementById('musicToggle');
  if (b) b.classList.toggle('playing', !!playing);
}

function startMusic() {
  const m = document.getElementById('bgMusic');
  const b = document.getElementById('musicToggle');
  if (b) b.hidden = false;          // reveal the floating control
  if (!m) return;
  m.volume = 0.45;
  m.play().then(() => updateMusicBtn(true)).catch(() => updateMusicBtn(false));
}

function toggleMusic() {
  const m = document.getElementById('bgMusic');
  if (!m) return;
  if (m.paused) {
    m.play().then(() => updateMusicBtn(true)).catch(() => {});
  } else {
    m.pause();
    updateMusicBtn(false);
  }
}

/* ── Pause music when the tab/window isn't visible (switched tabs,
   minimized, screen locked, backgrounded on mobile); resume it when
   it comes back — but only if it was actually playing before, so we
   never override a user's manual pause. ── */
let musicWasPlayingBeforeHide = false;
document.addEventListener('visibilitychange', () => {
  const m = document.getElementById('bgMusic');
  if (!m) return;
  if (document.hidden) {
    musicWasPlayingBeforeHide = !m.paused;
    if (musicWasPlayingBeforeHide) {
      m.pause();
      updateMusicBtn(false);
    }
  } else if (musicWasPlayingBeforeHide) {
    m.play().then(() => updateMusicBtn(true)).catch(() => updateMusicBtn(false));
  }
});

/**
 * Full-screen smoke transition: billows up to cover the screen, runs
 * `onCovered` (swap envelope -> invitation) while it's hidden, then clears.
 */
function playSmokeTransition(onCovered) {
  if (typeof gsap === 'undefined') { if (onCovered) onCovered(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'smoke-overlay';
  const clouds = [];
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('div');
    c.className = 'smoke-cloud';
    c.style.left = (Math.random() * 120 - 30) + 'vw';
    c.style.top = (Math.random() * 120 - 30) + 'vh';
    overlay.appendChild(c);
    clouds.push(c);
  }
  document.body.appendChild(overlay);

  let swapped = false;
  const swap = () => { if (!swapped) { swapped = true; if (onCovered) onCovered(); } };

  gsap.timeline({ onComplete: () => overlay.remove() })
    .fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power1.out' }, 0)
    .fromTo(clouds,
      { scale: 0.5, xPercent: -50, yPercent: -50 },
      { scale: 1.7, duration: 2.4, ease: 'none', stagger: 0.04 }, 0)
    .add(swap, 0.6)                                   // swap while fully covered
    .to(overlay, { opacity: 0, duration: 1.1, ease: 'power1.in' }, 0.85)
    .to(clouds, { scale: 2.6, duration: 1.5, ease: 'none' }, 0.75);
}

/**
 * Seal click: open the envelope, then smoke-transition into the invitation.
 */
function sealClick() {
  const envSeal = document.getElementById('envSeal');
  const envFlap = document.querySelector('.env-flap');
  const envLetter = document.querySelector('.env-letter');
  const hint = document.getElementById('tapHint');
  const scene = document.getElementById('envelopeScene');
  const invSection = document.getElementById('invSection');

  // Prevent double clicks
  if (envSeal.style.pointerEvents === 'none') return;
  envSeal.style.pointerEvents = 'none';

  // Seal click sound (fires on the user gesture, so it's allowed to play).
  playSealSound();

  gsap.timeline()
    .to(hint, { opacity: 0, duration: 0.3 })
    .to(envSeal, { scale: 0.85, opacity: 0, duration: 0.4 }, "<")
    .to(envFlap, { rotateX: 180, duration: 0.6, ease: "power2.inOut" }, "-=0.2")
    .to(envLetter, { y: 0, duration: 0.8, ease: "back.out(1.2)" }, "-=0.2")
    .add(() => {
      // Music starts as the smoke rises; then swap + reveal the card.
      startMusic();
      playSmokeTransition(() => {
        scene.style.display = 'none';
        invSection.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'auto' });
        // Re-fit as fonts/images settle.
        requestAnimationFrame(() => { fitInvitation(); requestAnimationFrame(fitInvitation); });
        setTimeout(fitInvitation, 300);
        setTimeout(fitInvitation, 800);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitInvitation);
        gsap.fromTo(invSection, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' });
        gsap.fromTo(".inv-body > *",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out", delay: 0.25 });
      });
    }, "+=0.3");
}

/* ── On load: inject guest name/position from URL params ── */
function loadComponents() {
  try {
    const envContainer = document.getElementById('envelope-container');
    const invContainer = document.getElementById('invitation-container');
    const progContainer = document.getElementById('program-container');

    if (envContainer && typeof envelopeHTML !== 'undefined') envContainer.innerHTML = envelopeHTML;
    if (invContainer && typeof invitationHTML !== 'undefined') invContainer.innerHTML = invitationHTML;
    if (progContainer && typeof programHTML !== 'undefined') progContainer.innerHTML = programHTML;

    initInvitation();

    // Twinkling stars over the envelope and the invitation's blue area.
    makeStars(document.getElementById('envelopeScene'), 70);
    makeStars(document.getElementById('invSection'), 70, true); // over the card too
  } catch (error) {
    console.error("Error loading components:", error);
    document.body.innerHTML = `
      <div style="color: white; text-align: center; padding: 50px; font-family: sans-serif;">
        <h2>⚠️ Components Failed to Load</h2>
        <p>Something went wrong while trying to inject the components.</p>
        <p style="opacity: 0.5; font-size: 12px; margin-top: 20px;">Error details: ${error.message}</p>
      </div>
    `;
  }
}

/** Apply a guest's details to the envelope + invitation card.
    Fully data-driven: empty fields are cleared/hidden, so no
    placeholder text is left behind. */
function applyGuest({ name, role, company } = {}) {
  const guestName = (name && name.trim()) || 'Distinguished Guest';
  setText('envLetterName', guestName);
  setText('invName', guestName);

  // Position line
  const posEl = document.getElementById('invPos');
  if (posEl) {
    posEl.textContent = role ? role : '';
    posEl.style.display = role ? '' : 'none';
  }

  // Company line (shown directly below the position)
  const companyEl = document.getElementById('invCompany');
  if (companyEl) {
    companyEl.textContent = company ? company : '';
    companyEl.style.display = company ? '' : 'none';
  }
}

/** Look up a guest from the database by their 6-digit code. */
async function fetchGuestByCode(code) {
  try {
    const res = await fetch(`/api/guest?c=${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    return await res.json();   // { name, role, company }
  } catch {
    return null;
  }
}

function initInvitation() {
  // Code can come from a short link (/123456) or the ?c= query param.
  const pathMatch = window.location.pathname.match(/^\/(\d{6})$/);
  const code = pathMatch ? pathMatch[1] : param('c');

  // 1) Show whatever the URL carries immediately (no flash / works offline).
  applyGuest({
    name: param('name'),
    role: param('role'),
    company: param('company')
  });

  // 2) If a code is present, fetch the authoritative record and update.
  if (code && /^\d{6}$/.test(code)) {
    fetchGuestByCode(code).then(guest => {
      if (guest) applyGuest(guest);
    });
  }

  // Initial Entrance Animation
  gsap.fromTo("#envelopeScene",
    { opacity: 0 },
    { opacity: 1, duration: 1, ease: "power2.inOut" }
  );
  gsap.fromTo(".env-content",
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.3 }
  );
}

window.addEventListener('DOMContentLoaded', loadComponents);

/* ── Allow opening the seal with keyboard (Enter / Space) ── */
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.id === 'envSeal') {
    e.preventDefault();
    sealClick();
  }
});
