// The override supports a local sbdiff checkout with an unreleased E2E fixture.
const { test, expect } = await import(
  process.env.SBDIFF_FIXTURE || '@uipath/storybook-visual-diff/e2e'
);
const baseline = process.env.SBDIFF_E2E_SIDE === 'baseline';
const countsKey = 'standup-roulette-counts';
const winnersKey = 'standup-roulette-winners';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.errors = errors;
  await page.clock.install({ time: new Date('2026-11-02T12:00:00-05:00') });
  await page.addInitScript(() => { Math.random = () => 0.05; });
});

test.afterEach(async ({ page }) => {
  expect(page.errors, 'browser errors').toEqual([]);
});

async function spin(page) {
  await page.locator('#spinBtn').click();
  await page.clock.runFor(32);
  await page.clock.fastForward(5000);
  await expect(page.locator('#spinBtn')).toHaveText('SPIN');
  await expect(page.locator('#result .name')).toHaveText('Alice');
}

async function readSaved(page, key) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), key);
}

async function hoverAlice(page, count, chance, atTop = false) {
  const bounds = await page.locator('#wheel').boundingBox();
  await page.locator('#wheel').hover({ position: {
    x: bounds.width * (atTop ? 0.5 : 0.8),
    y: bounds.height * (atTop ? 0.18 : 0.55),
  } });
  await expect(page.getByRole('tooltip')).toHaveText(`Alice\n${count} ${count === 1 ? 'turn' : 'turns'}\n${chance} chance of landing`);
}

test('a turn is saved when the selected person is confirmed', async ({ page, milestone }) => {
  await page.goto('/');
  await milestone('Initial wheel', { clip: page.locator('.stage') });
  await milestone('Initial page', { fullPage: true });
  await spin(page);
  if (!baseline) {
    await expect(page.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
    await expect(page.getByText('Confirmed turns', { exact: true })).toHaveCount(0);
    expect(await readSaved(page, countsKey)).toEqual({});
    expect(await readSaved(page, winnersKey)).toEqual({});
  }
  await milestone('Selected person', { fullPage: true });
  if (!baseline) await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  expect(Object.values(await readSaved(page, winnersKey))).toContain('Alice');
  if (!baseline) {
    expect(await readSaved(page, countsKey)).toEqual({ Alice: 1 });
    await expect(page.locator('#confirmBtn')).toBeHidden();
    await hoverAlice(page, 1, '9.1%', true);
  }
  await milestone('Recorded turn', { fullPage: true });
  await page.reload();
  if (!baseline) {
    expect(await readSaved(page, countsKey)).toEqual({ Alice: 1 });
    await hoverAlice(page, 1, '9.1%');
  }
  await milestone('Saved turn after reload', { fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a selection stays uncounted when another spin replaces it', async ({ page, milestone }) => {
  await page.goto('/');
  await spin(page);
  await page.locator('#spinBtn').click();
  if (!baseline) {
    await expect(page.locator('#confirmBtn')).toBeHidden();
    expect(await readSaved(page, countsKey)).toEqual({});
    expect(await readSaved(page, winnersKey)).toEqual({});
  }
  await page.clock.runFor(32);
  await page.clock.fastForward(5000);
  await expect(page.locator('#result .name')).toHaveText('Alice');
  await milestone('Replacement selection', { fullPage: true });
  await page.reload();
  if (!baseline) expect(await readSaved(page, countsKey)).toEqual({});
});

test('a person stays in the name list when their turn is confirmed', async ({ page, milestone }) => {
  await page.goto('/');
  await page.locator('#controls summary').click();
  if (!baseline) await expect(page.getByRole('checkbox')).toHaveCount(0);
  await spin(page);
  if (!baseline) await expect(page.locator('#names')).toHaveValue(/Alice/);
  await milestone('Selected person in name list', { fullPage: true });
  if (!baseline) await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#names')).toHaveValue(/Alice/);
  if (!baseline) expect(await readSaved(page, countsKey)).toEqual({ Alice: 1 });
  await milestone('Confirmed person remains in name list', { fullPage: true });
});

test('frequent participants get smaller slices when saved counts differ', async ({ page, milestone }) => {
  await page.addInitScript(() => {
    localStorage.setItem('standup-roulette-names', '["Alice","Bob","Carol"]');
    localStorage.setItem('standup-roulette-counts', '{"Alice":3,"Bob":1}');
  });
  await page.goto('/');
  if (!baseline) {
    await expect(page.locator('#wheel')).toHaveAttribute('aria-label', /Alice: 3 turns.*Bob: 1 turn/);
  }
  await milestone('Wheel with unequal counts', { clip: page.locator('.stage') });
  if (!baseline) await hoverAlice(page, 3, '14.3%');
  await milestone('Turn count on hover', { fullPage: true });
  if (!baseline) {
    await page.mouse.move(0, 0);
    await expect(page.getByRole('tooltip')).toBeHidden();
  }
});
