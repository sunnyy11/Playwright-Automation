# Playwright Automation — Code Standards Review

**Project:** `D:\Playwright Automation\Playwright`
**Reviewed:** 2026-09-18
**Target app:** OrangeHRM demo
**Scope:** Structure, config, Page Object Model, fixtures, tests, reporting, CI, repo hygiene, security.

---

## Overall verdict

**Grade: ~7/10 — a solid, well-architected intermediate framework that is roughly 70% of the way to a professional-grade suite.**

The bones are right. You are already using the patterns a good Playwright framework should have: the Page Object Model, fixture-based dependency injection, typed page objects, web-first assertions, environment-driven configuration, a custom HTML report, and a working CI pipeline. That puts this well ahead of a typical beginner project.

The gap between "good" and "industry standard" here is not architecture — it's **tooling discipline, locator reliability, test-data independence, and repository hygiene**. None of the issues are hard to fix, and addressing the High-priority items below would move this to a genuinely professional setup.

---

## What you are doing well

- **Page Object Model done properly** — locators are declared as `readonly` class properties, constructors are typed (`Page`, `Locator`), and actions are exposed as intention-revealing methods. This is the correct structure.
- **Fixture-based DI** — `fixtures/pom.fixture.ts` cleanly extends the base `test` and injects page objects. This is the modern, recommended alternative to instantiating page objects in every test.
- **Web-first assertions** — tests use auto-retrying assertions (`toBeVisible`, `toHaveURL`, `toHaveValue`, `toHaveText`) rather than manual waits. This is exactly right and avoids flakiness.
- **Good locator choices in most places** — `getByRole`, `getByText` with `exact` are used in the dashboard and parts of the admin page. These are the resilient, accessibility-aligned locators Playwright recommends.
- **Environment-driven `baseURL`** — pulled from `.env` via `dotenv`, and `.env` is correctly git-ignored (verified: not tracked).
- **Dynamic test data** — the admin test uses `@faker-js/faker` to generate unique usernames/passwords, avoiding collisions on re-runs.
- **Sensible CI** — `playwright.yml` checks out, pins Node LTS, uses `npm ci`, installs browsers `--with-deps`, runs tests, and uploads the HTML report as an artifact. `forbidOnly` and CI-only retries are configured.
- **Reporter safety** — the custom Extent reporter escapes HTML before injecting values, avoiding broken markup / injection in the report.

---

## Findings by priority

### 🔴 High priority

**1. No linting or formatting tooling (ESLint + Prettier).**
There is no `.eslintrc`/`eslint.config.*` and no `.prettierrc`. For any team-facing TypeScript project this is the single biggest "standards" gap — it is what keeps style consistent and catches bugs (floating promises, unused vars, missing `await`) before review. Add ESLint (with `@typescript-eslint` and ideally `eslint-plugin-playwright`) and Prettier.

**2. No `tsconfig.json`.**
The project is TypeScript but has no compiler config. Playwright transpiles on the fly so tests still run, but you lose editor IntelliSense guarantees, strict type-checking, and a `typecheck` step in CI. Add a `tsconfig.json` with `strict: true`.

**3. No npm scripts.**
`package.json` has `"scripts": {}`. There is no `npm test`, no `npm run test:headed`, no `report` script. Standard practice is to expose the common commands so contributors and CI don't rely on memorized `npx` invocations.

**4. Throwaway artifacts committed to git.**
48 files under `.playwright-mcp/` (MCP console logs and page snapshots) are tracked in the repository, and the directory is not in `.gitignore`. These are machine-generated debug artifacts and should not be in version control. Add `.playwright-mcp/` to `.gitignore` and `git rm -r --cached .playwright-mcp/`.

**5. Brittle locators + test-data coupling in the admin flow.**
- `admin.page.ts` relies on framework-internal CSS classes and positional selectors: `div.oxd-select-text`, `.first()`, `.nth(1)`, `input[autocomplete="off"]`, `input[type="password"]` by index. These break the moment OrangeHRM reorders fields or changes its component library.
- `create-enabled-admin-user.spec.ts` hardcodes a specific employee — `selectEmployee('Ranga', 'Ranga Akunuri')`. This test will **fail on any environment that doesn't already contain that employee record**. Tests should not depend on pre-existing, environment-specific data.

