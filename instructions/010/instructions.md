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

---

### Running the Agent

### 1. Create a runner script to run the agent with a custom prompt.

Example:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { exerciseOptions } from "./starter.js";

declare const process: { argv: string[]; stdout: { write(s: string): void } };

const prompt = process.argv[2] ?? "A_DEFAULT_PROMPT" +
  "After editing, check what else is affected.";

console.log("Prompt:", prompt);
console.log("---");

for await (const message of query({ prompt, options: exerciseOptions })) {
  switch (message.type) {
    // ...
  }
}
```

### 2. Run the agent with a custom prompt

Example:

```bash
node dist/agent/src/run.js "Edit packages/catalog/src/product-card.ts to add a discount field"
```

### Notes

**Authentication:** no extra setup needed. The Agent SDK inherits the session from the already logged-in `claude` CLI (`claude login`). If not yet logged in, run `claude login` once.

**Configuration** (`agent/src/starter.ts`):

| Option | Value | Purpose |
|---|---|---|
| `permissionMode` | `acceptEdits` | auto-approve file edits |
| `tools` | `Read, Grep, Edit, Write` | built-in tools available |
| `allowedTools` | adds `mcp__repo__affected_packages` | whitelist custom MCP tool |
| `mcpServers` | `repo` server | hosts `affected_packages` tool |
| `hooks.PostToolUse` | matcher `Edit\|Write` | fires after every file edit |

---

### Bonus Exercise 1: Commit-History Risk Check

Add a second custom tool `commit_risk` that inspects the git history of the edited lines and flags whether the change overlaps with a recent risky area.

**What it should do:**

1. Accept `path` and `lines` (start/end line numbers) as input
2. Run `git log -n 20 --pretty=format:"%h %s" -L <start>,<end>:<path>` to fetch commit messages touching those lines
3. Scan the messages for risk signals: `revert`, `hotfix`, `fix`, `rollback`, `critical`, `security`, `breaking`
4. Return a `riskLevel` (`low | medium | high`), matched keywords, and the raw commit list

**Wire it up:**

- Register it in the same `createSdkMcpServer` call alongside `affected_packages`
- Add `mcp__repo__commit_risk` to `allowedTools`
- Add a second `PostToolUse` hook (or extend the existing one) that injects `additionalContext` nudging the agent to call `commit_risk` when the edited file has a git history

**Success criteria:**

- `commit_risk` runs after `affected_packages` when the edited file is tracked by git
- `riskLevel: high` causes the agent to mention the risk in its final result
- No risk signal on a brand-new file (no git history)

---

### Bonus Exercise 2: Structured Output via `submit_result`

The Agent SDK's `query()` always returns a plain string in `message.result`. To get typed, structured output, add a `submit_result` tool the agent must call as its last step.

**Why create the tool inside `runExercise()`:**

The handler needs to write to a local variable (`captured`) so each call is self-contained. If the tool were created at module load, there would be no per-invocation variable to capture — and concurrent calls would share (and overwrite) the same mutable state.

**What to implement:**

- A `submit_result` tool with fields: `editedFile`, `riskLevel`, `impactedPackages` (JSON array), `testTargets` (JSON array), `summary`
- Change `runExercise()` to return a typed `AgentOutput` instead of `string`
- Enforce the tool call so the agent cannot stop without invoking it

**Key patterns:**

- `submit_result` and its MCP server are created inside `runExercise()` per-invocation — the handler closes over `captured`
- The `Stop` hook (`hooks.Stop`) fires when the agent tries to finish — return `additionalContext` to block early exit when `captured` is still null
- Pass `continue: false` from any hook to abort the session immediately

**Success criteria:**

- `runExercise()` returns `AgentOutput` (not `string`)
- `submit_result` is the agent's last tool call in the trace
- Calling `runExercise()` twice concurrently produces two independent `captured` variables
