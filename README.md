# FlooringMart Access Hub

Build a production-quality internal web app called "FlooringMart Access & Subscription Manager" for FlooringMart.com.

Purpose: manage all software subscriptions and all employee/system access in one auditable system because employees join, leave, and change roles.

Create a professional FlooringMart-style responsive admin app with sidebar navigation.

Modules:
- Dashboard: active employees, active systems, known monthly/annual spend, subscriptions needing review, upcoming renewals, admin/owner access, former employees with active access, recent changes, quick actions.
- Employees: employee ID, name, department, role, manager, email, start/end dates, status, notes. Never delete historical employees.
- Systems & Subscriptions: system, category, vendor, account/email, business owner, technical owner, purpose, monthly/annual cost, renewal date, paid seats, active users, status, review decision, consolidation candidate, cancellation date, notes. Decisions: KEEP, KEEP IF USED, VERIFY, CONSOLIDATE, CANCEL AFTER CONFIRMATION.
- Access Management: employee, system, access level Viewer/Read Only/Standard/Manager/Admin/Owner, username, credential-vault reference only (never passwords), granted date/by, owner, MFA, last review, status, removed date/by, notes. Include employee x system matrix and system/user views.
- Access Change Log: every grant, modification, privilege elevation, suspension and removal with date, employee, system, action, old/new access, approver, completer, reason/ticket and notes. Preserve history.
- Onboarding: role-based access suggestions, approval and access-grant logging.
- Offboarding/Role Change: checklist covering email/SSO, Magento, GitHub, DigitalOcean, Figma, ChatGPT, Claude, Cursor, QuickBooks, Floorzap, Namecheap/domains, password manager, API keys/tokens, shared drives and all registered systems. Record completion and verification; update access status and audit log.
- Quarterly Review: subscription and access review checklists.
- Reports: current access by employee/system, former employees with access, admin access, subscription costs, renewals, review/cancel/consolidate items, and access changes by date range.

Technical:
- Full-stack TypeScript, Tailwind, shadcn/ui.
- Supabase/PostgreSQL with relational schema and real CRUD.
- Internal authentication with roles: Super Admin, IT/Admin, Manager, Viewer.
- Audit timestamps and created_by/updated_by.
- Search/filter/sort/pagination and responsive states.
- Confirmation for destructive actions.
- Do not store passwords, API keys, MFA secrets or recovery codes.
- Do not automatically cancel subscriptions or revoke external accounts; track decisions and checklists only.
- Seed realistic demo data and include initial FlooringMart systems such as Namecheap, DigitalOcean, GitHub, Figma, Claude.ai, Cursor.ai, ChatGPT, GoDaddy, Floorzap, QuickBooks, Apple, and Punch Software (Punch = Needs Review).

Build the complete initial app, database schema, seed data, navigation, pages and workflows.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8ca0cfbf-8605-4c9d-93bd-2e7619824e2a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
