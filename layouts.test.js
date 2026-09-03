import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCompactLayout,
  createDwindleLayout,
  createScrollingLayout,
  LAYOUT_GAP
} from './layouts.js';

const COUNT = 7;
const WIDTH = 1200;
const HEIGHT = 760;

test('dwindle layout returns one valid frame per section', () => {
  for (let active = 0; active < COUNT; active += 1) {
    const layout = createDwindleLayout(COUNT, active, WIDTH, HEIGHT);
    assert.equal(layout.length, COUNT);
    assert.deepEqual(layout[active], { x: 0, y: 0, w: 720, h: HEIGHT });
    layout.forEach(({ w, h }) => {
      assert.ok(w > 0);
      assert.ok(h > 0);
    });
  }
});

test('dwindle tiles stay positive at the narrowest desktop width', () => {
  const layout = createDwindleLayout(COUNT, 0, 813, 470);
  layout.forEach(({ w, h }) => {
    assert.ok(w > 0);
    assert.ok(h > 0);
  });
});

test('scrolling layout advances by one consistent column', () => {
  const layout = createScrollingLayout(COUNT, 3, WIDTH, HEIGHT);
  const step = Math.round(WIDTH * 0.49) + LAYOUT_GAP;
  assert.equal(layout[3].x, 0);
  assert.equal(layout[4].x, step);
  assert.equal(layout[2].x, -step);
});

test('compact layout exposes exactly one viewport-width section', () => {
  const layout = createCompactLayout(COUNT, 2, WIDTH, HEIGHT);
  assert.deepEqual(layout[2], { x: 0, y: 0, w: WIDTH, h: HEIGHT });
  assert.equal(layout[3].x, WIDTH + LAYOUT_GAP);
});
