const cards = [...document.querySelectorAll('.card')];
const board = document.querySelector('.board');
const footer = document.querySelector('.board-footer');
const topbar = document.querySelector('.topbar');
const snapPoints = [...document.querySelectorAll('.snap-point')];
const sectionNavLinks = [...document.querySelectorAll('.primary-nav [data-section-target]')];
const workspaceLinks = [...document.querySelectorAll('[data-workspace-target]')];
const primaryNav = document.querySelector('.primary-nav');
const primaryNavTrack = document.querySelector('.primary-nav-track');
const navIndicator = document.querySelector('.nav-indicator');
const pageParams = new URLSearchParams(location.search);
const footerPreview = pageParams.has('footer');
const themeButtons = [...document.querySelectorAll('[data-theme]')];
const themeImages = [...document.querySelectorAll('[data-theme-image]')];
const layoutButtons = [...document.querySelectorAll('[data-layout]')];
const compactViewport = matchMedia('(max-width: 860px)');
const GAP = 10;
let layoutMode = null;
let layoutSwitchTimer;
let lastActiveSection = -1;

const availableThemes = new Set(themeButtons.map((button) => button.dataset.theme));
const availableLayouts = new Set(layoutButtons.map((button) => button.dataset.layout));
const themeArtwork = {
  'tokyo-night': {
    hero: ['assets/tokyo-quattro.webp', 'Audi Quattro driving through Tokyo at night', 'center 58%'],
    landscape: ['assets/tokyo-road.webp', 'Road winding through a mountain landscape', 'center'],
    workspace: ['assets/tokyo-city.webp', 'A neon-lit cityscape from the Tokyo Night theme', '58% center'],
    plugin: ['assets/tokyo-swirl.webp', 'A surreal figure framed by a circular landscape', 'center']
  },
  everforest: {
    hero: ['assets/everforest-tree.webp', 'Misty evergreen-covered mountains from the Everforest theme', 'center'],
    landscape: ['assets/everforest-tree.webp', 'Misty evergreen-covered mountains from the Everforest theme', '25% center'],
    workspace: ['assets/everforest-tree.webp', 'Forest ridges disappearing into fog', '75% center'],
    plugin: ['assets/everforest-omarchy.webp', 'Omarchy wordmark in the Everforest theme', 'center']
  },
  catppuccin: {
    hero: ['assets/catppuccin-totoro.webp', 'Totoro beneath a lavender moon in the Catppuccin theme', 'center'],
    landscape: ['assets/catppuccin-waves.webp', 'Flowing lavender and blue waves from the Catppuccin theme', 'center'],
    workspace: ['assets/catppuccin-eye.webp', 'A radial blue eye from the Catppuccin theme', 'center'],
    plugin: ['assets/catppuccin-omarchy.webp', 'Omarchy wordmark in the Catppuccin theme', 'center']
  },
  nord: {
    hero: ['assets/nord-black-moon.webp', 'Black moon above a mountain landscape in the Nord theme', 'center'],
    landscape: ['assets/nord-city-view.webp', 'A quiet city view through a window in the Nord theme', 'center'],
    workspace: ['assets/nord-night-hawks.webp', 'A cool-toned night diner scene from the Nord theme', 'center'],
    plugin: ['assets/nord-omarchy.webp', 'Omarchy wordmark in the Nord theme', 'center']
  }
};

function setTheme(theme) {
  const nextTheme = availableThemes.has(theme) ? theme : 'tokyo-night';
  document.documentElement.dataset.theme = nextTheme;
  themeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === nextTheme));
  });
  themeImages.forEach((image) => {
    const [src, alt, position] = themeArtwork[nextTheme][image.dataset.themeImage];
    image.src = src;
    image.alt = alt;
    image.style.objectPosition = position;
  });
  localStorage.setItem('omarchy-home-theme', nextTheme);
}

themeButtons.forEach((button) => {
  button.addEventListener('click', () => setTheme(button.dataset.theme));
});

setTheme(pageParams.get('theme') || localStorage.getItem('omarchy-home-theme'));

