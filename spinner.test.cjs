const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const COUNTS = 'standup-roulette-counts';
const WINNERS = 'standup-roulette-winners';
const NAMES = 'standup-roulette-names';
const html = readFileSync(__dirname + '/index.html', 'utf8');

function openApp(initial = {}, random = 0) {
  const storage = new Map(Object.entries(initial));
  const elements = new Map();
  const arcs = [];
  const context = new Proxy({}, { get: (_, key) => key === 'arc'
    ? (...args) => arcs.push(args) : () => {} });
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', textContent: '', innerHTML: '', hidden: true, disabled: false,
      checked: false, width: 800, height: 800, classList: { add() {}, remove() {} },
      clientWidth: 400, clientHeight: 400, offsetWidth: 120, offsetHeight: 30,
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 400, height: 400 }),
      style: {},
      getContext: () => context, listeners: {},
      addEventListener(event, callback) { this.listeners[event] = callback; },
    });
    return elements.get(id);
  } };
  let frame;
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
    document, localStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value) },
    Math: Object.assign(Object.create(Math), { random: () => random }),
    Date, setTimeout() {}, requestAnimationFrame(callback) { frame = callback; },
  });
  return {
    storage, arcs, el: id => document.getElementById(id),
    click(id) { document.getElementById(id).listeners.click(); },
    spin() { this.click('spinBtn'); frame(0); frame(5000); },
    counts() { return JSON.parse(storage.get(COUNTS) || '{}'); },
  };
}

test('a selection stays uncounted until it is confirmed', () => {
  const app = openApp();
  app.spin();
  assert.deepEqual(app.counts(), {});
  assert.equal(app.storage.has(WINNERS), false);
  assert.equal(app.el('confirmBtn').hidden, false);
  app.click('confirmBtn');
  assert.deepEqual(app.counts(), { Alice: 1 });
  assert.ok(Object.values(JSON.parse(app.storage.get(WINNERS))).includes('Alice'));
  assert.equal(app.el('confirmBtn').hidden, true);
});

test('a confirmed selection is counted once when confirm is repeated', () => {
  const app = openApp();
  app.spin();
  app.click('confirmBtn');
  app.click('confirmBtn');
  assert.deepEqual(app.counts(), { Alice: 1 });
});

test('an unconfirmed selection is discarded when another spin starts', () => {
  const app = openApp();
  app.spin();
  app.click('spinBtn');
  app.click('confirmBtn');
  assert.deepEqual(app.counts(), {});
});

test('a person with three confirmed turns gets one quarter of a new person’s slice', () => {
  const app = openApp({ [NAMES]: '["Alice","Bob"]', [COUNTS]: '{"Alice":3}' });
  const slices = app.arcs.filter(arc => arc[3] !== 0 || arc[4] < Math.PI * 2);
  assert.equal(slices.length, 2);
  assert.ok(Math.abs((slices[0][4] - slices[0][3]) / (slices[1][4] - slices[1][3]) - 0.25) < 1e-10);
});

test('selection follows slice sizes when confirmed counts differ', () => {
  const app = openApp({ [NAMES]: '["Alice","Bob"]', [COUNTS]: '{"Alice":3}' }, 0.3);
  app.spin();
  assert.match(app.el('result').innerHTML, /Bob/);
  const slices = app.arcs.slice(-3, -1);
  const center = (slices[1][3] + slices[1][4]) / 2;
  assert.ok(Math.abs(((center + Math.PI / 2) % (2 * Math.PI))) < 1e-8);
});

test('confirmed counts survive when the app is reopened', () => {
  const app = openApp();
  app.spin();
  app.click('confirmBtn');
  const reopened = openApp(Object.fromEntries(app.storage));
  reopened.el('wheel').listeners.pointermove({ clientX: 350, clientY: 280 });
  assert.equal(reopened.el('sliceTooltip').textContent, 'Alice\n1 turn\n9.1% chance of landing');
});

test('a person stays in the name list when their turn is confirmed', () => {
  const app = openApp();
  app.spin();
  assert.match(app.el('names').value, /Alice/);
  app.click('confirmBtn');
  assert.match(app.el('names').value, /Alice/);
  assert.equal(app.counts().Alice, 1);
});

test('a pending result is discarded when the name list changes', () => {
  const app = openApp();
  app.spin();
  app.el('names').value = 'Bob\nCarol';
  app.click('saveBtn');
  app.click('confirmBtn');
  assert.deepEqual(app.counts(), {});
  assert.equal(app.el('confirmBtn').hidden, true);
});

