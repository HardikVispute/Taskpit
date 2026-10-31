---
type: plan
project: TaskPit
status: current
tags: [taskpit, prototype, mvp]
---

# Prototype - First Working Slice

## Objective

Build the smallest real, reliable slice that tests [[Core Hypothesis - AI-Assisted Delegation]].

## End-to-end path

1. A leader tells their preferred AI assistant what needs to be done.
2. The assistant calls TaskPit tools through [[MCP Integration]].
3. TaskPit validates the request and authorization.
4. TaskPit saves real task records and history.
5. The tasks appear in the web workspace.
6. The leader reviews and edits them.
7. The leader can also create and edit tasks directly in the UI.

## Build stages

### 1. Inspect the repository
Identify the current framework, dependencies, authentication, database, deployment setup, and existing work. Preserve a functioning setup where possible.

### 2. Build the foundation
Create the database structures, membership/access checks, validation, and shared server-side services.

### 3. Build the web workflow
Implement organization workspace, task list, create/edit form, task detail, and event history.

### 4. Connect MCP
Implement the minimal tools needed to find organizations and members, list tasks, create tasks, and update supported task fields.

### 5. Verify the whole path
Test that a real assistant tool call creates a real task that appears correctly in the UI. Test authorization failures and invalid or ambiguous inputs.

### 6. Validate with leaders
Observe leaders using the workflow and compare it with their existing process. Record confusion, setup friction, preference, and reasons they would or would not use it.

## Prototype readiness checklist

- [ ] Supported AI assistant can be configured using documented steps.
- [ ] Natural-language delegation creates real records through MCP.
- [ ] Task title, instructions, assignee, and deadline are correct.
- [ ] The created task appears in the TaskPit UI.
- [ ] Leader can edit the task in the UI.
- [ ] Leader can create a task directly in the UI.
- [ ] Ambiguous or invalid input results in clarification or a clear error.
- [ ] Authorization and organization data isolation are tested.
- [ ] Setup and limitations are documented.

## Important boundary

Passing this checklist shows that the prototype works technically. It does not yet establish that leaders prefer it or that it improves completion rates.

Related: [[System Architecture]], [[MCP Integration]], [[Prototype Validation]].
