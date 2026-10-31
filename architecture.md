# TaskPit Architecture

**Status:** Initial build blueprint for Antigravity  
**Purpose:** Build a working prototype that tests whether student-organization leaders prefer delegating through their own AI assistant connected to TaskPit over creating and distributing task documents manually.

This document separates the first build from the wider vision. Features marked as future extensions are not MVP commitments.

## 1. Product definition

TaskPit is an AI-native team execution platform. Organizations use it to manage members, assignments, deadlines, progress, submissions, reviews, and work history. Leaders can work through TaskPit's web UI or through an AI assistant connected by MCP.

**TaskPit is the source of truth.** The AI assistant is an interface to TaskPit, not a replacement for the platform. The UI must support direct work as well; not every action should require AI.

### Problem being explored

In student organizations and event teams:
- Members ignore assignments or miss deadlines.
- Leaders repeatedly chase members for progress.
- Leaders struggle to maintain a reliable record of who contributed what.
- Submissions may be fake, incomplete, broken, or fail to meet requirements.
- Leaders must manually inspect work, request corrections, and decide whether it is complete.

Creating structured tasks may improve organization, but it does not automatically solve follow-through or verification. The first prototype tests the delegation experience; later behavior and workflow improvements must be validated rather than assumed.

### Initial audience

- **Primary:** Student-organization leaders who coordinate teams and events.
- **Secondary:** Members who receive assignments and need clear instructions and deadlines.

Start with a small team or one organization. Do not optimize for every possible organization type yet.

## 2. Scope in three buckets

### 2.1 First working prototype

Build this real end-to-end workflow:

1. A leader describes work to their preferred AI assistant in natural language.
2. The assistant calls TaskPit tools through MCP.
3. TaskPit creates persistent, structured task records and assigns them to organization members.
4. Tasks appear in the TaskPit web UI.
5. The leader can inspect and edit the tasks through the UI.
6. The leader can also create and edit tasks directly in the UI.

The core hypothesis is:

> Do student-organization leaders find delegating through their own AI assistant connected to TaskPit more natural and convenient than their current workflow of using AI to prepare task documents and distributing them manually?

This is a **working prototype**, not a static mockup. MCP calls must create real database records. Do not fake a successful integration.

### 2.2 Architectural foundations

Build only what is needed now, but preserve a clear path to:
- Organization and team membership.
- Task ownership, deadlines, and status.
- A lifecycle that can later support acknowledgment, progress, blockers, submissions, reviews, revisions, and completion.
- Work history and attribution.
- A shared application service layer used by both the UI and MCP.
- Authentication and organization-scoped access control.
- Notifications and AI-assisted submission checks later.

### 2.3 Future extensions, not MVP commitments

Do not implement these unless explicitly requested later:
- Member-facing AI companions.
- Project-aware AI memory or a project second brain.
- Contribution scores, credit formulas, public profiles, or leaderboards.
- Certificates and reward systems.
- Advanced analytics.
- Automated dispute handling or complex organization hierarchies.
- WhatsApp or other external notification channels.
- AI automatically approving every type of submission.

These are possible future directions, not confirmed MVP requirements.

## 3. Non-goals and guardrails

- Do not build a generic task-management clone with a huge feature set.
- Do not treat task creation as proof that execution improved.
- Do not mark a task complete just because a member says it is done or uploads a file.
- Do not claim AI can verify every type of work. Some work requires human judgment.
- Do not implement contribution scoring before attribution and review rules are defined.
- Do not add notification providers before the workflow requires them.
- Do not hard-code one organization or its members into business logic.
- Do not expose secrets or service-role credentials to the browser.
- Do not let MCP bypass the same authorization and validation rules as the web app.
- Do not overengineer for hypothetical scale.

## 4. Provisional technical baseline

The founder has not confirmed a final stack. To make progress without blocking on more interviews, use this as a **provisional default**, adapting to the existing repository when sensible:

- Web app: Next.js, React, TypeScript.
- UI: Tailwind CSS and accessible reusable components.
- Backend: Next.js server-side route handlers/server actions plus a shared service layer.
- Database: PostgreSQL.
- Managed database/auth default: Supabase, unless the repository already has a working equivalent.
- Validation: Zod or an equivalent runtime schema validator.
- MCP: TypeScript MCP server exposing a small set of TaskPit operations.
- Tests: unit tests for domain rules and integration tests for task creation, authorization, and MCP operations.
- Deployment: preserve existing repository deployment conventions; otherwise choose the simplest reliable setup.