test('each person appears once when duplicate names are saved', () => {
  const app = openApp();
  app.el('names').value = 'Alice\nAlice\nBob';
  app.click('saveBtn');
  assert.deepEqual(JSON.parse(app.storage.get(NAMES)), ['Alice', 'Bob']);
});

test('invalid saved counts start at zero when the app loads', () => {
  const app = openApp({ [COUNTS]: '{"Alice":-3,"Bob":"4","Carol":1.5}' });
  app.spin();
  app.click('confirmBtn');
  assert.equal(app.counts().Alice, 1);
  assert.equal(app.counts().Bob, undefined);
  assert.equal(app.counts().Carol, undefined);
});

test('each person gets an equal slice when their confirmed counts are equal', () => {
  const app = openApp({ [NAMES]: '["Alice","Bob"]', [COUNTS]: '{"Alice":4,"Bob":4}' });
  const slices = app.arcs.slice(0, 2);
  assert.equal(slices[0][4] - slices[0][3], Math.PI);
  assert.equal(slices[1][4] - slices[1][3], Math.PI);
});

test('the active selection stays valid when names are saved during a spin', () => {
  const app = openApp();
  app.click('spinBtn');
  app.el('names').value = 'Bob';
  assert.equal(app.el('saveBtn').disabled, true);
  app.click('saveBtn');
  app.spin();
  app.click('confirmBtn');
  assert.deepEqual(app.counts(), { Alice: 1 });
});

test('a person keeps their confirmed count when their name is removed and re-added', () => {
  const app = openApp();
  app.spin();
  app.click('confirmBtn');
  app.el('names').value = 'Bob';
  app.click('saveBtn');
  app.el('names').value = 'Alice\nBob';
  app.click('saveBtn');
  app.spin();
  app.click('confirmBtn');
  assert.equal(app.counts().Alice, 2);
});

test('a person stays on the wheel when they are the only participant', () => {
  const app = openApp({ [NAMES]: '["Alice"]' });
  app.spin();
  app.click('confirmBtn');
  assert.equal(app.el('names').value, 'Alice');
  assert.deepEqual(app.counts(), { Alice: 1 });
});

test('the pointer stays on the confirmed person when their slice shrinks', () => {
  const app = openApp({ [NAMES]: '["Alice","Bob"]' });
  app.spin();
  app.click('confirmBtn');
  const aliceSlice = app.arcs.slice(-3)[0];
  const center = (aliceSlice[3] + aliceSlice[4]) / 2;
  assert.ok(Math.abs((center + Math.PI / 2) % (Math.PI * 2)) < 1e-8);
});

test('a person’s turn count appears when their slice is hovered', () => {
  const app = openApp({ [COUNTS]: '{"Alice":3}' });
  // With six people Alice's smaller slice occupies the first 17 degrees.
  app.el('wheel').listeners.pointermove({ clientX: 370, clientY: 240 });
  assert.equal(app.el('sliceTooltip').hidden, false);
  assert.equal(app.el('sliceTooltip').textContent, 'Alice\n3 turns\n4.8% chance of landing');
});

test('the tooltip shows an equal landing chance when two people have equal turn counts', () => {
  const app = openApp({ [NAMES]: '["David","Bob"]', [COUNTS]: '{"David":1,"Bob":1}' });
  app.el('wheel').listeners.pointermove({ clientX: 350, clientY: 280 });
  assert.equal(app.el('sliceTooltip').textContent, 'David\n1 turn\n50% chance of landing');
});

test('the tooltip shows the weighted landing chance when turn counts differ', () => {
  const app = openApp({ [NAMES]: '["Alice","Bob"]', [COUNTS]: '{"Alice":3}' });
  app.el('wheel').listeners.pointermove({ clientX: 350, clientY: 280 });
  assert.equal(app.el('sliceTooltip').textContent, 'Alice\n3 turns\n20% chance of landing');
});

test('the turn tooltip hides when the pointer leaves the wheel', () => {
  const app = openApp();
  app.el('wheel').listeners.pointermove({ clientX: 350, clientY: 280 });
  app.el('wheel').listeners.pointerleave();
  assert.equal(app.el('sliceTooltip').hidden, true);
});

test('the turn tooltip hides when a spin starts', () => {
  const app = openApp();
  app.el('wheel').listeners.pointermove({ clientX: 350, clientY: 280 });
  app.click('spinBtn');
  assert.equal(app.el('sliceTooltip').hidden, true);
});

test('the turn tooltip stays hidden when the pointer is outside the wheel', () => {
  const app = openApp();
  app.el('wheel').listeners.pointermove({ clientX: 10, clientY: 20 });
  assert.equal(app.el('sliceTooltip').hidden, true);
});
