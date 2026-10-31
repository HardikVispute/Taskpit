---
type: workflow
project: TaskPit
tags: [taskpit, workflow, leader, mcp]
---

# Leader Workflow - AI to Task Records

## Intended experience

The leader should be able to explain the work naturally instead of manually composing every assignment in a separate document.

### Flow

1. **Describe:** The leader tells their preferred AI assistant what needs to happen.
2. **Clarify:** If the assignee, task meaning, or another critical detail is unclear, the assistant asks instead of inventing it.
3. **Discover:** The assistant finds the right organization and eligible members through TaskPit tools.
4. **Create:** The assistant calls the task-creation tool.
5. **Persist:** TaskPit validates access and input, then saves the task and its history.
6. **Review:** The assistant returns a structured result; the leader opens TaskPit to inspect it.
7. **Edit:** The leader can adjust details through the web UI.
8. **Continue:** The leader can create more work or manage existing tasks.

## Expected task information

- Title.
- Clear instructions and expected deliverable.
- Assignee.
- Optional deadline.
- Organization.
- Current status and history.

## Product principles

- Natural language should reduce friction, not remove user control.
- Critical details should not be silently guessed.
- The assistant must clearly report failures and partial success.
- The leader must be able to review and edit the structured result.
- Direct UI actions remain first-class.

## Related notes

- [[Core Hypothesis - AI-Assisted Delegation]]
- [[MCP Integration]]
- [[Task Lifecycle]]
- [[System Architecture]]
