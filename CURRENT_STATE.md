# TaskPit: Current Development State

## Project Status
The **Pink & White Apple OS Liquid Glass Login Screen** has been successfully implemented using `@aceternity/liquid-glass` (`LiquidGlass`) with Snell's-law displacement refraction, chromatic dispersion rim lighting, and the designated `auth-pink-red.webp` backdrop. All 43 test suite cases continue to pass with 100% green builds, strict TypeScript typechecking, clean ESLint validation, and successful Next.js production builds.

## Product Goal
Validate whether student-organization leaders prefer delegating tasks through their AI assistant connected to TaskPit (via MCP) rather than their current document-based workflow.

## Source of Truth
- `architecture.md`: Product blueprint, domain model, security, and technical architecture
- `AGENTS.md`: Engineering rules and session continuity guidelines
- `vault/Taskpit/`: Conceptual second-brain notes and decision registers

## Confirmed Decisions
- Target audience: Student-organization leaders coordinating teams and events.
- Central Identity Model: ONE PERSON = ONE TASKPIT ACCOUNT = MANY ORGANIZATION MEMBERSHIPS. Global identity is separate from organization memberships. Privileges never leak across organizations.
- Role Isolation: Roles (`leader`, `member`, `volunteer`) are strictly scoped per organization membership. A user who is a leader in E-Cell has only member/volunteer rights in Robotics Club.
- Organization Onboarding:
  - Any authenticated user can create an organization. The creator is automatically assigned `role: "leader"`.
  - Any authenticated user can join an organization via 2-layered verification: Layer 1 is the Organization Code (`join_code`), and Layer 2 is the Secret Passcode (`join_secret`). Joiners are granted `role: "member"`.
  - Joining an organization the user already belongs to idempotently switches to it without creating duplicate records.
- Defense-in-depth Security:
  - Server-side authorization enforced on every operation via `getVerifiedActorContext()`. Client-supplied user IDs, roles, or organization IDs are never trusted.
  - Organization join secrets are never exposed to regular members or non-authenticated users; only the organization leader can view their organization's secret passcode.
  - Secret comparison is performed using timing-safe equality (`crypto.timingSafeEqual`) to mitigate timing attacks.
  - Default random codes and secrets are generated using `crypto.randomBytes`.
- Real Persistence: Every mutation writes real database records to live Supabase PostgreSQL.
- Atomic Audit Logging: Every task creation and edit records an immutable `task_event` in the database within a transaction.
- Stack: Next.js 16 (App Router), TypeScript (strict mode), Tailwind CSS v4, shadcn/ui primitives, Drizzle ORM, Zod, Vitest, `@modelcontextprotocol/sdk`, `@supabase/supabase-js`, `@supabase/ssr`.

## Current Implementation
- **Login Screen: Pink & White Apple OS Liquid Glass (`app/login/page.tsx`, `components/ui/liquid-glass.tsx`):**
  - Integrated Aceternity Snell's-law displacement refraction liquid glass with dynamic SVG filter displacement maps, specular rim highlights, and chromatic aberration.
  - Viewport backdrop set to `auth-pink-red.webp` with subtle vignette overlay.
  - Pink and white aesthetic: pure white inverted brand geometry (`brightness-0 invert`), pure white titles and labels (`text-white`), frosted translucent white inputs (`bg-white/15 border-white/25 text-white`), frosted Google OAuth button (`bg-white/20 border-white/35`), and high-contrast solid white primary CTA button with bold pink text (`bg-white text-[#9d174d]`).
  - Strict React 19 compliance: resolved `set-state-in-effect` linting with `requestAnimationFrame` capability detection; zero lint warnings.
  - PostCSS Pipeline Integration: Configured `@tailwindcss/postcss` and `postcss.config.mjs` ensuring robust, error-free Tailwind CSS v4 compilation across dev and production.
  - Dynamic route configuration (`export const dynamic = "force-dynamic"`) across auth routes preventing Windows file lock races during build prerendering.
