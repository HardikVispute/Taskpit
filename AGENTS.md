# TaskPit Engineering Rules

## Source of truth
- Read architecture.md before making architectural changes.
- Follow the product requirements and documented business rules.
- Do not invent product behavior when requirements are unclear.
- Propose significant architectural changes before implementing them.
- Treat provisional technology choices as provisional until confirmed.

## Implementation
- Build small, complete, testable vertical slices.
- Inspect existing code before creating or modifying files.
- Reuse established patterns instead of introducing unnecessary frameworks, abstractions, or dependencies.
- Never simulate a backend operation that is supposed to be real.
- Never silently swallow errors or report failed operations as successful.

## Security
- Enforce authorization on the server and, where applicable, at the database layer.
- Treat all client input, AI output, and external requests as untrusted.
- Enforce organization-level data isolation.
- Never trust organization IDs, user IDs, or roles supplied by clients without validating them against the authenticated identity.
- Never expose secrets, credentials, or privileged database keys.
- Never bypass authorization to make a test or feature pass.
- Use least-privilege access and validate every sensitive operation.

## Testing
- Add tests for every new business rule.
- Test unauthorized access, cross-organization access, invalid input, and failure paths.
- Add regression tests for bugs before considering them fixed.
- Run relevant tests, type checks, linting, and production builds.
- Never claim a check passed unless it was actually executed.
- Never disable a failing test simply to achieve a green build.

## Git and review
- Inspect the diff before accepting changes.
- Never overwrite unrelated user changes.
- Never commit secrets.
- Do not deploy or perform destructive operations without authorization.
- Report modified files, tests executed, failures, security concerns, and unresolved assumptions at the end of each task.

## Completion criteria
A feature is not complete merely because it appears to work. It must satisfy its requirements, handle errors, pass applicable tests, respect authorization boundaries, and be reviewable.

## Session Continuity
- Read CURRENT_STATE.md at the start of each development task.
- Inspect the repository before assuming the recorded state is current.
- At the end of each meaningful task, update CURRENT_STATE.md.
- Record completed work, files changed, tests actually executed,
  results, unresolved issues, and the next actionable task.
- Update architecture.md and product notes when an approved
  architectural or product decision changes.
- Never record an assumption as a confirmed decision.
- Never claim that unverified functionality works.
- Keep the state document concise and current.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
