# OrangeHRM Add Admin User Test Plan

## Application Overview

Test coverage for logging into the public OrangeHRM demo, navigating to Admin > User Management, opening Add User, and creating an enabled Admin account with a valid employee association. The plan includes the requested happy path and independent negative and boundary scenarios. Each scenario starts from a fresh browser state and uses the seed setup in tests/seed.spec.ts.

## Test Scenarios

### 1. OrangeHRM User Management

**Seed:** `tests/seed.spec.ts`

#### 1.1. Create an enabled Admin user with valid details

**File:** `tests/admin/create-enabled-admin-user.spec.ts`

**Steps:**
  1. Open https://opensource-demo.orangehrmlive.com/web/index.php/auth/login.
    - expect: The OrangeHRM Login page is displayed with Username, Password, and Login controls.
  2. Enter `Admin` in Username and `admin123` in Password, then click Login.
    - expect: The user is authenticated and the Dashboard page is displayed.
  3. Click the `Admin` menu item in the left navigation panel.
    - expect: The Admin / User Management page is displayed with the System Users heading.
  4. Click the `Add` button.
    - expect: The Add User form is displayed with required fields for User Role, Employee Name, Status, Username, Password, and Confirm Password.
  5. Open User Role and select `Admin`.
    - expect: The User Role field displays `Admin`.
  6. Type an existing employee name into Employee Name, then select an employee from the autocomplete suggestions.
    - expect: The selected employee name is populated from the autocomplete list.
  7. Open Status and select `Enabled`.
    - expect: The Status field displays `Enabled`.
  8. Enter `Admin11` as Username, `Pass123` as Password, and `Pass123` as Confirm Password.
    - expect: All entered values are retained; the two password values match.
  9. Click Save.
    - expect: The user is saved successfully, the Add User form closes or redirects to the System Users list, and a success confirmation is displayed. The new username `Admin11` is listed when the user list is refreshed or searched.

#### 1.2. Reject submission when required Add User fields are empty

**File:** `tests/admin/add-user-required-fields.spec.ts`

**Steps:**
  1. Open the login page, log in with `Admin` / `admin123`, select Admin from the left navigation, and click Add.
    - expect: The Add User form is displayed.
  2. Leave every required field empty and click Save.
    - expect: The form remains open and validation messages are displayed for User Role, Employee Name, Status, Username, Password, and Confirm Password. No user is created.
  3. Fill only one required field at a time and click Save after each attempt.
    - expect: Validation remains for every other missing required field and no partial submission is accepted.

#### 1.3. Reject a password confirmation mismatch

**File:** `tests/admin/add-user-password-validation.spec.ts`

**Steps:**
  1. Log in, open Admin > User Management > Add, select User Role `Admin`, select a valid employee from Employee Name autocomplete, and select Status `Enabled`.
    - expect: The form contains valid values for all non-password required fields.
  2. Enter a valid username, enter `Pass123` in Password, enter a different value such as `Pass124` in Confirm Password, and click Save.
    - expect: A password-mismatch validation message is displayed, the form remains open, and no user is created.
  3. Replace Confirm Password with `Pass123` and click Save.
    - expect: The mismatch validation clears and the submission proceeds to the normal save result, subject to username uniqueness.

#### 1.4. Reject creation when the username already exists

**File:** `tests/admin/add-user-duplicate-username.spec.ts`

**Steps:**
  1. Log in and open the Add User form through Admin > User Management > Add.
    - expect: The Add User form is displayed.
  2. Complete the form with a valid Admin role, valid employee selection, Enabled status, and a username already present in System Users, then enter matching passwords.
    - expect: All fields accept the supplied values.
  3. Click Save.
    - expect: A duplicate-username validation or error is displayed, the form is not successfully submitted, and the existing account is not overwritten.

#### 1.5. Require a valid employee selected from autocomplete

**File:** `tests/admin/add-user-employee-autocomplete.spec.ts`

**Steps:**
  1. Log in and open the Add User form through Admin > User Management > Add.
    - expect: The Add User form is displayed.
  2. Type a search string that returns employee suggestions in Employee Name, such as `a`.
    - expect: A suggestion list appears with matching employee names.
  3. Enter arbitrary text that does not correspond to a suggestion, complete the other fields with valid values, and click Save.
    - expect: The employee field is rejected or marked invalid, the form remains open, and no user is created.
  4. Clear the field, type a matching search, and select one suggestion.
    - expect: The selected employee is accepted as the field value and the employee validation clears.

#### 1.6. Persist the selected role and status values independently

**File:** `tests/admin/add-user-role-status.spec.ts`

**Steps:**
  1. Log in and open the Add User form.
    - expect: The User Role and Status fields initially show `-- Select --`.
  2. Open User Role and verify the available values; select `ESS`, then reopen it and select `Admin`.
    - expect: The dropdown offers `Admin` and `ESS`, and the final displayed value is `Admin`.
  3. Open Status and verify the available values; select `Disabled`, then reopen it and select `Enabled`.
    - expect: The dropdown offers `Enabled` and `Disabled`, and the final displayed value is `Enabled`.
  4. Complete the remaining required fields with valid data and save.
    - expect: The saved user retains the final selections: role `Admin` and status `Enabled`.

#### 1.7. Enforce username and password boundary validation

**File:** `tests/admin/add-user-field-boundaries.spec.ts`

**Steps:**
  1. Log in and open the Add User form, then select a valid role, employee, and status.
    - expect: The non-text required fields are valid.
  2. Try submitting with a blank username, a username containing only spaces, and a username exceeding the allowed maximum length.
    - expect: Each invalid username is rejected with clear validation and no user is created.
  3. Try a password below the minimum policy, then use a password containing the required complexity for the environment and matching confirmation.
    - expect: Weak passwords are rejected or marked invalid according to the displayed password policy; a compliant matching password is accepted.

#### 1.8. Cancel Add User without creating an account

**File:** `tests/admin/add-user-cancel.spec.ts`

**Steps:**
  1. Log in, navigate to Admin > User Management, and click Add.
    - expect: The Add User form is displayed.
  2. Enter values in one or more fields, then click Cancel.
    - expect: The user returns to the System Users page, entered values are discarded, and no new user is listed.
