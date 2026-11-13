# TaskPit: Current Development State

## Project Status
The application features the **TaskPit — Autonomous Team Execution Platform®** landing page as its primary interactive entry experience (`/`, `public/nectarline.html`, and `public/index.html`), maintaining the exact visual architecture: a fixed WebGL ripple lens scene, Three.js 3D crystal koi fish with vertex deformation, purple/violet glassmorphism, deterministic SVG charts, typing code block, and 5-section narrative flow.

All Nectarline and programmatic advertising terminology have been completely replaced with genuine **TaskPit** team delegation, role isolation, task inbox, and MCP protocol messaging.

The authenticated task workspace is served at `/workspace`, and all underlying backend services, security policies, multi-tenant isolation, MCP tools, and test suites (43 of 43 passed) remain 100% verified and operational.

## Product Goal
Validate whether student-organization leaders prefer delegating tasks through their AI assistant connected to TaskPit (via MCP) rather than their current document-based workflow.

## Source of Truth
- `architecture.md`: Product blueprint, domain model, security, and technical architecture
- `AGENTS.md`: Engineering rules and session continuity guidelines
- `vault/Taskpit/`: Conceptual notes and decision registers (`Decision Register.md`, `design-system-minimalist.md`)

## Repository Architecture & File Organization
```
taskpit/
├── app/                               # Next.js App Router (pages and route handlers only)
│   ├── route.ts                       # Root GET / serving the TaskPit single-file landing page
│   ├── workspace/page.tsx             # Authenticated Task execution dashboard (AppShell & TaskWorkspace)
│   ├── auth/callback/route.ts         # OAuth code exchange route handler
│   ├── forgot-password/page.tsx       # Password recovery request page
│   ├── login/page.tsx                 # Sign-in page
│   ├── register/page.tsx              # Account registration page
│   ├── reset-password/page.tsx        # Password update page
│   ├── select-org/page.tsx            # Multi-organization switcher and onboarding
│   ├── supabase-test/page.tsx         # Supabase connection diagnostic route
│   ├── globals.css                    # Tailwind v4 theme, Glacial Indifference @font-face
│   └── layout.tsx                     # Root HTML layout, font preloads, theme init script
├── components/                        # UI presentation layer (RSC and Client components)
│   ├── auth/                          # Authentication form components
│   │   ├── google-button.tsx
│   │   ├── no-memberships-onboarding.tsx
│   │   └── organization-selector.tsx
│   ├── layout/                        # Application layout chrome & navigation
│   │   ├── app-header.tsx
│   │   ├── app-sidebar.tsx
│   │   └── app-shell.tsx
│   ├── tasks/                         # Task management domain UI
│   │   ├── task-workspace.tsx
│   │   └── workspace-header.tsx
│   └── ui/                            # Atomic design primitives (buttons, inputs, badge, toggle)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       └── theme-toggle.tsx
├── server/                            # Backend-only domain logic, actions, and database
│   ├── actions/                       # Next.js Server Actions ("use server" only)
│   │   ├── auth.actions.ts            # signIn, signUp, signOut, resetPassword
│   │   ├── organization.actions.ts    # createOrg, joinOrg, switchActiveOrg
│   │   └── task.actions.ts            # createTask, updateTask, getTaskHistory
│   ├── auth/                          # Server-side authentication & session resolution
│   │   ├── middleware-auth.ts         # Session update/refresh for Next.js root middleware
│   │   ├── session.ts                 # getVerifiedActorContext, ACTIVE_ORG_COOKIE resolution
│   │   └── supabase-server.ts         # Server-side Supabase client using Next.js cookies
│   ├── db/                            # Database connection and Drizzle ORM schema
│   │   ├── index.ts                   # getDb with strict PGlite opt-in guard & production failure
│   │   ├── init-sql.ts                # In-memory test schema DDL
│   │   └── schema.ts                  # Drizzle ORM schema definition (Drizzle-Kit compatible)
│   └── services/                      # Backend business logic and security policies
│       ├── organization.service.ts    # Organization lifecycle, multi-tenant isolation, 2-layer join
│       ├── task.service.ts            # Task CRUD, state machine transitions, audit logging
│       └── user.service.ts            # Identity mapping, profile resolution, memberships
├── shared/                            # Shared contracts used by both client and server
│   ├── errors/                        # Custom domain errors (DomainError, ForbiddenError, etc.)
│   │   └── index.ts
│   ├── supabase/                      # Browser-safe Supabase client (zero server dependencies)
│   │   └── client.ts
│   ├── types/                         # Shared TypeScript types
│   │   ├── auth.types.ts              # ActorContext, MembershipRole, UserProfile, UserOrganizationMembership
│   │   └── task.types.ts              # TaskItem, MemberItem, HistoryEventItem
│   ├── validation/                    # Shared Zod validation schemas
│   │   ├── auth.validation.ts         # Login, register, email, password schemas
│   │   ├── organization.validation.ts # Org creation, join code/secret schemas
│   │   └── task.validation.ts         # Task creation, update, and status transition schemas
│   └── utils.ts                       # Shared Tailwind merge / cn utility
├── mcp/                               # Model Context Protocol server for AI assistant integration
│   ├── auth.ts                        # Development API key resolution & actor mapping
│   ├── index.ts                       # MCP stdio executable entry point
│   ├── server.ts                      # McpServer instantiation
│   └── tools.ts                       # MCP tool definitions (list_members, create_task, etc.)
├── drizzle/                           # Database migration files and SQL snapshots
├── tests/                             # Vitest integration and unit tests
│   ├── identity-and-auth.test.ts      # Multi-org, auth session, and onboarding tests
│   ├── mcp-server.test.ts             # MCP tool invocation and permission tests
│   ├── smoke.test.ts                  # Harness and environment smoke test
│   └── task-service.test.ts           # Task business rules and multi-tenant isolation tests
├── public/                            # Static assets, fonts, and standalone landing page
│   ├── nectarline.html                # TaskPit landing page (exact visual architecture, zero build step)
│   ├── index.html                     # Exact TaskPit landing page copy for root static hosting
│   └── fonts/                         # Glacial Indifference WOFF2 font files
├── vault/Taskpit/                     # Obsidian product notes and architectural decisions
├── middleware.ts                      # Next.js root request middleware
├── drizzle.config.ts                  # Drizzle Kit configuration (pointing to ./server/db/schema.ts)
├── vitest.config.mts                  # Vitest runner configuration with server-only test aliasing
├── components.json                    # shadcn CLI config mapped to @/shared/utils
└── package.json                       # Dependencies including server-only
```