Before coding, inspect the repository, package files, environment examples, and existing specs. Do not rewrite a working stack merely to match this proposal. Record any significant deviation and rationale. Never commit credentials; maintain an `.env.example` with placeholder values only.

## 5. Core domain model

Use stable IDs, timestamps, explicit relationships, server-side validation, and database constraints. Adapt physical schema to the repository while preserving these concepts.

### Organization
- `id`
- `name`
- `created_at`
- `updated_at`

### User
- `id`
- `display_name`
- `email` or external identity
- `created_at`

Avoid unnecessary personal data.

### OrganizationMembership
- `id`
- `organization_id`
- `user_id`
- `role` (`leader` or `member` initially)
- `created_at`

A person may eventually belong to multiple organizations. Roles are scoped to a membership, not globally to a user.

### Task
- `id`
- `organization_id`
- `title`
- `description` (instructions and expected deliverable)
- `assignee_membership_id`
- `created_by_membership_id`
- `due_at` (nullable when no deadline was provided)
- `status`
- `created_via` (`web` or `mcp`)
- `created_at`
- `updated_at`

Candidate lifecycle statuses:
- `open`
- `in_progress`
- `submitted`
- `in_review`
- `changes_requested`
- `completed`
- `cancelled`

These statuses leave room for future execution workflows. Only expose transitions that are implemented and tested. Do not pretend unsupported transitions work.

### TaskEvent
Append-only history of meaningful changes:
- `id`
- `task_id`
- `organization_id`
- `actor_membership_id` (nullable for system events)
- `event_type`
- `details` (validated structured JSON; never include secrets)
- `created_at`

Record task creation, assignment changes, deadline changes, status changes, and edits to important instructions. Do not rely only on the latest task row to reconstruct history.

Submissions, reviews, comments, blockers, notifications, projects, AI memory, certificates, and contribution records may become separate entities later. Do not build elaborate versions now without a defined MVP need.

## 6. Roles and authorization

Initial roles:
- **Leader:** Can create and manage tasks within their organization, assign work to members of that organization, and view organization tasks.
- **Member:** Can view tasks assigned to them. Add member actions such as acknowledgment, progress updates, comments, or submission only when those flows are implemented.

Authorization requirements:
- Enforce access on the server for every read/write. UI visibility is not authorization.
- Every operation must be scoped to an organization the caller belongs to.
- A leader can assign a task only to a member of the same organization.
- A member cannot access another organization's records by changing an ID.
- MCP must identify and authorize its acting user/integration identity. Never trust a supplied organization or membership ID without checking access.
- Keep service-role credentials server-side.
- If an MCP client cannot be securely mapped to an authorized identity, do not expose unauthenticated production writes as a workaround. Document the limitation and provide a safe local development path.

## 7. Main workflows

### 7.1 AI-assisted delegation
1. Leader describes the work in natural language.
2. The assistant asks for clarification when critical information, such as the assignee or task meaning, is ambiguous. It must not silently invent important details.
3. The assistant uses MCP to find the correct organization and eligible members, then creates tasks.
4. The server validates input and authorization.
5. Shared application services persist tasks and task-history events.
6. The tool returns structured results: task IDs, titles, assignees, deadlines, and validation errors.
7. The leader opens TaskPit to inspect, edit, or add assignments.

For bulk creation, report partial success and failure explicitly. Do not silently omit failed tasks.

### 7.2 Direct UI delegation
1. Leader opens an organization workspace.
2. Leader views the task list.
3. Leader creates a task, enters instructions, chooses an eligible member, and optionally sets a deadline.
4. The saved task appears in the list.
5. Leader can edit supported fields and inspect task history.

### 7.3 Member view
Where authenticated member access is available, show assigned tasks with instructions, deadline, status, and relevant history. Do not display fake submission, review, or progress controls unless those flows work end to end.

## 8. MCP design

MCP is an integration layer, not a second implementation of business logic.

