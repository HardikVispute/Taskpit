---
type: domain-model
project: TaskPit
tags: [taskpit, task, lifecycle, domain]
---

# Task Lifecycle

## Current task record

A task represents a piece of work assigned within an organization.

Core fields:
- ID and organization.
- Title and description/instructions.
- Assignee.
- Creator.
- Optional deadline.
- Status.
- Creation source (`web` or `mcp`).
- Created and updated timestamps.

## Candidate statuses

- `open`
- `in_progress`
- `submitted`
- `in_review`
- `changes_requested`
- `completed`
- `cancelled`

These statuses leave room for the intended execution lifecycle. Only expose transitions that are implemented and tested.

## Candidate lifecycle

`Assigned → Acknowledged → In progress → Submitted → In review → Changes requested / Approved → Completed`

The status list and lifecycle need to be aligned during implementation. Acknowledgment may be represented as a separate event or field depending on the chosen behavior. Do not silently invent final business rules.

## Event history

Task creation, reassignment, deadline changes, important instruction edits, and status changes should produce history events. The current task state answers “what is true now”; the event history helps answer “how did we get here?”

## Related notes

- [[Core Data Model]]
- [[Member Workflow - Assignment to Completion]]
- [[Submission Quality and Review]]
- [[Work History and Contribution Records]]
