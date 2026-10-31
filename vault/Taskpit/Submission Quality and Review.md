---
type: product-principle
project: TaskPit
tags: [taskpit, submissions, review, ai]
---

# Submission Quality and Review

## The problem

Task submissions can be fake, incomplete, broken, or unrelated to the original requirements. Leaders often have to inspect everything manually, request changes, and decide whether the work is acceptable.

## Desired direction

TaskPit should eventually help members understand what good work looks like and help leaders evaluate submissions more efficiently.

Possible capabilities to explore:
- Clear instructions and acceptance criteria.
- Required evidence or deliverable formats where appropriate.
- AI-assisted checks against explicit task requirements.
- Detection of obvious omissions or inconsistencies.
- Specific revision requests.
- A history of submissions, reviews, and approvals.

## Trust boundary

AI can help identify likely gaps, but it cannot reliably verify every type of work. The method depends on the task and available evidence. Subjective, ambiguous, or high-impact work may require human review.

A submitted item is not automatically an accepted result. Keep these concepts distinct in the [[Task Lifecycle]].

## Design principles

- Explain what is missing rather than giving only a pass/fail result.
- Preserve evidence and review history.
- Make uncertainty visible.
- Keep human approval available.
- Do not equate activity, upload, or self-reported completion with verified contribution.

This is a central future product direction; the exact first-release behavior still needs definition.