Principles:
- MCP tools call shared TaskPit application services.
- Services enforce validation and permissions.
- Tool descriptions explain purpose and required arguments.
- Use structured input/output schemas and actionable errors.
- Never expose SQL details, stack traces, secrets, or private records in errors.
- Read tools should allow the assistant to identify organizations, members, and existing tasks before writing.
- Do not silently perform destructive or ambiguous actions.
- Avoid duplicate tasks on retries. Support an idempotency key where practical; otherwise document the limitation.

### Initial MCP tools

1. `list_my_organizations`: organizations available to the authorized integration identity.
2. `list_organization_members`: eligible members for an organization.
3. `list_tasks`: bounded task list with optional status/assignee filters.
4. `create_task`: organization, title, description, assignee membership, optional deadline, optional idempotency key.
5. `update_task`: task ID and supported editable fields.

Do not implement arbitrary SQL/code-execution tools. Do not allow the model to set the creator identity or bypass membership checks.

Inspect the current MCP SDK and target client before implementing the transport and authentication. Document connection setup and known client/plan limitations. Do not claim every AI plan supports custom connectors. Local development auth must not become a production bypass.

## 9. Shared services and API boundaries

Keep business rules in shared server-side services, for example:
- `OrganizationService`
- `MembershipService`
- `TaskService`
- `TaskHistoryService`

Both web routes/actions and MCP tools must call these services. Avoid duplicating validation, task creation, or authorization logic.

Provide typed request/response schemas and consistent errors. Do not expose raw database rows without checking which fields should be returned.

## 10. UI direction

Build a credible work product, not a generic AI dashboard.

Core screens:
1. **Organization workspace:** organization name, navigation, useful task list, primary create-task action.
2. **Create/edit task:** title, instructions, assignee, optional deadline, validation, save state.
3. **Task detail:** instructions, assignee, deadline, status, timestamps, available history.
4. **Member task view:** assigned work in a clear, focused layout.

UX requirements:
- Prioritize information hierarchy and scanning.
- Distinguish overdue, due-soon, and completed states without relying on color alone.
- Include meaningful empty, loading, validation, and failure states.
- Do not display decorative metrics that are not backed by real data.
- Do not show fake AI activity, fake notifications, or fake integrations.
- If MCP is not configured, show setup guidance rather than implying it is connected.
- Ensure keyboard accessibility and usability on laptop and mobile screen sizes.

## 11. Future execution and submission quality

The broader vision may eventually support:

`Assigned → Acknowledged → In progress → Submitted → In review → Changes requested / Approved → Completed`

This is a candidate lifecycle, not permission to implement every state now.

Future principles:
- Acknowledgment means the member has seen/accepted the assignment, not that the work is done.
- Submission means work was provided, not that it is valid or accepted.
- A submission can be incomplete, broken, irrelevant, or dishonest.
- Task instructions should eventually include acceptance criteria or expected evidence when appropriate.
- AI may compare a submission with explicit requirements and flag gaps, while communicating uncertainty.
- Leaders retain approval authority for subjective or high-impact work unless an explicit later policy says otherwise.
- Revision requests should identify what needs fixing and preserve history.
- Work history should distinguish the submitter, reviewer, and approver.
- Do not implement an ungrounded trust score or automatic contribution-credit formula.

## 12. Notifications and follow-through

Repeated chasing is a major pain point, but no notification provider is required for the first prototype unless the core flow needs it.

Future notification types may include assignment notices, acknowledgment requests, deadline reminders, overdue reminders, blocker escalation, and review requests. When built, reminders should be configurable and rate-limited. Record delivery failures where practical. A sent notification is not proof it was read.

## 13. Security, privacy, and reliability

- Server-side authorization on every read/write.
- Organization-scoped data access.
- Runtime validation at every external boundary, including MCP.
- Secure sessions and secret handling.
- No secrets or sensitive environment values in logs.
- Avoid storing AI conversation contents unless specifically needed; store task data and operational events.
- Use database constraints and transactions for consistency.
- Log operational errors without leaking private task content.
- Provide clear user-facing errors and safe retry behavior.
- Use pagination or bounded results for task/member lists.
- Keep development and production configuration separate.

## 14. Tests and acceptance criteria

