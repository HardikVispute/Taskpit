# TaskPit Architecture

This vault's implementation blueprint is maintained as a standalone file so it can be placed in the TaskPit repository root. See the other linked notes for the product context and rationale.

The prototype tests whether student-organization leaders prefer delegating through their own AI assistant connected to TaskPit. The assistant uses MCP to create real, persistent task records, which appear in the TaskPit UI and can be reviewed and edited by the leader.

The core architecture uses a web UI, shared server-side application services, a persistent database, and an MCP integration layer. The web UI and MCP must use the same validation and authorization rules. TaskPit is the source of truth.

The provisional stack is Next.js, React, TypeScript, PostgreSQL, and Supabase unless the existing repository already has a functioning equivalent. Inspect the repository before changing it.

Core data concepts: Organization, User, OrganizationMembership, Task, and TaskEvent. Initial MCP tools: list organizations, list organization members, list tasks, create task, and update task. Protect organization-scoped access, validate all external inputs, and keep secrets server-side.

The first working slice includes real MCP task creation, task list/detail/create/edit UI, task history, and basic authorization tests. Submission verification, member AI companions, project-aware memory, contribution recognition, certificates, and advanced analytics belong to the broader product direction and should be implemented when justified.

Refer to [[System Architecture]], [[Core Data Model]], [[MCP Integration]], [[Prototype - First Working Slice]], and [[Decision Register]].
