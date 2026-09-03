const cards = [...document.querySelectorAll('.card')];
const board = document.querySelector('.board');
const counter = document.querySelector('#counter');
const GAP = 10;

cards.forEach((card) => {
  const fragment = document.createElement('div');
  fragment.className = 'puzzle-mark';
  fragment.setAttribute('aria-hidden', 'true');
  card.prepend(fragment);
});

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

function layoutFor(active, width, height) {
  const mainW = Math.round(width * 0.6);
  const sideX = mainW + GAP;
  const sideW = width - sideX;
  const positions = [];

  cards.forEach((_, index) => {
    if (index < active) {
      positions[index] = { x: 0, y: -height - GAP, w: mainW, h: height };
    } else if (index === active) {
      positions[index] = { x: 0, y: 0, w: mainW, h: height };
    }
  });

  const future = cards.length - active - 1;
  let remainder = { x: sideX, y: 0, w: sideW, h: height };

  for (let n = 0; n < future; n++) {
    const index = active + n + 1;
    const left = future - n;

    if (left === 1) {
      positions[index] = { ...remainder };
      continue;
    }

    // Hyprland-style dwindle: each new tile alternates between taking
    // the upper half and the left half of the remaining rectangle.
    const horizontal = n % 2 === 0;
    if (horizontal) {
      const h = Math.round((remainder.h - GAP) * 0.5);
      positions[index] = { x: remainder.x, y: remainder.y, w: remainder.w, h };
      remainder = {
        x: remainder.x,
        y: remainder.y + h + GAP,
        w: remainder.w,
        h: remainder.h - h - GAP
      };
    } else {
      const w = Math.round((remainder.w - GAP) * 0.5);
      positions[index] = { x: remainder.x, y: remainder.y, w, h: remainder.h };
      remainder = {
        x: remainder.x + w + GAP,
        y: remainder.y,
        w: remainder.w - w - GAP,
        h: remainder.h
      };
    }
  }
  return positions;
}

function render() {
  const rect = board.getBoundingClientRect();
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const raw = maxScroll ? scrollY / maxScroll * (cards.length - 1) : 0;
  const active = Math.min(cards.length - 1, Math.floor(raw));
  const t = ease(raw - active);
  const from = layoutFor(active, rect.width, rect.height);
  const to = layoutFor(Math.min(active + 1, cards.length - 1), rect.width, rect.height);
  const home = layoutFor(0, rect.width, rect.height);
  const puzzleW = Math.min(rect.width * 0.78, 1180);
  const puzzleH = puzzleW / (1860 / 402);
  const puzzleX = (rect.width - puzzleW) / 2;
  const puzzleY = (rect.height - puzzleH) / 2;

  cards.forEach((card, i) => {
    const a = from[i], b = to[i];
    const x = lerp(a.x,b.x,t), y = lerp(a.y,b.y,t);
    const w = lerp(a.w,b.w,t), h = lerp(a.h,b.h,t);
    card.style.width = `${w}px`;
    card.style.height = `${h}px`;
    card.style.transform = `translate3d(${x}px,${y}px,0)`;
    card.style.zIndex = String(cards.length - Math.abs(i - active));
    const fragment = card.querySelector('.puzzle-mark');
    fragment.style.left = `${puzzleX - home[i].x}px`;
    fragment.style.top = `${puzzleY - home[i].y}px`;
    fragment.style.width = `${puzzleW}px`;
    fragment.style.height = `${puzzleH}px`;
    card.classList.toggle('is-mini', w < 500 || h < 240);
    card.setAttribute('aria-hidden', i < active ? 'true' : 'false');
  });
  counter.textContent = `${String(active + 1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
}

let ticking = false;
function requestRender() {
  if (!ticking) requestAnimationFrame(() => { render(); ticking = false; });
  ticking = true;
}
addEventListener('scroll', requestRender, { passive:true });
addEventListener('resize', requestRender);
render();