Required tests:
- Leader creates a task through the UI.
- Leader edits supported fields.
- Assignment to a non-member is rejected.
- A user cannot read or mutate another organization's task.
- Task creation and important edits create history events.
- MCP `create_task` persists a real record through the same service used by the UI.
- MCP rejects invalid and unauthorized requests.
- MCP reports success/failure clearly.
- The persisted task appears correctly in the UI.
- Failed operations never falsely report success.

The working prototype is ready for user testing when:
1. A leader can configure a supported MCP client using documented instructions.
2. The leader can ask their assistant to create and assign a task in natural language.
3. The MCP call creates a real, authorized database record.
4. The task appears in TaskPit with correct instructions, assignee, and deadline.
5. The leader can edit it in the UI.
6. A leader can also create a task directly in the UI.
7. Ambiguous/invalid input produces clarification or clear errors rather than incorrect silent assignments.
8. Basic authorization and isolation tests pass.
9. Setup steps, limitations, and known gaps are documented.

These criteria prove technical function, not product-market fit or improved completion rates.

## 15. Suggested repository structure

Adapt this to the existing codebase; do not force a rewrite.

```text
taskpit/
  app/
    organizations/
    tasks/
    api/
  components/
    layout/
    tasks/
    organizations/
    ui/
  lib/
    auth/
    db/
    validation/
    services/
      organization-service.ts
      membership-service.ts
      task-service.ts
      task-history-service.ts
  mcp/
    server.ts
    tools/
    auth/
  tests/
    unit/
    integration/
  docs/
    architecture.md
  .env.example
  README.md
```

If the repository expects `architecture.md` at its root, use that location and avoid duplicate copies.

## 16. Implementation sequence

### Phase 0: Inspect
- Inspect repository, specs, dependencies, auth, database, and deployment.
- Report conflicts before destructive changes.
- Preserve existing work where possible.

### Phase 1: Foundation
- Configure database/schema and migrations.
- Implement organization membership, server-side authorization, validation, and shared services.

### Phase 2: Web workflow
- Build organization workspace, task list, create/edit, task detail, and history.
- Add loading, empty, validation, and failure states.

### Phase 3: MCP workflow
- Implement the minimal MCP server/tools.
- Connect tools to shared services.
- Test permissions and errors.
- Document client configuration and limitations.

### Phase 4: End-to-end verification
- Test delegation through a supported AI client.
- Verify real tasks appear in the UI.
- Test ambiguous assignees, invalid IDs, missing optional deadlines, and permission failures.
- Fix reliability before polishing secondary features.

### Phase 5: Validate with users
- Show the working experience to student-organization leaders.
- Observe whether they can use it without excessive coaching.
- Compare against their actual current workflow: using AI to prepare task documents and distributing them manually.
- Record confusion, setup friction, preference, and reasons for rejection.
- Do not treat technical success as proof of product-market fit.

## 17. Open decisions

These are not yet founder-approved product decisions:
- Final stack and hosting.
- MCP client/transport and production authentication mechanism.
- Organization creation and member invitation flow.
- Multiple organization membership in the first release.
- Whether projects are MVP or a later extension.
- Whether members can acknowledge, update progress, comment, or submit in the first release.
- Exact status-transition rules.
- Notification channels and reminder policy.
- Submission verification and human-review rules.
- Contribution attribution, recognition, and certificate rules.
- Number of prototype testers and formal success criteria.

Where a technical choice is necessary to proceed, use the provisional baseline, keep it easy to change, and document the rationale. Do not invent product behavior to close a gap.

## 18. Instructions to Antigravity

1. Read this document and inspect the repository before coding.
2. Preserve existing work unless a change is necessary and explained.
3. Build the smallest end-to-end workflow described here.
4. Use real persistence and real MCP calls for the delegation path.
5. Share business logic between UI and MCP.
6. Implement authorization and validation from the beginning.
7. Do not build deferred features just because they appear in the future vision.
8. Do not substitute fake interactions for required functionality.
9. Keep setup instructions and `.env.example` accurate.
10. Run available checks and tests, then report what passed, failed, and remains incomplete.
11. If the codebase conflicts with this document, explain the conflict and propose the smallest safe resolution before a broad architectural change.

**Goal:** Build a real, reliable first slice that tests TaskPit's defining interaction: a leader delegates through their preferred AI assistant, and the resulting work becomes structured, editable, persistent records in TaskPit.
