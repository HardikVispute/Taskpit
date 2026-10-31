---
type: reference
project: TaskPit
tags: [taskpit, open-questions]
---

# Open Product Questions

These are active questions to resolve through implementation and validation.

## Prototype and user experience
- Which supported AI assistant/client will be used for the first end-to-end MCP demonstration?
- How will a leader authenticate and connect their assistant safely?
- What is the simplest organization/member setup for the first test?
- How should the assistant handle multiple tasks, ambiguous assignees, or missing deadlines?
- What exact task fields must be visible and editable in the first UI?

## Product behavior
- Are projects needed for the first test, or can tasks be organized directly inside an organization?
- Which member actions are required in the first release?
- Which status transitions are enabled at each stage?
- How should work history represent edits, submissions, reviews, and approvals?
- What evidence and review behavior are appropriate for different kinds of work?

## Validation
- How many student-organization leaders should test the prototype?
- What observation criteria will indicate that the experience is clear and preferred?
- What setup friction or integration limitations might prevent a fair test?

## Technical decisions
- Final hosting and database setup (Resolved: Supabase PostgreSQL + Next.js App Router).
- User identity & multi-organization selection (Resolved: One account, many memberships, server-derived actor context).
- MCP transport and production authentication.
- Organization creation and member invitation workflow (Current status: onboarding state blocks uninvited users; formal invite flow pending).
- Notification channels and reminder policy.

These questions are intentionally visible so implementation does not silently turn assumptions into product rules. Resolve only what is needed for the next working slice.
