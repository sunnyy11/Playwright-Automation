# AGENT.md — Playwright + TypeScript Test Automation Standards

> **What this file is.** This is the authoritative coding standard for our Playwright
> end‑to‑end test framework. It is written to be read two ways:
> 1. **By an AI coding agent** (Claude Code, Cursor, Copilot, etc.) as a set of binding
>    directives. When you generate or modify test code in this repository, you **must**
>    conform to every rule below. Treat *MUST / MUST NOT* as non‑negotiable and
>    *SHOULD / PREFER* as strong defaults you deviate from only with a stated reason.
> 2. **By engineers** as a reference for how we build, review, and maintain tests.
>
> **Stack:** Playwright Test (`@playwright/test`) · TypeScript (strict) · Node.js LTS.
> **Last reviewed:** 2026-09-18 · **Owner:** QA Engineering / SDET Guild.

---

## 0. Golden Rules (the short version)

If you remember nothing else, remember these. Everything later expands on them.

1. **Use user‑facing, role‑based locators.** `getByRole` / `getByLabel` / `getByText`
   first; `getByTestId` when semantics aren't enough. **Never** raw XPath or brittle
   CSS chains.
2. **Use web‑first, auto‑retrying assertions.** `await expect(locator).toBeVisible()`.
   **Never** `page.waitForTimeout()` (no hard‑coded sleeps).
3. **Tests are independent and isolated.** No shared mutable state, no ordering
   dependencies, safe to run in parallel and in any order.
4. **Every test creates its own data and cleans up after itself.** No reliance on data
   left behind by another test or a previous run.
5. **Page Objects model the page; tests own the assertions and the intent.** Keep
   locators and actions in Page Objects, keep `expect` in the spec (see §8 for the
   documented exception).
6. **No secrets in code.** Credentials and environment config come from environment
   variables / secret stores only.
7. **A flaky test is a bug.** Fix the root cause or quarantine it with a tracking
   ticket — never paper over it with retries or sleeps.
8. **The pipeline is the source of truth.** If it doesn't pass in CI, it isn't done.

---

## 1. Repository Structure

Use a predictable, feature‑oriented layout. Do not invent new top‑level folders without
updating this document.

```
repo-root/
├─ tests/                     # Specs only. Mirrors application feature areas.
│  ├─ auth/
│  │  └─ login.spec.ts
│  ├─ checkout/
│  │  └─ checkout.spec.ts
│  └─ api/
│     └─ orders.api.spec.ts
├─ src/
│  ├─ pages/                  # Page Objects (one class per page/major view)
│  │  ├─ LoginPage.ts
│  │  └─ CheckoutPage.ts
│  ├─ components/             # Reusable component objects (header, nav, modals)
│  ├─ fixtures/               # Custom Playwright fixtures + merged `test` export
│  │  └─ test-options.ts
│  ├─ api/                    # API clients / service wrappers
│  ├─ data/                   # Test-data factories & builders (no static dumps)
│  ├─ utils/                  # Pure helpers (dates, formatting, generators)
│  └─ config/                 # env parsing, constants, endpoint maps
├─ playwright.config.ts       # Single source of run config
├─ .env.example               # Documents required env vars (no real values)
├─ package.json
├─ tsconfig.json
├─ eslint.config.mjs
├─ .prettierrc
└─ AGENT.md                   # This file
```

**Rules**

- **Specs live only under `tests/`** and end in `.spec.ts`. No page objects, helpers, or
  fixtures inside `tests/`.
- **One Page Object per file**, named `PascalCasePage.ts`, class name matches file name.
- Mirror the application's information architecture in folder names so a newcomer can
  find the test for a feature by guessing the path.
- Keep files small. If a Page Object exceeds ~200 lines, extract component objects.

---

## 2. Tooling, Dependencies & Environment

