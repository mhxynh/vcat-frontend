**STOP!** Before submitting, ensure your PR is **Atomic**. If this PR fixes a bug _and_ adds a feature, split it into two. Bloated PRs will be rejected without review.

## Jira Ticket

[DEV-XXX]()

## Summary of Changes

_Describe the UI/Logic changes briefly. What specific component or route did you work on? (Bullet points are OK!)_

## Scope Control

_By checking these boxes, you confirm this PR is not "bloated":_

[ ] Single Purpose: This PR addresses only the ticket listed above.

[ ] No Hidden Refactors: I have NOT refactored or reformatted code in files unrelated to this ticket.

[ ] Clean Diffs: I have checked the "Files Changed" tab and confirmed there are no accidental changes (e.g., deleted comments, unintended spacing).

## Test Walkthrough (Required)

_Provide a step-by-step guide on how the reviewer can reproduce your test results locally._

1. Prerequisite: (e.g., Start backend, login as "Admin")
2. Action: (e.g., Navigate to /catalog)
3. Observation: (e.g., Click 'Add Test' and verify the modal appears)
4. Expected Result: (e.g., Check that the new entry appears in the list and console is clear)

## Visual Proof

Please attach a screenshot or GIF of the UI change(s).

## Quality Standards

[ ] Formatting: I ran `npm run format` (Prettier).

[ ] Linting: `npm run lint` (ESLint) passes with no new errors.

[ ] Local Connection: I have verified this works with the backend running on `localhost:3000`.

[ ] Console Check: Zero red errors or leftover `console.log` statements.

## Reviewer’s "Quick Reject" Criteria

_Reviewers, you may click Request Changes immediately if:_

- The Scope Control boxes are checked but the PR contains unrelated changes.
- The Test Walkthrough is missing or non-functional.
- The Files Changed count is unnecessarily high (more than 10-15 files for a simple UI change) for the task described.
- If the lines are highlighted as changed but the code looks identical, the author likely ran a global formatter. Ask them to revert unrelated files.
