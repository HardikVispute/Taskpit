---
type: technical
project: TaskPit
tags: [taskpit, database, data-model]
---

# Core Data Model

## Organization

A workspace with a stable ID, name, and timestamps.

## User

An authenticated person with a stable identity and display information. Store only necessary personal data.

## OrganizationMembership

Connects a user to an organization and stores their role. Initial roles are `leader` and `member`. Roles are scoped to membership, because a person may eventually belong to more than one organization.

## Task

Core fields:
- `id`
- `organization_id`
- `title`
- `description`
- `assignee_membership_id`
- `created_by_membership_id`
- `due_at` (nullable)
- `status`
- `created_via` (`web` or `mcp`)
- `created_at`
- `updated_at`

## TaskEvent

An append-only record of meaningful task changes:
- `id`
- `task_id`
- `organization_id`
- `actor_membership_id` (nullable for system events)
- `event_type`
- `details` (validated structured data)
- `created_at`

Record creation, reassignment, deadline changes, important instruction edits, and status changes.

## Integrity rules

- Assignee must be a member of the task's organization.
- Every task operation must be organization-scoped.
- Store history alongside current state.
- Use database constraints and transactions where needed.
- Never store secrets in event details.

Related: [[System Architecture]], [[Task Lifecycle]], [[Security and Permissions]].
