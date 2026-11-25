# ServiceIQ

**A field service and Annual Maintenance Contract (AMC) management
platform.**

> 📊 **For the 8-page presentation, [click here and download](ServiceIQ.pdf).**

ServiceIQ is designed for organisations that maintain and service
equipment such as air-conditioning systems, lifts, generators,
fire-safety systems and appliances. It brings customer complaints,
equipment records, contract coverage, preventive maintenance, technician
dispatch and job execution into one workflow.

## Contents

-   [Why ServiceIQ](#why-serviceiq)
-   [Core workflows](#core-workflows)
-   [Features by track](#features-by-track)
-   [Architecture](#architecture)
-   [Technology stack](#technology-stack)
-   [Getting started](#getting-started)
-   [Environment variables](#environment-variables)
-   [Supabase setup](#supabase-setup)
-   [Application areas](#application-areas)
-   [Security and data conventions](#security-and-data-conventions)
-   [Development and testing](#development-and-testing)
-   [Git collaboration](#git-collaboration)
-   [Known integration checks](#known-integration-checks)
-   [Project scope](#project-scope)
-   [Contributors](#contributors)

## Why ServiceIQ

Field-service teams often coordinate complaints, technicians and
maintenance visits through disconnected spreadsheets, phone calls,
WhatsApp groups and paper job sheets. Contract coverage and equipment
service history can also be difficult to verify while a technician is on
site.

ServiceIQ is intended to provide one operational system for:

1.  **Dispatch and execution:** Track a complaint from ticket creation
    through technician assignment, on-site work and job closure.
2.  **Contract intelligence:** Track covered equipment, contract expiry,
    preventive-maintenance schedules and whether a part or service is
    covered or chargeable.

The platform has organisation-facing web workflows and a mobile-first
technician experience. A cross-organisation technician marketplace is a
future possibility supported by parts of the data model, but
marketplace-facing UI is outside the current project scope.

## Core workflows

### Breakdown service

1.  An organisation receives a complaint through a supported channel.
2.  A dispatcher creates a ticket and selects the customer, site,
    equipment and priority.
3.  ServiceIQ creates the associated breakdown job and calculates SLA
    deadlines using applicable contract targets or defaults.
4.  The dispatcher assigns a technician and a time slot.
5.  The technician views the job, records progress and performs the
    required work.
6.  Job transitions are recorded in the status history.
7.  The job is completed and the ticket/operational records can be
    reviewed.

### Preventive maintenance

1.  Contract activation generates preventive-maintenance visits for
    covered equipment.
2.  A dispatcher reviews pending visits and schedules a PM job.
3.  A technician performs the visit using the technician workflow.
4.  The PM visit is synchronised with the completed job.

### Contract entitlement

1.  An organisation records equipment and contract coverage.
2.  Coverage rules define which labour, travel and parts are included.
3.  During job execution, the entitlement check helps identify whether a
    recorded part or service is covered or chargeable.

## Features by track

The project is divided into five coordinated workstreams.

  -----------------------------------------------------------------------
  Track                   Area                    Scope
  ----------------------- ----------------------- -----------------------
  A                       Foundation              Database schema,
                                                  authentication,
                                                  organisation
                                                  onboarding, shared
                                                  layout, routing,
                                                  role-aware navigation
                                                  and deployment
                                                  foundation

  B                       Equipment and contracts Equipment catalogue,
                                                  customer/site
                                                  relationships,
                                                  contracts, coverage
                                                  rules, PM visit
                                                  generation and renewal
                                                  pipeline

  C                       Tickets, dispatch and   Ticket intake and
                          jobs                    detail, dispatch
                                                  Kanban, job
                                                  listing/detail,
                                                  technician assignment,
                                                  workflow transitions,
                                                  SLA handling and PM
                                                  scheduling

  D                       Technician experience   Mobile-first job list
                                                  and detail, checklists,
                                                  photos, parts, customer
                                                  signature, job close
                                                  flow and offline action
                                                  queue

  E                       Integrations and        WhatsApp webhook and
                          analytics               notifications, owner
                                                  dashboard, scheduled
                                                  checks,
                                                  materialised-view
                                                  refresh and customer
                                                  ticket portal
  -----------------------------------------------------------------------

Feature scope is based on the ServiceIQ master context and track
specifications. The final merged branch should be audited before marking
every item above as delivered.

## Architecture

``` mermaid
flowchart TD
    U[Organisation admins and dispatchers] --> WEB[Next.js web application]
    T[Technicians on mobile] --> WEB
    C[Customers via portal or WhatsApp] --> INT[Integration endpoints]
    INT --> WEB
    WEB --> AUTH[Supabase Auth]
    WEB --> DB[(Supabase PostgreSQL)]
    WEB --> STORE[Supabase Storage]
    DB --> RT[Supabase Realtime]
    RT --> WEB
    EDGE[Supabase Edge Functions] --> DB
    EDGE --> WA[Meta WhatsApp Business API]
    WEB --> WA
    WEB --> HOST[Vercel hosting]
```

### Main data concepts

  -----------------------------------------------------------------------
  Entity                              Purpose
  ----------------------------------- -----------------------------------
  `organisation` and `org_membership` Tenant organisation and a person's
                                      role within it

  `person`                            A person associated with an
                                      authenticated user

  `party` and `site`                  Customers and their physical
                                      locations

  `equipment_category`,               Equipment catalogue and installed
  `product_model`, `equipment_unit`   units

  `contract`, `contract_equipment`,   AMC contracts, covered units and
  `coverage_rule`                     entitlement rules

  `pm_visit`                          Preventive-maintenance visits
                                      generated from contracts

  `ticket`                            Inbound service complaint

  `job`, `job_type`, `workflow_state` Technician work and its
                                      configurable workflow

  `job_assignment`                    Technician allocation and scheduled
                                      time slot

  `job_status_event`                  Status-transition history,
                                      including actor and optional
                                      location/offline metadata

  `job_part` and `part`               Parts recorded against a job and
                                      their entitlement outcome

  `audit_log`                         Database-trigger-managed audit
                                      history
  -----------------------------------------------------------------------

## Technology stack

  Layer                     Technology
  ------------------------- ----------------------------------
  Framework                 Next.js 14 App Router
  Language                  TypeScript
  Database                  Supabase PostgreSQL
  Authentication            Supabase Auth (email magic link)
  UI and styling            Tailwind CSS and shadcn/ui
  Server-state management   TanStack Query v5
  File storage              Supabase Storage
  Realtime                  Supabase Realtime
  Notifications             Meta WhatsApp Business API
  Serverless jobs           Supabase Edge Functions (Deno)
  Hosting                   Vercel

Keep the project on the agreed Next.js 14 baseline unless the team
deliberately plans and tests an upgrade.

## Getting started

### Prerequisites

-   Node.js compatible with the repository's Next.js 14 version
-   npm
-   A Supabase project with the approved ServiceIQ schema and migrations
-   Git
-   Optional: Meta WhatsApp Business API credentials for WhatsApp
    functionality

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <REPOSITORY_DIRECTORY>
```

### 2. Install dependencies

``` bash
npm install
```

If the repository contains a committed `package-lock.json`, prefer
`npm ci` for reproducible installs:

``` bash
npm ci
```

### 3. Configure environment variables

Create `.env.local` in the project root and populate the variables
listed in [Environment variables](#environment-variables). Never commit
`.env.local`.

### 4. Configure Supabase

Apply the committed migrations in order to the intended Supabase
project. Confirm that the required Storage bucket, authentication
settings, database functions, RLS policies and scheduled jobs are
configured. See [Supabase setup](#supabase-setup).

### 5. Start the development server

``` bash
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

Create `.env.local` locally. The project context specifies the following
variables:

  ---------------------------------------------------------------------------------
  Variable                          Used for                Exposure
  --------------------------------- ----------------------- -----------------------
  `NEXT_PUBLIC_SUPABASE_URL`        Supabase project URL    Public client
                                                            configuration

  `NEXT_PUBLIC_SUPABASE_ANON_KEY`   Supabase                Public client
                                    anon/publishable key    configuration;
                                                            protected by RLS

  `SUPABASE_SERVICE_ROLE_KEY`       Trusted server-side     **Secret. Server only.
                                    administrative          Never expose to the
                                    operations              browser.**

  `WHATSAPP_TOKEN`                  Meta WhatsApp API       **Secret. Server
                                    access token            only.**

  `WHATSAPP_PHONE_ID`               WhatsApp Business       Server-side integration
                                    phone-number ID         configuration

  `WHATSAPP_VERIFY_TOKEN`           Webhook verification    **Secret. Server
                                    token                   only.**
  ---------------------------------------------------------------------------------

Example template:

``` dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=
```

Do not paste real credentials into README files, issues, pull requests,
screenshots or source control. Use your team's approved secret manager
and the hosting provider's environment settings.

## Supabase setup

The ServiceIQ project context specifies Supabase PostgreSQL, Supabase
Auth, Realtime, Storage, database functions and RLS.

Before using a fresh environment:

1.  Identify the canonical initial migration and all subsequent approved
    migrations in `supabase/migrations/`.
2.  Apply migrations in order to the correct Supabase project.
3.  Confirm that the required RPC functions exist, including the
    organisation-creation, entitlement, PM-generation and daily-check
    functions used by the application.
4.  Configure email magic-link authentication and callback URLs for
    local and deployed environments.
5.  Configure the `job-attachments` Storage bucket and its access
    policies.
6.  Enable the required Realtime publication/subscriptions.
7.  Configure scheduled Edge Functions or database cron jobs only after
    verifying the deployed function names and schedules.

Do not apply an old standalone `schema.sql` over an existing database
without first checking migration history and obtaining approval from the
database owner. Schema changes should be committed as new, numbered
migration files and reviewed by the designated Track A/schema owner.

## Application areas

The routes below reflect the project specifications. Some route groups
may be absent or still under integration in a particular branch; verify
the current repository before relying on them.

  -----------------------------------------------------------------------
  Area                                Routes
  ----------------------------------- -----------------------------------
  Authentication                      `/login`, `/signup`, `/onboard`

  Dispatch                            `/dispatch`

  Tickets                             `/tickets`, `/tickets/new`,
                                      `/tickets/[id]`

  Jobs                                `/jobs`, `/jobs/[id]`

  Equipment                           `/equipment`, `/equipment/[id]`

  Contracts                           `/contracts`, `/contracts/new`,
                                      `/contracts/[id]`

  Parts and technicians               `/parts`, `/technicians`

  Renewals and dashboard              `/renewals`, `/dashboard`

  Organisation settings               `/settings`

  Technician experience               `/tech`, `/tech/jobs/[id]`,
                                      `/tech/jobs/[id]/close`,
                                      `/tech/profile`

  Customer portal                     `/portal/[ticketNo]` (specification
                                      route; verify implementation)

  WhatsApp webhook                    `/api/whatsapp/webhook`
  -----------------------------------------------------------------------

## Security and data conventions

The following conventions are part of the ServiceIQ project context:

-   Every organisation-owned insert must include the correct `org_id`.
-   Organisation-scoped queries must enforce tenant isolation and rely
    on the configured RLS policies.
-   Do not insert directly into `audit_log`; database triggers are
    responsible for audit records.
-   Job status changes must go through `POST /api/jobs/[id]/transition`
    so the `job_status_event` history is written.
-   Upload job attachments to the agreed Storage location pattern:
    `{org_id}/{job_id}/{filename}`.
-   Avoid `select *` in production queries; select only the columns
    required.
-   Never expose the Supabase service-role key or WhatsApp access token
    to client-side code.
-   Validate permissions on the server/API, not only by hiding UI
    controls.

### Security items to verify before production

The original project context records several accepted gaps that should
be re-evaluated before onboarding real customers:

-   Role-level permissions may be enforced in the UI more broadly than
    at the database/API layer. Verify that technicians and accounts
    users cannot perform unauthorised operations through direct API
    calls.
-   The original specification describes `job-attachments` as a public
    bucket. Review whether photos and signatures should instead use a
    private bucket and signed URLs.
-   Restrict who can edit technician skill verification fields.
-   Review all service-role operations and webhook handlers for
    authentication, validation, tenant resolution and safe error
    handling.

Do not treat organisation-level RLS alone as proof that every role has
the correct permissions.

## Development and testing

Run the checks supported by the repository's `package.json`:

``` bash
npm run lint
npx tsc --noEmit
npm test --if-present
npm run build
```

If the project uses a differently named test command or a dedicated E2E
runner, use the actual script documented in `package.json`.

The Track C handover reports:

-   44/44 Track C E2E regression tests passed
-   Lint completed with zero warnings and errors
-   TypeScript check completed with zero errors
-   Production build succeeded

These are Track C handover results, not an independent verification of
the final five-track merge. Re-run the checks on the final integration
branch and record the actual results in the release notes.

## Git collaboration

The recommended workflow is:

1.  `main` contains the stable release.
2.  `integration` is the shared branch for cross-track testing.
3.  Each track works on its own branch, for example `track-c/dispatch`.
4.  Contributors open pull requests into `integration`.
5.  Reviewers check the code, tests, schema impact and deployment
    preview.
6.  Merge only after required checks pass and review feedback is
    resolved.
7.  Merge `integration` into `main` only after full-system verification.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution process and
pull-request checklist.

## Known integration checks

The Track C cross-track report identified the following items for
resolution or explicit sign-off:

-   PM visit status and `completed_at` should synchronise when a linked
    PM job is successfully completed.
-   Accepted technician assignments should be marked completed
    consistently with the technician-performance reporting model.
-   Technician closeout metadata (notes, signature, rating, feedback and
    checklist answers) should be coordinated with the job transition so
    partial closure cannot occur.
-   Assignment acceptance must re-check scheduling conflicts at
    acceptance time and protect against concurrent double-booking.
-   WhatsApp credentials and webhook configuration must be set in the
    target environment before live messaging can be tested.
-   Technician routes/layouts and Track B contract
    activation/entitlement dependencies must be verified in the final
    merged repository.

The Track C owner approved these fixes with modifications, including
transactional consistency and race-safe assignment acceptance. Confirm
implementation and tests before marking these items resolved.

## Project scope

The current phase focuses on field-service operations, contracts,
equipment, dispatch, technician execution, preventive maintenance,
notifications and operational reporting.

The master context explicitly defers the following from the current
phase:

-   Inventory and stock management
-   Payroll and accounting
-   PDF invoice generation
-   Native Android/iOS applications
-   Multi-language UI
-   In-app payment collection
-   Marketplace-facing technician discovery UI

## Contributors

Add the project contributors and their GitHub profiles here after
confirming their preferred names and usernames.

  Track   Responsibility               Contributor
  ------- ---------------------------- -------------
  A       Foundation                   To be added
  B       Equipment and contracts      To be added
  C       Tickets, dispatch and jobs   To be added
  D       Technician experience        To be added
  E       Integrations and dashboard   To be added

------------------------------------------------------------------------

**Maintained by the ServiceIQ project team.**
