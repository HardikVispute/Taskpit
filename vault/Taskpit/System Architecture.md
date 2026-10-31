---
type: technical
project: TaskPit
tags: [taskpit, architecture, system-design]
---

# System Architecture

## Architectural principle

TaskPit is the source of truth. The web UI and MCP are two interfaces to the same application capabilities.

## Logical components

1. **Web UI:** Authentication (Registration, Login, Google OAuth, Password Recovery/Reset), Organization Selector (`/select-org`), Organization workspace, task list, task create/edit, task detail, member task view.
2. **Application services:** Shared domain operations (`TaskService`, `OrganizationService`, `UserService`).
3. **Database:** Supabase PostgreSQL with Drizzle ORM (`organizations`, `users`, `organization_memberships`, `tasks`, `task_events`).
4. **MCP server:** Exposes authorized TaskPit operations to an AI assistant over stdio transport.
5. **Authentication and authorization:** Supabase Auth for identity; TaskPit PostgreSQL and `getVerifiedActorContext()` for server-verified multi-org actor resolution.
6. **Validation layer:** Validates web, server action, and MCP input consistently via Zod.

## Proposed baseline

The provisional implementation baseline is Next.js, React, TypeScript, PostgreSQL, Supabase for managed database/auth unless the repository already has a working equivalent, and a TypeScript MCP server.

The existing repository takes precedence where it already has a functioning setup. Inspect before changing the stack.

## Shared operation path

**Web UI or MCP → server-side validation → authorization → shared service → database transaction → result**

Both entry points must use the same task service and task-history logic.

## Core data concepts

- [[Core Data Model]]
- [[Security and Permissions]]
- [[Task Lifecycle]]

## Current implementation focus

Build the smallest end-to-end AI-assisted delegation workflow described in [[Prototype - First Working Slice]]. Keep future features possible without implementing them all now.
