# Admin-controlled employee passwords

## What will change
- Employee creation by a Super Admin or IT/Admin will create both the employee record and its sign-in account.
- A cryptographically random password of at least 16 characters will be generated on the server with uppercase, lowercase, numbers, and symbols.
- The generated password will appear once in a focused dialog with a Copy button, then be discarded when that dialog closes.
- Employee rows with a login account will gain a **Reset Password** action behind a confirmation prompt. Resetting generates a new password, shows it once, and records a `PASSWORD_RESET` audit event without the password.
- The public “Create account” form will be removed; existing email/password accounts and sign-in remain available.

## Security controls
- New server functions will require a signed-in caller and verify their Super Admin or IT/Admin role before any privileged action.
- The privileged authentication client will be loaded only after authorization, inside server handlers; no service credential reaches browser code.
- Passwords will not be written to employee data, browser storage, audit data, or logs.
- Existing accounts remain untouched. Existing employee rows can be matched to an existing login by exact email during an authorized reset, then linked for future resets.
- Current passwords are never read or displayed, and no employee-facing change-password control is added.
- The authentication provider does not expose a safe administrator operation to revoke another user’s active sessions by user ID; password replacement will invalidate credentials, while active-session revocation will only be added if the installed provider API supports it safely.

## Technical details
- Extend the employee record with only an optional authentication-user identifier; no password column.
- Extend the access-log action enum with `PASSWORD_RESET`.
- Create validated TanStack server functions for account creation and resets, using Web Crypto for password generation and compensating cleanup if employee creation fails.
- Update the Employees page for one-time credential display, clipboard copy, reset confirmation, loading/error states, and query refresh.
- Keep the existing protected-route session flow and role model unchanged.

## Verification
- Confirm unauthorized/viewer calls are rejected server-side.
- Confirm generated passwords meet every character-class and length rule.
- Confirm employee creation and reset sign in successfully with the new password.
- Confirm no password appears in database records, audit entries, browser storage, or application logs.
- Confirm existing sign-in still works and all app pages remain healthy.