- **Visual Design System & Tokens (`app/globals.css`, `public/assets/`):**
  - Warm white light canvas (`#fafaf9`), graphite text (`#1d1d1f`), secondary text (`#6e6e73`), hairline dividers (`#e5e5ea`), TaskPit Navy accent (`#254064`).
  - Open typography-led layout replacing nested card containers and heavy drop shadows.
  - Transparent brand logo (`public/assets/brand/logo.svg`) used across headers and auth views.
  - Subtle architectural backdrop (`public/assets/backgrounds/auth-light.webp`) masked on auth views (`/login`, `/register`, `/forgot-password`, `/reset-password`).
  - Neutral, calm workspace and organization hub canvas.
- **Organization Creation & 2-Layered Join (`lib/services/organization-service.ts`, `app/actions/auth.ts`, `components/auth/no-memberships-onboarding.tsx`, `components/auth/organization-selector.tsx`):**
  - Schema columns: `organizations.join_code` (unique, nullable for legacy) and `organizations.join_secret` (nullable for legacy).
  - Hardened validation: length constraints on join code (3–32 chars) and join secret (4–64 chars).
  - Timing-safe comparison using `crypto.timingSafeEqual` in `OrganizationService.joinOrganizationWithCode`.
  - Cryptographic randomness using `crypto.randomBytes` for code and passcode generation.
  - `NoMembershipsOnboarding`: Clean segmented control for "Create Workspace" (Leader) and "Join with Code" (Member).
  - `OrganizationSelector`: Grouped list layout displaying user workspaces, verified role pills, active workspace indicator, and expandable accordion to create or join additional organizations.
  - `WorkspaceHeader`: Translucent sticky header with organization switcher and join credential display for leaders.
- **Authentication & User Identity (`app/login/`, `app/register/`, `app/forgot-password/`, `app/reset-password/`, `app/auth/callback/`, `app/actions/auth.ts`):**
  - Registration with full name, email, and password.
  - Login with email and password, plus Google OAuth sign-in.
  - Password reset request and confirmation flows.
  - Session refresh and route protection via `middleware.ts` and `utils/supabase/middleware.ts`.
- **Identity & Profile Mapping (`lib/services/user-service.ts`):**
  - `UserService.getOrCreateProfile`: Safe under concurrent requests (`onConflictDoUpdate`), maps Supabase `auth.users` to TaskPit `users.supabaseAuthId`.
  - `UserService.getUserMemberships`: Retrieves all memberships for a user across all organizations.
  - `UserService.getMembershipInOrg`: Strictly checks and verifies user membership in a target organization.
- **Task Workspace (`components/tasks/task-workspace.tsx`):**
  - Grouped list task layout with subtle dividers and quiet status pills.
  - Preserved all domain logic, task creation, reassignment, status transitions, and audit trail events.
- **MCP Server Layer (`mcp/`):**
  - Standards-compliant MCP server over `stdio` transport.
- **Source Control & GitHub Repository:**
  - Initialized Git repository, staged all project files and comprehensive documentation while preserving secret isolation (`.env.local` strictly gitignored).
  - Configured `main` branch and linked remote `https://github.com/HardikVispute/Taskpit.git`.
  - Pushed initial commit (`7104ff0`) to `origin/main`.

## Tests and Verification
The following checks were executed in the repository and passed cleanly with exit code 0:
- `npm run typecheck` (`tsc --noEmit`): Passed with 0 errors.
- `npm run lint` (`eslint`): Passed with 0 errors and 0 warnings.
- `npm test` (`vitest run`): **43 of 43 tests passed** across 4 test suites:
  - `tests/smoke.test.ts` (4 tests)
  - `tests/task-service.test.ts` (9 tests)
  - `tests/mcp-server.test.ts` (11 tests)
  - `tests/identity-and-auth.test.ts` (19 tests)
- `npm run build` (`next build --webpack`): Compiled successfully; generated static and dynamic routes for `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/select-org`, `/auth/callback`, `/supabase-test`.

## Next Actionable Task
Phase 6: Production MCP Integration
- Connect Cursor/Claude Desktop to TaskPit MCP using verified user-scoped or organization-scoped API keys.

## Last Updated
2026-10-31