## Landing Page & Product Content
1. **Brand Identity:**
   - Wordmark updated to **TaskPit** across navigation, hero, dashboard, footer, and watermark.
   - Preserved purple/violet orb icon logo.
2. **Product Messaging:**
   - **Hero:** *"Introducing TaskPit — Autonomous Team Execution®"*
   - **Studio / Platform:** *"The leading AI-native team execution platform for ambitious organizations and leaders."*
   - **Stats Row:** Role-based isolation (100%), real-time immutable audit timeline, dual MCP protocol support, 0s delegation turnaround latency.
   - **Dashboard View:** Shows active org context (*E-Cell IIT Bombay*), sprint execution velocity metrics, 4 KPI tiles (*Completed tasks*, *On-time delivery*, *Avg review turnaround*, *Active delegates*), task category breakdown (*Engineering*, *Product & Design*, *Operations*, *Outreach*, *Leadership*), and active task records.
   - **MCP Delegation Protocol:** Code block showcases real TaskPit MCP `create_task` tool execution with structured arguments.
   - **Feature Cards:** *Direct AI Assistant Handoff*, *Focused Member Inboxes*, *Live Execution Timeline*.
   - **Use Cases:** *Student Leaders*, *Engineering Teams*, *Core Committees*, *Autonomous AI Agents*.
   - **Footer:** TaskPit mission statement, platform links, legal bar, and ghosted `"TaskPit"` wordmark.

## Actual Executed Verification Results
- **TypeScript Typecheck (`npm run typecheck`):** Passed with **0 errors**.
- **ESLint Code Quality (`npm run lint`):** Passed with **0 errors, 0 warnings**.
- **Vitest Full Test Suite (`npm test`):** **43 of 43 passed (0 failed)** across all 4 suites.
- **Next.js Production Build (`npm run build`):** Clean compilation, all static and dynamic routes generated without errors.
