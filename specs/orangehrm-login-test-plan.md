# OrangeHRM login page test plan

## Application Overview

OrangeHRM login page validation covering the core authentication flows, required-field behavior, and error handling on a fresh browser session.

## Test Scenarios

### 1. Login page core scenarios

**Seed:** `tests/seed.spec.ts`

#### 1.1. Successful login with valid credentials

**File:** `tests/login/login-success.spec.ts`

**Steps:**
  1. Navigate to the OrangeHRM login page on a fresh browser session.
    - expect: The page loads with the username field, password field, and Login button visible.
  2. Enter the valid username 'Admin' and password 'admin123'.
    - expect: Both fields accept the input without error styling or blocking.
  3. Click the Login button.
    - expect: The user is redirected to the dashboard page, and the browser URL changes from /auth/login to a dashboard route.
  4. Confirm the main dashboard content is visible after login.
    - expect: The dashboard loads successfully and the user is authenticated.

#### 1.2. Login with empty credentials shows validation error

**File:** `tests/login/login-empty-fields.spec.ts`

**Steps:**
  1. Open the login page in a fresh state.
    - expect: The username and password fields are empty, and the Login button is enabled.
  2. Leave both fields blank and click Login.
    - expect: The page remains on the login screen, and user-friendly validation messages appear for required fields.
  3. Check the field states after submission.
    - expect: The empty required fields are highlighted or display validation feedback, and no dashboard navigation occurs.

#### 1.3. Login with invalid username or password is rejected

**File:** `tests/login/login-invalid-credentials.spec.ts`

**Steps:**
  1. Navigate to the login page and enter a valid-looking username with an incorrect password, such as 'Admin' and 'wrongpass'.
    - expect: The text inputs accept the values without a page crash.
  2. Click Login.
    - expect: The login attempt fails and the user remains on the login page.
  3. Inspect the feedback message or error banner.
    - expect: An authentication error message explains that the credentials are invalid or the account cannot be found.
  4. Verify no redirect occurs.
    - expect: The URL still reflects the login route rather than the dashboard.

#### 1.4. Login with only one required field filled

**File:** `tests/login/login-partial-fields.spec.ts`

**Steps:**
  1. Start from a fresh login page.
    - expect: The page is loaded and both input fields are visible.
  2. Enter a valid username and leave the password empty, then click Login.
    - expect: The form prevents submission and shows a password-required validation error.
  3. Clear the username, enter a password only, and click Login again.
    - expect: The form prevents submission and shows a username-required validation error.
  4. Confirm the page stays on the login screen after both attempts.
    - expect: No dashboard page is opened when either required field is missing.

#### 1.5. Password field masking and input handling

**File:** `tests/login/login-password-behavior.spec.ts`

**Steps:**
  1. Open the login page in a fresh browser session.
    - expect: The password input is visible and displays a masked password entry field.
  2. Type a sample password like 'admin123' into the password field.
    - expect: The entered characters are hidden from direct view while still being accepted by the field.
  3. Move focus away and back to the password field.
    - expect: The field retains the value and does not clear unexpectedly.
  4. Submit with a valid username and the entered password.
    - expect: The login succeeds when the correct credentials are used, confirming the field behaves correctly during input and submission.
