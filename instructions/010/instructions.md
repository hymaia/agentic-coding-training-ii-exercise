---
layout: center
---

## Exercise: Workspace Impact Analyzer

---

### Goal

Build a small Claude Agent SDK setup that tells the agent what else is affected after a workspace edit.

---

### Scenario

- Claude edits a file in `marketplace/src/packages/web/`
- The change can affect `marketplace/src/packages/ui/`, `marketplace/src/apps/admin/`, and a few test targets
- Built-in tools can read files, but they cannot compute the repo's dependency impact
- Use a hook to steer the loop and a custom tool to calculate the affected workspace scope

---

### Files / Deliverables

- Work in one SDK file such as `agent/src/starter.ts`
- Add one custom tool: `affected_packages`
- Add one `PostToolUse` hook on `Edit|Write`
- Produce one short trace showing `Edit|Write -> hook context -> mcp__repo__affected_packages`

---

### Tasks

1. Implement `affected_packages`
2. Register it with `createSdkMcpServer(...)`
3. Allow it as `mcp__repo__affected_packages`
4. Inject `additionalContext` only for edits under workspace-sensitive paths
5. Return structured impacted package and test target data
6. Capture minimal tool sequence evidence

---

### Success Criteria

- The hook only nudges dependency-sensitive edits
- The custom tool computes repo-specific impact, not generic file lookup
- The trace shows the next action changing based on the impact result
- The whole exercise fits in one small SDK file
