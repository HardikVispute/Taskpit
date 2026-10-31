---
type: technical
project: TaskPit
tags: [taskpit, security, authorization]
---

# Security and Permissions

## Initial roles

- **Leader:** Create and manage tasks in their organization and assign work to organization members.
- **Member:** View assigned tasks in their organization.
- **Volunteer:** View assigned tasks in their organization (non-leader permissions).

## Authentication & Multi-Organization Identity Boundaries

- **One Person = One Account = Many Memberships:** Authenticated Supabase identity (`auth.users`) maps deterministically to TaskPit `users.supabaseAuthId`.
- **Membership Scoping:** Roles (`leader`, `member`, `volunteer`) are strictly scoped to `organization_memberships`. A user who is a leader in Org A has only member/volunteer rights in Org B.
- **Server-Derived Actor Context:** `getVerifiedActorContext()` derives `ActorContext` (`userId`, `organizationId`, `membershipId`, `role`) on the server. Client-provided cookies or parameters are strictly verified against the database. Forged organization IDs are rejected.
- **No Memberships State:** Newly registered users without verified memberships are placed in an onboarding state and blocked from accessing any organization until invited.

## Required protections

- Enforce authorization on the server for every read and write.
- Check that the caller belongs to the target organization.
- Check that an assignee is a member of the same organization.
- Prevent access to other organizations by changing record IDs.
- Apply the same authorization rules to MCP and web UI operations.
- Never trust organization/member IDs supplied by an AI tool without checking them.
- Keep service-role keys and secrets server-side.
- Validate inputs at every external boundary.
- Do not expose SQL errors, stack traces, private records, or secrets in tool responses.
- Keep development authorization separate from production authorization.

## Identity boundary for MCP

Every MCP request must map to an authorized acting user or explicitly configured integration identity. If this mapping is not secure, production write operations must not be exposed as unauthenticated calls.

Related: [[MCP Integration]], [[System Architecture]], [[Core Data Model]].
