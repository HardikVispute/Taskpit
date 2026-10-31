---
type: workflow
project: TaskPit
tags: [taskpit, workflow, member]
---

# Member Workflow - Assignment to Completion

## Member's needs

A member should be able to understand:
- What they are responsible for.
- Why the work is needed and what the expected deliverable is.
- When it is due.
- What state the task is in.
- How to communicate a blocker or provide work when those features are available.

## Candidate lifecycle

`Assigned → Acknowledged → In progress → Submitted → In review → Changes requested / Approved → Completed`

This is the broader product direction. Each transition needs a clear meaning and should be implemented only when its behavior is defined.

## Critical distinctions

- **Acknowledged:** The member has seen or accepted the assignment.
- **In progress:** Work has begun.
- **Submitted:** Work has been provided for review.
- **In review:** Someone is evaluating the submission.
- **Changes requested:** The submission needs specific corrections.
- **Completed:** The work has been accepted under the task's review rules.

A member's claim or upload should not automatically equal accepted completion.

## First prototype

The first working slice prioritizes the leader-side delegation hypothesis. A member-facing view can show assigned tasks and their details where authentication is available. Progress updates, submissions, review, and approval must be implemented end to end before being presented as working features.

Related: [[Task Lifecycle]], [[Submission Quality and Review]].