- **Node.js:** current LTS. Pin it in `.nvmrc` and `package.json` `engines`.
- **Package manager:** one, committed lockfile (`npm`, `pnpm`, or `yarn` — pick one and
  do not mix). Commit the lockfile.
- **Install browsers in CI** with `npx playwright install --with-deps`.
- **Keep `@playwright/test` current.** Upgrade deliberately and read the changelog;
  Playwright ships behavior improvements frequently.
- **Required dev tooling:** ESLint (with `@typescript-eslint`), Prettier, and
  `eslint-plugin-playwright`. Lint and format are enforced in CI, not optional.

Minimum npm scripts (names are a contract other tooling depends on):

```jsonc
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:smoke": "playwright test --grep @smoke",
    "test:debug": "PWDEBUG=1 playwright test",
    "report": "playwright show-report",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 3. TypeScript Standards

- **`strict: true`** in `tsconfig.json`. Also enable `noUncheckedIndexedAccess` and
  `noImplicitOverride`. No loosening without team sign‑off.
- **No `any`.** Use precise types, generics, or `unknown` + narrowing. `any` fails lint.
- **No non‑null assertions (`!`) to silence the compiler.** Handle the null case.
- **Prefer `type`/`interface`** for data shapes; export them from a typed module rather
  than redefining inline in multiple specs.
- **`async/await` everywhere** for Playwright calls. Every Playwright API that returns a
  Promise **must** be awaited. Enable `eslint-plugin-playwright`'s
  `missing-playwright-await` plus `@typescript-eslint/no-floating-promises` — a forgotten `await` is the #1
  cause of "impossible" flakiness.
- **No magic values.** Route paths, timeouts, roles, and user strings become named
  constants or config, not inline literals scattered across specs.
- **Path aliases** (`@pages/*`, `@fixtures/*`) via `tsconfig` `paths` to avoid
  `../../../` import chains.

---

## 4. Naming Conventions

| Element                 | Convention                    | Example                              |
|-------------------------|-------------------------------|--------------------------------------|
| Spec file               | `kebab-or-feature.spec.ts`    | `login.spec.ts`                      |
| Page Object file/class  | `PascalCasePage`              | `CheckoutPage.ts` → `CheckoutPage`   |
| Component object        | `PascalCaseComponent`         | `NavBarComponent`                    |
| Fixture                 | `camelCase`                   | `loginPage`, `authedRequest`         |
| Variables / functions   | `camelCase`                   | `expectedTotal`, `createUser()`      |
| Constants / enums       | `UPPER_SNAKE` / `PascalCase`  | `DEFAULT_TIMEOUT`, `UserRole.Admin`  |
| Test titles             | Behavior sentence             | `'shows an error for invalid password'` |

**Test titles describe behavior from the user's perspective**, not implementation.
Good: `'prevents checkout when the cart is empty'`. Bad: `'test checkout 2'` or
`'clickButton()'`.

---

## 5. Locator Strategy (highest‑impact rule set)

Resilient locators are the single biggest factor in whether a suite is maintainable.
Use this **priority order** and stop at the first that fits:

1. **Role + accessible name** — `page.getByRole('button', { name: 'Sign in' })`
2. **Label / placeholder / text** — `getByLabel('Email')`, `getByText('Welcome')`
3. **Test id** — `getByTestId('cart-total')` *(add `data-testid` to the app when
   semantics are insufficient — coordinate with devs; treat test ids as a real contract)*
4. **CSS scoped to a stable attribute** — only as a last resort, and never styling
   classes.

```ts
// GOOD — user-facing, resilient, self-documenting
await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
await page.getByRole('button', { name: 'Sign in' }).click();
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

// BAD — brittle, tied to DOM structure and styling
await page.locator('//div[2]/form/input[1]').fill(user.email);   // XPath — forbidden
await page.locator('.btn.btn-primary.mt-4').click();             // styling classes
await page.click('#app > div > div:nth-child(3) button');        // structural CSS
```

**Rules**

- **MUST NOT** use XPath, `nth-child` chains, auto‑generated hashed class names, or
  text that is likely to be re‑worded frequently.
- **Prefer `getByRole`** — it doubles as a lightweight accessibility check.
- **Chain and filter** for scope instead of building long selectors:
  `page.getByRole('listitem').filter({ hasText: 'Pro plan' }).getByRole('button')`.
- **Store locators as methods/getters on Page Objects**, not copy‑pasted across specs.
- **One locator, one meaning.** If a locator resolves to multiple elements unintentionally,
  scope it; don't rely on `.first()` to hide ambiguity.

---

## 6. Assertions

- **Always use Playwright's web‑first, auto‑retrying assertions** (`expect(locator)…`,
  `expect(page)…`, `expect(response)…`). They poll until the condition is met or the
  timeout expires — this is how we avoid manual waits.
- **`await` every `expect` on a locator/page/response.** A missing `await` turns a real
  assertion into a no‑op.

```ts
// GOOD — retries until true or times out
await expect(page.getByRole('alert')).toHaveText('Payment received');
await expect(page).toHaveURL(/\/dashboard/);
await expect(page.getByTestId('cart-count')).toHaveText('3');

// BAD — reads state once, no retry; flaky by construction
expect(await page.getByRole('alert').textContent()).toBe('Payment received');
```

**Rules**

- **PREFER** semantic matchers (`toBeVisible`, `toBeEnabled`, `toHaveText`,
  `toHaveValue`, `toHaveCount`) over manual value extraction + `toBe`.
- **Use `expect.soft`** when you want a test to check several independent facts and
  report all failures at once (e.g. validating many fields on a page). Don't overuse it
  where a hard failure should stop the test.
- **Assert intent, not incidental detail.** Check the outcome the user cares about.
- **Assertions belong in the spec** (see §8 for the Page Object exception).
- Tune assertion timeouts globally in config (`expect.timeout`); override per‑assertion
  only for genuinely slow operations, with a comment saying why.

---

## 7. Waiting & Synchronization

- **NEVER `page.waitForTimeout(ms)` in committed code.** Hard sleeps are banned. They are
  either too short (flaky) or too long (slow), always. `eslint-plugin-playwright`'s
  `no-wait-for-timeout` enforces this.
- **Rely on auto‑waiting.** Playwright actions (`click`, `fill`, …) auto‑wait for the
  element to be actionable. Web‑first assertions auto‑wait for state.
- **When you must wait for an event, wait for the specific signal**, not the clock:
  `page.waitForResponse(...)`, `page.waitForURL(...)`, or an assertion on the resulting
  UI state.
- **Set up "wait for response" before the action that triggers it** to avoid races:

```ts
const responsePromise = page.waitForResponse('**/api/orders');
await page.getByRole('button', { name: 'Place order' }).click();
const response = await responsePromise;
expect(response.ok()).toBeTruthy();
```

---

## 8. Page Object Model (POM)

We use POM to keep locators and page interactions in one place so a UI change is a
one‑line fix.

**Rules**

- A Page Object **encapsulates locators and user actions** for one page/view.
- **Expose locators via readonly properties/getters**; expose intent‑revealing action
  methods (`login()`, `addToCart()`), not low‑level click wrappers.
- **Take `page` (or fixtures) via the constructor.** No global page.
- **Return other Page Objects** from navigation actions when it aids flow
  (`await loginPage.login() → returns DashboardPage`), or return `void` and let the test
  instantiate the next page — pick one convention and keep it consistent.
- **Keep assertions in the spec by default.** *Exception:* a small number of
  `expectLoaded()`‑style self‑verification methods on a Page Object are acceptable to
  confirm the page is ready; keep behavioral assertions in the test.
- **No test logic, no test data, no conditionals branching on business rules** inside a
  Page Object. It models the page, it doesn't decide what to test.

```ts
// src/pages/LoginPage.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByRole('textbox', { name: 'Email' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.submit = page.getByRole('button', { name: 'Sign in' });
    this.error = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
