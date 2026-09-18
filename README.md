# OrangeHRM Playwright Automation

Playwright end-to-end tests for the OrangeHRM demo application, using TypeScript, page objects, and typed fixtures.

## Setup

1. Install Node.js 22 or newer.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env` and set the environment-specific values.
4. Install browsers with `npx playwright install`.

`EMPLOYEE_SEARCH_TERM` and `EMPLOYEE_NAME` must identify an employee that already exists in the target environment. The Admin test does not mutate that employee; it creates and removes only the test Admin user.

## Commands

- `npm test` runs the test suite.
- `npm run test:headed` runs tests in a visible browser.
- `npm run test:ui` opens Playwright UI mode.
- `npm run lint` checks ESLint rules.
- `npm run format:check` checks formatting.
- `npm run typecheck` runs strict TypeScript validation.
- `npm run report` opens the latest HTML report.

The Admin scenario selects an employee from the environment's autocomplete results, so it does not depend on a particular demo employee name. The created user is deleted after the save assertion completes.