function setLayout(layout) {
  const nextLayout = availableLayouts.has(layout) ? layout : 'dwindle';
  const hasChanged = layoutMode !== null && layoutMode !== nextLayout;
  layoutMode = nextLayout;
  document.documentElement.dataset.layout = nextLayout;
  layoutButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.layout === nextLayout));
  });
  localStorage.setItem('omarchy-home-layout', nextLayout);

  if (hasChanged) {
    board.classList.add('is-layout-switching');
    clearTimeout(layoutSwitchTimer);
    layoutSwitchTimer = setTimeout(() => board.classList.remove('is-layout-switching'), 360);
    queueMicrotask(requestRender);
  }
}

layoutButtons.forEach((button) => {
  button.addEventListener('click', () => setLayout(button.dataset.layout));
});

setLayout(pageParams.get('layout') || localStorage.getItem('omarchy-home-layout'));

function scrollToCard(index) {
  snapPoints[index]?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
}

sectionNavLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToCard(Number(link.dataset.sectionTarget));
  });
});

workspaceLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToCard(Number(link.dataset.workspaceTarget));
  });
});

function updateMarqueeSpeed(card, accelerated) {
  const track = card.querySelector('.mini-title-track');
  const animation = track?.getAnimations().find(({ animationName }) => animationName === 'mini-title-loop');
  if (!animation) return;

  const styles = getComputedStyle(track);
  const idleDuration = parseFloat(styles.getPropertyValue('--marquee-idle'));
  const hoverDuration = parseFloat(styles.getPropertyValue('--marquee-hover'));
  const playbackRate = accelerated && hoverDuration ? idleDuration / hoverDuration : 1;

  if (animation.updatePlaybackRate) animation.updatePlaybackRate(playbackRate);
  else animation.playbackRate = playbackRate;
}

cards.forEach((card, index) => {
  const startMarquee = (accelerated) => {
    if (!card.classList.contains('is-mini')) return;
    card.classList.add('has-marquee-started');
    requestAnimationFrame(() => updateMarqueeSpeed(card, accelerated));
  };
  card.addEventListener('pointerenter', () => startMarquee(true));
  card.addEventListener('pointerleave', () => updateMarqueeSpeed(card, false));
  card.addEventListener('focusin', () => startMarquee(true));
  card.addEventListener('focusout', () => requestAnimationFrame(() => updateMarqueeSpeed(card, card.matches(':hover'))));

  const fragment = document.createElement('div');
  fragment.className = 'puzzle-mark';
  fragment.setAttribute('aria-hidden', 'true');
  card.prepend(fragment);

  const heading = card.querySelector('h1, h2');
  if (heading) {
    const miniTitle = document.createElement('div');
    const titleTrack = document.createElement('div');
    const headingText = heading.cloneNode(true);
    headingText.querySelectorAll('br').forEach((lineBreak) => lineBreak.replaceWith(' '));
    const title = headingText.textContent.replace(/\s+/g, ' ').trim();

    miniTitle.className = 'mini-title';
    miniTitle.setAttribute('aria-hidden', 'true');
    titleTrack.className = 'mini-title-track';

    for (let copy = 0; copy < 2; copy += 1) {
      const titleCopy = document.createElement('span');
      titleCopy.textContent = title;
      titleTrack.append(titleCopy);
    }

    miniTitle.append(titleTrack);
    card.append(miniTitle);
  }

  card.addEventListener('click', (event) => {
    if (card.matches('.video-card.is-mini')) {
      event.preventDefault();
      scrollToCard(index);
      return;
    }
    if (event.target.closest('a, button')) return;
    scrollToCard(index);
  });

  card.addEventListener('keydown', (event) => {
    if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    scrollToCard(index);
  });
});

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