```

```ts
// tests/auth/login.spec.ts
import { test, expect } from '@fixtures/test-options';

test('shows an error for an invalid password', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login('user@example.com', 'wrong-password');

  await expect(loginPage.error).toHaveText('Invalid email or password');
  await expect(page).toHaveURL(/\/login/);
});
```

---

## 9. Fixtures (dependency injection — prefer over `beforeEach` boilerplate)

Custom fixtures are the idiomatic Playwright way to provide ready‑to‑use Page Objects,
authenticated contexts, and test data. Prefer them to repetitive `beforeEach` setup.

```ts
// src/fixtures/test-options.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { CheckoutPage } from '@pages/CheckoutPage';

type Pages = {
  loginPage: LoginPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from '@playwright/test';
```

**Rules**

- **Import `test` and `expect` from the merged fixtures module**, not directly from
  `@playwright/test`, in specs that need custom fixtures.
- **Do teardown after `use()`** in the fixture (close resources, delete created data).
- **Use `worker`‑scoped fixtures** for expensive once‑per‑worker setup (e.g. an
  authenticated API context); **test‑scoped** for per‑test data.
- **Compose, don't copy.** Merge fixtures with `mergeTests` when a suite needs several
  fixture modules.

---

## 10. Test Structure, Steps & Tagging

- **One behavior per test.** A test verifies a single meaningful outcome. Don't chain
  ten unrelated assertions to "save time" — you lose signal on failure.
- **Follow Arrange‑Act‑Assert.** Keep the three phases visually distinct.
- **Group with `test.describe`** by feature/screen. Keep nesting shallow (one, maybe two
  levels).
- **Use `test.step()`** to give long flows readable structure in the report and trace.
- **Keep hooks light.** `beforeEach` for navigation/preconditions only; prefer fixtures
  for object creation.
- **No conditionals or loops that change what is asserted.** If a test has an `if` around
  an assertion, split it into two tests.

```ts
test('completes checkout with a saved card', async ({ checkoutPage, page }) => {
  await test.step('open cart with one item', async () => {
    await checkoutPage.gotoWithItem('SKU-123');
  });

  await test.step('pay with the saved card', async () => {
    await checkoutPage.paySavedCard();
  });

  await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();
});
```

**Tagging & selection**

- Tag tests for selective runs using the `tag` option: `@smoke`, `@regression`,
  `@slow`, `@flaky-quarantine`.
- Run subsets with `--grep @smoke` / `--grep-invert @slow`.

```ts
test('critical login path', { tag: '@smoke' }, async ({ loginPage }) => { /* ... */ });
```

- **Use annotations** (`test.fixme`, `test.skip`, `test.fail`, `test.slow`) with a reason
  string and, ideally, a ticket link. A bare `test.skip()` with no reason is not allowed.

---

## 11. Test Data Management

- **Generate data; don't hardcode it.** Use factories/builders (optionally with
  `@faker-js/faker`) so each run uses fresh, unique values and tests don't collide when
  run in parallel.
- **Each test owns its data lifecycle.** Create what you need (prefer creating it via API
  for speed — see §12), and clean it up in fixture teardown or an `afterEach`.
- **No dependence on pre‑existing "magic" records** in a shared environment. If a seeded
  account is unavoidable, document it in `config/` and never mutate it.
- **Keep secrets/credentials out of data files.** Test *users'* credentials come from env
  (§17), not from a committed JSON.

```ts
// src/data/user-factory.ts
import { faker } from '@faker-js/faker';

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    email: faker.internet.email({ provider: 'example.test' }).toLowerCase(),
    password: `Pw!${faker.string.alphanumeric(12)}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    ...overrides,
  };
}
```

---

## 12. Configuration (`playwright.config.ts`)

Centralize all run configuration. Keep environment‑specific values in env vars, not in
code.

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,                 // run tests within files in parallel
  forbidOnly: !!process.env.CI,        // fail CI if someone left test.only
  retries: process.env.CI ? 2 : 0,     // retry ONLY in CI; 0 locally to expose flakiness
  workers: process.env.CI ? '50%' : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['blob'], ['github'], ['junit', { outputFile: 'results.xml' }]]
    : [['html', { open: 'on-failure' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',           // full trace when a test retries
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    testIdAttribute: 'data-testid',
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'], storageState: '.auth/user.json' }, dependencies: ['setup'] },
    { name: 'webkit',   use: { ...devices['Desktop Safari'],  storageState: '.auth/user.json' }, dependencies: ['setup'] },
  ],
  // Spin up the app under test locally so devs can run E2E with one command.
  webServer: process.env.CI ? undefined : {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
```

**Rules**

- **`baseURL` in config**, then use relative paths (`page.goto('/login')`). No hardcoded
  full URLs in specs.
- **`retries` = 0 locally, ≤ 2 in CI.** Retries mask flakiness; use them only to absorb
  rare infra noise in CI, and treat any test that only passes on retry as a defect.
- **`trace: 'on-first-retry'`** (or `retain-on-failure`) so every CI failure is
  debuggable without re‑running.
- **`forbidOnly` in CI** so a stray `test.only` can never silently skip the suite.

---

## 13. Authentication & Session Reuse

- **Authenticate once, reuse the session.** Do login in a **setup project** (or global
  setup), save `storageState`, and have other projects consume it via
  `use: { storageState }`. Don't log in through the UI in every test.
- **Use multiple storage states** for multiple roles (admin, standard user), one file
  each.
- **For tests that must exercise the login UI itself**, opt out of stored auth with
  `test.use({ storageState: { cookies: [], origins: [] } })`.

```ts
// tests/global.setup.ts  (runs as the "setup" project)
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(process.env.E2E_USER!, process.env.E2E_PASSWORD!);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
```

---

## 13a. Authentication token / secret handling

- Credentials come from env vars (`process.env.E2E_USER`, `E2E_PASSWORD`), never
  committed.
- The `.auth/` directory holding storage state **must be git‑ignored** — it contains live
  session tokens.

---

## 14. API Testing & API‑Assisted Setup

Playwright's `request` context does real HTTP. Use it two ways:

1. **Pure API specs** for backend contract/behavior (`orders.api.spec.ts`).
2. **API‑assisted UI tests** — create/tear down state via API (fast, reliable) and only
   *exercise* the feature through the UI. Prefer this to clicking through setup screens.

```ts
test('displays orders created via API', async ({ page, request }) => {
  // Arrange via API (fast, deterministic)
  const res = await request.post('/api/orders', { data: buildOrder() });
  expect(res.ok()).toBeTruthy();
  const { id } = await res.json();

  // Act + Assert via UI
  await page.goto(`/orders/${id}`);
  await expect(page.getByRole('heading', { name: 'Order details' })).toBeVisible();
});
```

**Rules**

- **Assert on status and body** for API calls (`response.ok()`, status code, schema).
- **Reuse an authenticated `request` context** via a fixture rather than re‑authing per
  call.
- **Validate response shape**, not just status — a 200 with the wrong body is still a bug.

---

## 15. Network Interception & Mocking

- **Mock third‑party / unstable dependencies** (payment providers, flaky external APIs)
  with `page.route()` to keep tests deterministic — but keep a small set of true
  end‑to‑end tests that hit the real integrations.
- **Don't mock the system under test.** If you mock your own backend, you're testing the
  mock. Mock only what you don't own or can't control.
- **Prefer HAR replay** (`routeFromHAR`) for large/complex response sets over
  hand‑written fixtures.

```ts
await page.route('**/api/payments', async (route) => {
  await route.fulfill({ status: 200, json: { status: 'approved', id: 'pay_test_123' } });
});
```

---

## 16. Visual Regression Testing

- **Use `toHaveScreenshot()`** for visual checks; commit baselines deliberately and
  review baseline changes in PRs like code.
- **Mask dynamic regions** (dates, avatars, ads) and set a small `maxDiffPixelRatio` to
  avoid noise.
- **Pin the rendering environment.** Generate/update baselines in the **same OS/browser
  as CI** (run through the CI container or the official Playwright Docker image), since
  fonts and anti‑aliasing differ across platforms.
- Keep visual tests in their own tagged group (`@visual`) so they can be run/updated
  independently.

```ts
await expect(page).toHaveScreenshot('dashboard.png', {
  maxDiffPixelRatio: 0.01,
  mask: [page.getByTestId('last-updated')],
});
```

---

## 17. Accessibility Testing

- **Integrate automated a11y scans** with `@axe-core/playwright` on key pages/flows.
- Automated checks catch a subset of issues — pair them with role‑based locators (§5),
  which enforce a baseline of accessible markup by construction.

```ts
import AxeBuilder from '@axe-core/playwright';

test('dashboard has no critical a11y violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

---

## 18. Parallelism & Isolation

- **`fullyParallel: true`.** Tests must be safe to run concurrently.
- **Every test gets a fresh browser context** (Playwright default) — no cookie/localStorage
  bleed between tests. Don't defeat this by sharing a context manually.
- **No shared mutable module state** between tests. No "test A logs in so test B can run."
- **Unique data per test** (§11) so parallel workers don't collide on the same records.
- **Shard across CI machines** with `--shard=1/4` etc. for large suites; merge reports
  afterward (see §20).

---

## 19. Flakiness Policy

A test that passes and fails without code changes is a **defect**, treated with the same
seriousness as a product bug.

- **Diagnose with the trace**, not by adding waits. Most flakiness is a missing `await`,
  a non‑retrying assertion, or a real race in the app.
- **Never "fix" flakiness by raising retries or adding `waitForTimeout`.**
- **Quarantine, don't ignore:** tag a stubbornly flaky test `@flaky-quarantine`, exclude
  it from the blocking suite, and open a ticket. It comes back only once the root cause
  is fixed.
- **Track flake rate** in CI reporting; a rising flake rate blocks new feature work.

---

## 20. Reporting & Artifacts

- **HTML reporter** for local/human review; **blob reporter** in CI so sharded runs merge
  into one report (`playwright merge-reports`).
- **Add `junit`/`github` reporters in CI** for native pipeline annotations and test
  analytics dashboards.
- **Upload artifacts on failure:** HTML report, traces, screenshots, videos. A failure
  the team can't inspect is a failure they can't fix.
- **`test.step()` and clear titles** make reports readable — invest in them.

---

## 21. CI/CD Integration

- **Run the full suite on every PR** (or at least `@smoke` on PR + full on merge, for very
  large suites).
- **Install browsers with `--with-deps`.** Cache the Playwright browser download between
  runs.
- **Shard** long suites across parallel jobs and **merge blob reports**.
- **Publish the HTML report + traces** as artifacts.
- **Fail closed:** `forbidOnly`, non‑zero exit on any failure, and no "allow failure"
  on the E2E job.

```yaml
# .github/workflows/e2e.yml (illustrative)
name: e2e
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix: { shard: [1, 2, 3, 4] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}/4
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          E2E_USER: ${{ secrets.E2E_USER }}
          E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
          retention-days: 7
```

---

## 22. Debugging & Local Developer Workflow

Standard tools — reach for these instead of `console.log` + sleeps:

- **UI Mode** (`npm run test:ui`) — watch, time‑travel, and pick locators interactively.
- **Trace Viewer** — open the trace from a failing CI run; it has DOM snapshots, network,
  console, and the action timeline.
- **Codegen** (`npx playwright codegen <url>`) — bootstrap locators/flows, then refactor
  into Page Objects (never commit raw codegen output).
- **`--debug` / `PWDEBUG=1`** — step through with the inspector.

---

## 23. Version Control & PR Standards

- **Small, focused PRs.** New tests come with the feature or in a clearly scoped test PR.
- **Conventional Commits** (`test:`, `fix:`, `feat:`, `chore:`) for readable history.
- **CI must be green** (lint, typecheck, tests) before merge — enforced by branch
  protection, not by convention.
- **Review test code like production code:** locator quality, isolation, data cleanup,
  no sleeps, no `only`, no commented‑out tests.
- **`.gitignore`** must include `node_modules/`, `test-results/`, `playwright-report/`,
  `blob-report/`, `.auth/`, `.env`.

---

## 24. Security & Secrets

- **No credentials, tokens, API keys, or PII in the repo** — ever. This includes test
  data files and fixtures.
- **All secrets via env vars / CI secret store.** `.env.example` documents the *names* of
  required variables with placeholder values only.
- **Git‑ignore `.env` and `.auth/`.** Rotate any secret that lands in git history.
- **Least privilege** for test accounts and CI tokens; scope them to the test environment.


## 26. Anti‑Patterns — Forbidden List (quick reference)

The agent **MUST NOT** produce, and reviewers **MUST** reject, any of the following:

- ❌ `page.waitForTimeout()` / hard‑coded sleeps.
- ❌ XPath, `nth-child`/structural CSS, or styling‑class locators.
- ❌ Non‑retrying assertions on extracted values (`expect(await x.textContent()).toBe()`).
- ❌ Missing `await` on Playwright calls / floating promises.
- ❌ `any`, unexplained `!` non‑null assertions, or loosened `strict` settings.
- ❌ Tests that depend on execution order or on data from another test/run.
- ❌ Shared mutable state across tests; reusing one context to "stay logged in".
- ❌ Assertions buried in Page Objects (beyond the small `expectLoaded()` exception).
- ❌ Secrets, tokens, or real PII committed anywhere.
- ❌ Committed `test.only`; `test.skip`/`fixme` without a reason + ticket.
- ❌ Logging in through the UI in every test instead of reusing `storageState`.
- ❌ Raising `retries` or adding waits to hide flakiness.

---

## 27. Definition of Done / PR Checklist

A change is done when **all** of these are true:

- [ ] Tests are independent, isolated, and pass with `--fully-parallel` in any order.
- [ ] Locators follow the §5 priority order (role/label/testid; no XPath/brittle CSS).
- [ ] Only web‑first, awaited assertions; **zero** `waitForTimeout`.
- [ ] Page Objects hold locators/actions; specs hold intent + assertions.
- [ ] Reusable setup uses fixtures; expensive auth uses `storageState`.
- [ ] Each test creates and cleans up its own data; no magic seed dependence.
- [ ] `strict` TypeScript passes; no `any`; `npm run lint`, `typecheck`, `format` clean.
- [ ] No secrets committed; new env vars documented in `.env.example`.
- [ ] Passes in CI (all projects/shards), with trace‑on‑retry enabled.
- [ ] Meaningful test titles; `test.step` used for multi‑step flows; correct tags applied.
- [ ] No `test.only`; any skip/fixme has a reason and a ticket link.

---

### Appendix A — How the AI agent should apply this file

When asked to add or modify tests in this repo:
1. **Read the relevant existing Page Objects/fixtures first** and reuse them; extend
   rather than duplicate.
2. **Generate code that already satisfies §27** — do not produce a draft that violates
   the Forbidden List and rely on review to catch it.
3. **If a rule here conflicts with a request, surface the conflict** and propose a
   compliant alternative instead of silently breaking the standard.
4. **When something isn't covered here, follow official Playwright best‑practice guidance**
   and note the decision so this document can be updated.
