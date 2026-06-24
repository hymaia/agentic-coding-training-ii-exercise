# Workspace Impact Analyzer Starter

This is the starter repository for the exercise.

You are building a Claude Agent TypeScript SDK setup that helps an agent understand what else is affected after it edits a workspace file in a synthetic marketplace monorepo.

## Scenario

The synthetic repo models a marketplace with shared packages and apps:

- `packages/web`
- `packages/ui`
- `packages/catalog`
- `packages/checkout`
- `packages/search`
- `packages/auth`
- `apps/admin`
- `apps/storefront`
- `apps/seller-portal`

When Claude edits one workspace, it should be nudged to call a custom MCP tool that returns impacted packages and test targets.

## Your Tasks

Implement the TODOs in:

- `src/marketplace-impact.ts`
- `src/starter.ts`

Expected flow:

```text
Edit|Write -> PostToolUse additionalContext -> mcp__repo__affected_packages
```

## Local Checks

```bash
npm run check
npm run smoke
```

The smoke test simulates edits against the synthetic marketplace fixture and prints hook context plus structured impact output.

## Success Criteria

- `affected_packages` returns repo-specific impacted package and test target data.
- `createSdkMcpServer(...)` registers the custom tool under the `repo` MCP server.
- `allowedTools` includes `mcp__repo__affected_packages`.
- The `PostToolUse` hook only adds `additionalContext` for workspace-sensitive paths.
- Non-workspace paths, such as `docs/architecture.md`, produce no hook context.
