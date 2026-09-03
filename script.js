import {
  createCompactLayout,
  createDwindleLayout,
  createScrollingLayout,
  LAYOUT_GAP
} from './layouts.js';
import catppuccinEyeUrl from './assets/catppuccin-eye.webp';
import catppuccinOmarchyUrl from './assets/catppuccin-omarchy.webp';
import catppuccinTotoroUrl from './assets/catppuccin-totoro.webp';
import catppuccinWavesUrl from './assets/catppuccin-waves.webp';
import everforestOmarchyUrl from './assets/everforest-omarchy.webp';
import everforestTreeUrl from './assets/everforest-tree.webp';
import nordBlackMoonUrl from './assets/nord-black-moon.webp';
import nordCityViewUrl from './assets/nord-city-view.webp';
import nordNightHawksUrl from './assets/nord-night-hawks.webp';
import nordOmarchyUrl from './assets/nord-omarchy.webp';
import tokyoCityUrl from './assets/tokyo-city.webp';
import tokyoQuattroUrl from './assets/tokyo-quattro.webp';
import tokyoRoadUrl from './assets/tokyo-road.webp';
import tokyoSwirlUrl from './assets/tokyo-swirl.webp';

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
const themeButtons = [...document.querySelectorAll('button[data-theme]')];
const themeImages = [...document.querySelectorAll('[data-theme-image]')];
const layoutButtons = [...document.querySelectorAll('[data-layout]')];
const compactViewport = matchMedia('(max-width: 860px)');
const sectionCount = cards.length;
const lastSectionIndex = sectionCount - 1;
const puzzleFragments = [];
const cardContents = [];
const cardActivators = [];
const miniTitleLineOverrides = {
  2: ['Omarchy in', 'motion.']
};
const previewActions = [
  'Explore Omarchy',
  'Explore the system',
  'Watch videos',
  'Explore the workflow',
  'Community',
  'Browse plugins',
  'Join Omarchy'
];
let layoutMode = null;
let layoutSwitchTimer;
let lastActiveSection = -1;
let themeRequest = 0;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
document.documentElement.style.setProperty('--section-count', sectionCount);
document.documentElement.style.setProperty('--scroll-pages', sectionCount + 1);

const availableThemes = new Set(themeButtons.map((button) => button.dataset.theme));
const availableLayouts = new Set(layoutButtons.map((button) => button.dataset.layout));
const themeArtwork = {
  'tokyo-night': {
    hero: { src: tokyoQuattroUrl, alt: 'Audi Quattro driving through Tokyo at night', position: 'center 58%' },
    landscape: { src: tokyoRoadUrl, alt: 'Road winding through a mountain landscape', position: 'center' },
    workspace: { src: tokyoCityUrl, alt: 'A neon-lit cityscape from the Tokyo Night theme', position: '58% center' },
    plugin: { src: tokyoSwirlUrl, alt: 'A surreal figure framed by a circular landscape', position: 'center' }
  },
  everforest: {
    hero: { src: everforestTreeUrl, alt: 'Misty evergreen-covered mountains from the Everforest theme', position: 'center' },
    landscape: { src: everforestTreeUrl, alt: 'Misty evergreen-covered mountains from the Everforest theme', position: '25% center' },
    workspace: { src: everforestTreeUrl, alt: 'Forest ridges disappearing into fog', position: '75% center' },
    plugin: { src: everforestOmarchyUrl, alt: 'Omarchy wordmark in the Everforest theme', position: 'center' }
  },
  catppuccin: {
    hero: { src: catppuccinTotoroUrl, alt: 'Totoro beneath a lavender moon in the Catppuccin theme', position: 'center' },
    landscape: { src: catppuccinWavesUrl, alt: 'Flowing lavender and blue waves from the Catppuccin theme', position: 'center' },
    workspace: { src: catppuccinEyeUrl, alt: 'A radial blue eye from the Catppuccin theme', position: 'center' },
    plugin: { src: catppuccinOmarchyUrl, alt: 'Omarchy wordmark in the Catppuccin theme', position: 'center' }
  },
  nord: {
    hero: { src: nordBlackMoonUrl, alt: 'Black moon above a mountain landscape in the Nord theme', position: 'center' },
    landscape: { src: nordCityViewUrl, alt: 'A quiet city view through a window in the Nord theme', position: 'center' },
    workspace: { src: nordNightHawksUrl, alt: 'A cool-toned night diner scene from the Nord theme', position: 'center' },
    plugin: { src: nordOmarchyUrl, alt: 'Omarchy wordmark in the Nord theme', position: 'center' }
  }
};

function readPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The page remains fully functional when storage is unavailable.
  }
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  });
}

async function setTheme(theme) {
  const nextTheme = availableThemes.has(theme) ? theme : 'tokyo-night';
  const request = ++themeRequest;
  const artwork = themeArtwork[nextTheme];

  themeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === nextTheme));
  });

  await Promise.all([...new Set(Object.values(artwork).map(({ src }) => src))].map(preloadImage));
  if (request !== themeRequest) return;

  document.documentElement.dataset.theme = nextTheme;
  themeImages.forEach((image) => {
    const { src, alt, position } = artwork[image.dataset.themeImage];
    image.src = src;
    image.alt = alt;
    image.style.objectPosition = position;
  });
  document.documentElement.classList.add('theme-ready');
  savePreference('omarchy-home-theme', nextTheme);
}

themeButtons.forEach((button) => {
  button.addEventListener('click', () => setTheme(button.dataset.theme));
});

setTheme(pageParams.get('theme') || document.documentElement.dataset.theme || readPreference('omarchy-home-theme'));

function setLayout(layout) {
  const nextLayout = availableLayouts.has(layout) ? layout : 'dwindle';
  const hasChanged = layoutMode !== null && layoutMode !== nextLayout;
  layoutMode = nextLayout;
  document.documentElement.dataset.layout = nextLayout;
  layoutButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.layout === nextLayout));
  });
  savePreference('omarchy-home-layout', nextLayout);

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

setLayout(pageParams.get('layout') || readPreference('omarchy-home-layout'));

function scrollToCard(index, updateHistory = false) {
  snapPoints[index]?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });

  if (updateHistory) {
    const hash = `#${snapPoints[index].id}`;
    if (location.hash !== hash) history.pushState({ section: index }, '', hash);
  }
}

sectionNavLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToCard(Number(link.dataset.sectionTarget), true);
  });
});

workspaceLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToCard(Number(link.dataset.workspaceTarget), true);
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
  const content = document.createElement('div');
  content.className = 'card-content';
  while (card.firstChild) content.append(card.firstChild);
  card.append(content);
  cardContents[index] = content;

  const fragment = document.createElement('div');
  fragment.className = 'puzzle-mark';
  fragment.setAttribute('aria-hidden', 'true');
  card.prepend(fragment);
  puzzleFragments[index] = fragment;

  const heading = content.querySelector('h1, h2');
  if (heading) {
    const miniTitle = document.createElement('div');
    const titleTrack = document.createElement('div');
    const headingText = heading.cloneNode(true);
    headingText.querySelectorAll('br').forEach((lineBreak) => lineBreak.replaceWith('\n'));
    const sourceLines = headingText.textContent
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const titleLines = miniTitleLineOverrides[index] || sourceLines;
    const title = titleLines.join(' ');

    miniTitle.className = 'mini-title';
    miniTitle.setAttribute('aria-hidden', 'true');
    titleTrack.className = 'mini-title-track';

    for (let copy = 0; copy < 2; copy += 1) {
      const titleCopy = document.createElement('span');
      if (titleLines.length > 1) {
        titleCopy.append(`${titleLines[0]} `, document.createElement('br'), titleLines.slice(1).join(' '));
      } else {
        titleCopy.textContent = title;
      }
      titleTrack.append(titleCopy);
    }

    miniTitle.append(titleTrack);
    card.append(miniTitle);
  }

  const activator = document.createElement('button');
  const sectionName = content.querySelector('.card-top span:last-child')?.textContent.trim() || `section ${index + 1}`;
  activator.className = 'card-activator';
  activator.type = 'button';
  activator.setAttribute('aria-label', `Open ${sectionName}`);
  const activatorLabel = document.createElement('span');
  activatorLabel.className = 'card-activator-label';
  activatorLabel.textContent = `${previewActions[index]} ↗`;
  activator.append(activatorLabel);
  activator.addEventListener('click', () => scrollToCard(index, true));
  card.append(activator);
  cardActivators[index] = activator;

  const startMarquee = (accelerated) => {
    if (!card.classList.contains('is-mini')) return;
    card.classList.add('has-marquee-started');
    requestAnimationFrame(() => updateMarqueeSpeed(card, accelerated));
  };
  card.addEventListener('pointerenter', () => startMarquee(true));
  card.addEventListener('pointerleave', () => updateMarqueeSpeed(card, false));
  card.addEventListener('focusin', () => startMarquee(true));
  card.addEventListener('focusout', () => requestAnimationFrame(() => updateMarqueeSpeed(card, card.matches(':hover'))));
});

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

