---
type: reference
project: TaskPit
tags: [taskpit, decisions]
---

# Decision Register

This register captures the current decisions established during the TaskPit discussion.

| ID | Topic | Decision | Status |
|---|---|---|---|
| D1 | Architecture document scope | Cover the MVP, architectural foundations, and defined future extensions in separate buckets. | Confirmed |
| D2 | Pilot status | Pilot has not started. Prototype first, validate, then refine implementation scope. | Confirmed |
| D3 | Future extensions | Member-facing companions, project-aware memory, contribution recognition, certificates, and advanced analytics are future directions to justify before building. | Confirmed |
| D4 | Technical/product details | Final stack, schema details, lifecycle, permissions, and business rules were not all finalized in the interview. | Open |
| D5 | Core prototype question | Do leaders find delegating through their own AI assistant connected to TaskPit more natural and convenient than their current workflow? | Confirmed |
| D6 | Initial audience | Student-organization leaders. | Confirmed |
| D7 | Workflow to test | Natural-language request → assistant creates/assigns via MCP → structured tasks appear in TaskPit UI → leader reviews and edits. | Confirmed |
| D8 | Tester count and success criteria | To be defined as the experience is clarified and tested. | Open |
| D9 | Identity & multi-org model | One TaskPit account across many organization memberships. Roles (leader, member, volunteer) are strictly scoped per organization membership. | Confirmed |
| D10 | Authentication provider | Supabase Auth owns credentials and session refresh; TaskPit PostgreSQL maps user profile and organization memberships. | Confirmed |
| D11 | Organization onboarding policy | Users without memberships see a dedicated onboarding state. No automatic leader rights or unverified organization access are granted without leader invitation. | Confirmed |

## Additional product context

The key operational pains are ignored assignments/missed deadlines, repeated chasing, weak contribution history, fake or broken submissions, and manual verification burden.

The architecture document uses a provisional technical baseline to unblock implementation. A provisional implementation choice is not the same as a fully validated product decision.

Related: [[TaskPit Home]], [[Open Product Questions]].