### 🟠 Medium priority

**6. Hardcoded credentials in a tracked file.**
`config.ts` contains `username: 'Admin', password: 'admin123'` and is committed. These are OrangeHRM's *public* demo credentials, so this is not a real secret leak — but the *pattern* is not standard. Credentials should come from environment variables (e.g. `process.env.ADMIN_USER`), with `.env` holding the values locally and CI secrets in the pipeline.

**7. Misleading method name + dead code in `login.page.ts`.**
- `login()` only *fills* the fields; it does not submit. Callers must remember to also call `submit()`. Either rename to `enterCredentials()` or have `login()` fill **and** submit for a true action method.
- `expectRequiredFieldErrors()` is never used (tests assert inline instead) and uses the older `page.locator('text=Required')` engine while the tests use `getByText('Required', { exact: true })`. Remove the dead method or converge on one approach.

**8. `goto()` bypasses the configured `baseURL`.**
`login.page.ts` does `page.goto(process.env.BASE_URL ?? '')`. Since `baseURL` is already set in `playwright.config.js`, the idiomatic form is `page.goto('/')` — it uses the single configured source of truth instead of re-reading the env var in a page object.

**9. No failure diagnostics configured.**
`use` sets `trace: 'on-first-retry'` (good) but omits `screenshot: 'only-on-failure'` and `video: 'retain-on-failure'`. These are standard for triaging CI failures. Consider also setting explicit `expect.timeout` and an action/navigation timeout.

**10. No authentication reuse.**
Every test logs in through the UI. For a suite of this size it's tolerable, but the standard pattern is a global setup that logs in once and saves `storageState`, so downstream tests start authenticated. This speeds up the suite and isolates the login test as the only one exercising the login UI.

**11. No cleanup for created data.**
The admin test creates a user but never deletes it. Repeated runs accumulate users in the target system. Add teardown (API cleanup or a delete step), or isolate against a resettable environment.

### 🟡 Low priority / polish

**12. No root `README.md`.** There is a `specs/README.md`, but the repository root has no README explaining setup, how to run, env vars, or structure. This is expected for any shared repo.

**13. `package.json` metadata is placeholder.** `name` is `"playwright"` (collides conceptually with the real package), `description`/`author` are empty, `version` is `1.0.0`. Tidy these up.

**14. Module-type inconsistency.** `package.json` declares `"type": "commonjs"`, but `playwright.config.js` uses ESM `import`/`export default` syntax. Playwright's loader handles this, so it works — but it's technically inconsistent. Consider `"type": "module"` or a `.mjs`/`.ts` config.

**15. Uncommitted deletion in flight.** `tests/seed.spec.ts` is tracked in git but deleted from the working tree (and `config.ts`, all pages, the fixture, and the reporter show uncommitted modifications). Commit or restore so the repo is in a clean, coherent state.

**16. Cross-browser projects are commented out.** Only `chromium` runs; Firefox/WebKit/mobile are stubbed out. Fine for now, but real cross-browser coverage is a common expectation — enable at least one more when the suite stabilizes.

**17. Missing `.editorconfig` / `.nvmrc`.** Minor, but both help enforce consistent editors and Node versions across a team.

**18. CI could go further.** Consider caching npm and browser binaries, uploading the Extent report (not just the Playwright HTML report), and a browser matrix once cross-browser is enabled.

---

## Suggested quick-win order

1. Add `.playwright-mcp/` to `.gitignore` and untrack it; commit the in-flight changes so the tree is clean. *(hygiene, 5 min)*
2. Add `tsconfig.json`, ESLint, Prettier, and npm scripts. *(tooling backbone)*
3. Move credentials to env vars; use `page.goto('/')` via `baseURL`. *(config discipline)*
4. Add `screenshot`/`video` on failure to the config. *(diagnostics)*
5. De-brittle the admin locators and remove the employee-data dependency. *(reliability)*
6. Clean up `login.page.ts` (method naming + dead code); add a root README. *(clarity)*

---

*This review reflects Playwright and TypeScript testing conventions as commonly applied in professional QA automation teams. Items are prioritized by impact on reliability, maintainability, and collaboration — not by effort.*