function dwindleLayoutFor(active, width, height) {
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

function scrollingLayoutFor(active, width, height) {
  const columnWidth = Math.round(width * 0.49);
  const columnStep = columnWidth + GAP;

  return cards.map((_, index) => ({
    x: (index - active) * columnStep,
    y: 0,
    w: columnWidth,
    h: height
  }));
}

function compactLayoutFor(active, width, height) {
  return cards.map((_, index) => ({
    x: (index - active) * (width + GAP),
    y: 0,
    w: width,
    h: height
  }));
}

function layoutFor(active, width, height) {
  if (compactViewport.matches) return compactLayoutFor(active, width, height);
  return layoutMode === 'scrolling'
    ? scrollingLayoutFor(active, width, height)
    : dwindleLayoutFor(active, width, height);
}

function render() {
  const rect = board.getBoundingClientRect();
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const pageProgress = scrollY / innerHeight;
  const raw = footerPreview
    ? cards.length - 1
    : compactViewport.matches
      ? Math.min(cards.length - 1, pageProgress)
      : (maxScroll ? scrollY / maxScroll * (cards.length - 1) : 0);
  const active = Math.min(cards.length - 1, Math.floor(raw));
  const activeSection = Math.min(cards.length - 1, Math.round(raw));
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
    card.classList.toggle('is-mini', !compactViewport.matches && (w < 500 || h < 240));
    card.classList.toggle('is-compact', !compactViewport.matches && w >= 500 && h < 350);
    card.setAttribute('aria-hidden', i < active ? 'true' : 'false');
  });

  const footerX = compactViewport.matches ? 0 : layoutMode === 'scrolling'
    ? Math.round(rect.width * 0.49) + GAP
    : Math.round(rect.width * 0.6) + GAP;
  const footerProgress = Math.max(0, Math.min(1, compactViewport.matches
    ? (pageProgress - 6.08) / 0.72
    : (raw - 5.45) / 0.45));
  footer.style.left = `${footerX}px`;
  footer.style.width = `${rect.width - footerX}px`;
  footer.style.height = `${rect.height}px`;
  footer.style.opacity = String(footerProgress);
  footer.style.transform = `translate3d(0, ${lerp(24, 0, ease(footerProgress))}px, 0)`;
  footer.style.pointerEvents = footerProgress > 0.9 ? 'auto' : 'none';
  footer.setAttribute('aria-hidden', footerProgress > 0.9 ? 'false' : 'true');
  topbar.classList.toggle('is-scrolled', raw > 0.04);
  sectionNavLinks.forEach((link, index) => {
    if (index === activeSection) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
    const distance = Math.abs(index - raw);
    link.style.setProperty('--focus-opacity', String(Math.max(.06, 1 - distance * .58)));
  });
  workspaceLinks.forEach((link, index) => {
    if (index === activeSection) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });

  if (compactViewport.matches && activeSection !== lastActiveSection) {
    const activeLink = sectionNavLinks[activeSection];
    const navTarget = activeLink.offsetLeft + activeLink.offsetWidth / 2 - primaryNav.clientWidth / 2;
    primaryNav.scrollTo({
      left: Math.max(0, navTarget),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  } else if (!compactViewport.matches && primaryNav.scrollLeft) {
    primaryNav.scrollLeft = 0;
  }
  lastActiveSection = activeSection;

  const currentNavItem = sectionNavLinks[active];
  const nextNavItem = sectionNavLinks[Math.min(active + 1, sectionNavLinks.length - 1)];
  const indicatorProgress = ease(raw - active);
  const indicatorX = lerp(currentNavItem.offsetLeft, nextNavItem.offsetLeft, indicatorProgress);
  const indicatorWidth = lerp(currentNavItem.offsetWidth, nextNavItem.offsetWidth, indicatorProgress);
  const currentNavCenter = currentNavItem.offsetLeft + currentNavItem.offsetWidth / 2;
  const nextNavCenter = nextNavItem.offsetLeft + nextNavItem.offsetWidth / 2;
  const navCenter = lerp(currentNavCenter, nextNavCenter, indicatorProgress);
  primaryNavTrack.style.setProperty('--nav-shift', `${primaryNav.clientWidth / 2 - primaryNavTrack.offsetLeft - navCenter}px`);
  navIndicator.style.width = `${indicatorWidth}px`;
  navIndicator.style.transform = `translate3d(${indicatorX}px, 0, 0)`;
}

let ticking = false;
function requestRender() {
  if (!ticking) requestAnimationFrame(() => { render(); ticking = false; });
  ticking = true;
}
addEventListener('scroll', requestRender, { passive:true });
addEventListener('resize', requestRender);
render();
document.fonts?.ready.then(requestRender);

if (location.hash === '#footer') {
  setTimeout(() => scrollTo(0, document.documentElement.scrollHeight), 100);
}