function layoutFor(active, width, height) {
  if (compactViewport.matches) return createCompactLayout(sectionCount, active, width, height);
  return layoutMode === 'scrolling'
    ? createScrollingLayout(sectionCount, active, width, height)
    : createDwindleLayout(sectionCount, active, width, height);
}

function render() {
  const pageProgress = Math.max(0, scrollY / innerHeight);
  const raw = Math.min(lastSectionIndex, pageProgress);
  const active = Math.min(lastSectionIndex, Math.floor(raw));
  const activeSection = Math.min(lastSectionIndex, Math.round(raw));
  const t = ease(raw - active);
  const isScrolled = raw > 0.04;

  topbar.classList.toggle('is-scrolled', isScrolled);

  // Read all geometry before changing card styles to avoid forced layout work.
  const rect = board.getBoundingClientRect();
  const navItems = sectionNavLinks.map((link) => ({
    left: link.offsetLeft,
    width: link.offsetWidth
  }));
  const navWidth = primaryNav.clientWidth;
  const navTrackLeft = primaryNavTrack.offsetLeft;
  const from = layoutFor(active, rect.width, rect.height);
  const to = layoutFor(Math.min(active + 1, lastSectionIndex), rect.width, rect.height);
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
    card.style.zIndex = String(sectionCount - Math.abs(i - active));
    const fragment = puzzleFragments[i];
    fragment.style.left = `${puzzleX - home[i].x}px`;
    fragment.style.top = `${puzzleY - home[i].y}px`;
    fragment.style.width = `${puzzleW}px`;
    fragment.style.height = `${puzzleH}px`;
    card.classList.toggle('is-mini', !compactViewport.matches && (w < 500 || h < 240));
    card.classList.toggle('is-compact', !compactViewport.matches && w >= 500 && h < 350);
    const isPreview = i !== activeSection;
    const isVisiblePreview = isPreview && x + w > 0 && x < rect.width && y + h > 0 && y < rect.height;
    card.classList.toggle('is-preview', isPreview);
    cardContents[i].inert = isPreview;
    cardContents[i].setAttribute('aria-hidden', String(isPreview));
    cardActivators[i].hidden = !isVisiblePreview;
  });

  const footerX = compactViewport.matches ? 0 : layoutMode === 'scrolling'
    ? Math.round(rect.width * 0.49) + LAYOUT_GAP
    : Math.round(rect.width * 0.6) + LAYOUT_GAP;
  const footerProgress = Math.max(0, Math.min(1, compactViewport.matches
    ? (pageProgress - (lastSectionIndex + 0.08)) / 0.72
    : (raw - (lastSectionIndex - 0.55)) / 0.45));
  footer.style.left = `${footerX}px`;
  footer.style.width = `${rect.width - footerX}px`;
  footer.style.height = `${rect.height}px`;
  footer.style.opacity = String(footerProgress);
  footer.style.transform = `translate3d(0, ${lerp(24, 0, ease(footerProgress))}px, 0)`;
  footer.style.pointerEvents = footerProgress > 0.9 ? 'auto' : 'none';
  footer.inert = footerProgress <= 0.9;
  footer.setAttribute('aria-hidden', footerProgress > 0.9 ? 'false' : 'true');
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
    const activeNavItem = navItems[activeSection];
    const navTarget = activeNavItem.left + activeNavItem.width / 2 - navWidth / 2;
    primaryNav.scrollTo({
      left: Math.max(0, navTarget),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  } else if (!compactViewport.matches && primaryNav.scrollLeft) {
    primaryNav.scrollLeft = 0;
  }
  lastActiveSection = activeSection;

  const currentNavItem = navItems[active];
  const nextNavItem = navItems[Math.min(active + 1, lastSectionIndex)];
  const indicatorProgress = ease(raw - active);
  const indicatorX = lerp(currentNavItem.left, nextNavItem.left, indicatorProgress);
  const indicatorWidth = lerp(currentNavItem.width, nextNavItem.width, indicatorProgress);
  const currentNavCenter = currentNavItem.left + currentNavItem.width / 2;
  const nextNavCenter = nextNavItem.left + nextNavItem.width / 2;
  const navCenter = lerp(currentNavCenter, nextNavCenter, indicatorProgress);
  primaryNavTrack.style.setProperty('--nav-shift', `${navWidth / 2 - navTrackLeft - navCenter}px`);
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

addEventListener('popstate', () => {
  const target = document.querySelector(location.hash || '#top');
  target?.scrollIntoView({ behavior: 'auto', block: 'start' });
});
