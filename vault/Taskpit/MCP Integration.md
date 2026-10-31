---
type: technical
project: TaskPit
tags: [taskpit, mcp, ai, integration]
---

# MCP Integration

## Purpose

MCP allows a leader's preferred AI assistant to operate on TaskPit through explicit, structured tools. It connects natural-language intent to real TaskPit records.

MCP is an integration layer, not a second business-logic implementation.

## Initial tool surface

1. `list_my_organizations`
2. `list_organization_members`
3. `list_tasks`
4. `create_task`
5. `update_task`

Each tool should have a clear description, validated input schema, predictable output schema, and actionable errors.

## Tool behavior

- Find the correct organization and eligible assignee before creating work.
- Ask for clarification when critical information is ambiguous.
- Validate membership and permissions on the server.
- Return task IDs and the created task's key fields.
- Clearly report failed operations and partial success.
- Avoid duplicate records on retries where practical.
- Never provide arbitrary SQL or code execution.
- Never allow the model to set creator identity or bypass access checks.

## Shared logic

MCP tools and the web UI must use the same server-side services. This keeps authorization, validation, task creation, and history consistent.

See [[System Architecture]], [[Security and Permissions]], and [[Leader Workflow - AI to Task Records]].

## Connection considerations

The supported MCP transport and authentication mechanism must be checked against the actual assistant client and deployment environment. Document setup limitations honestly. Do not assume all AI plans or clients support custom connectors.
