import {
  createSdkMcpServer,
  query,
  tool,
  type HookCallback,
  type Options,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import {
  buildHookContext,
  computeWorkspaceImpact,
  normalizePath,
} from "./marketplace-impact.js";

function extractFilePath(toolInput: Record<string, unknown> | undefined): string {
  const candidate = toolInput?.file_path;
  return typeof candidate === "string" ? normalizePath(candidate) : "";
}

const affectedPackages = tool(
  "affected_packages",
  "Compute repo-specific packages and test targets affected by a workspace path.",
  z.object({ path: z.string() }),
  async ({ path }: { path: string }) => {
    // TODO: Call computeWorkspaceImpact(path), return a concise text summary,
    // and include the full ImpactResult as structuredContent.
    void path;

    return {
      content: [{ type: "text", text: "TODO: compute affected packages." }],
      structuredContent: {
        changedPath: "",
        impactedPackages: [],
        testTargets: [],
      },
    };
  },
  { readOnlyHint: true },
);

const nudgeImpactAnalysisAfterEdit: HookCallback = async (input) => {
  const filePath = extractFilePath(input.tool_input);

  // TODO: Use buildHookContext(filePath).
  // Return {} when the edit is not workspace-sensitive.
  // Return hookSpecificOutput.additionalContext when it is.
  void filePath;

  return {};
};

const repoServer = createSdkMcpServer({
  name: "repo",
  version: "1.0.0",
  tools: [
    // TODO: Register affectedPackages here.
  ],
});

const options: Options = {
  permissionMode: "acceptEdits",
  tools: ["Read", "Grep", "Edit", "Write"],
  allowedTools: [
    "Read",
    "Grep",
    "Edit",
    "Write",
    // TODO: Allow "mcp__repo__affected_packages".
  ],
  mcpServers: {
    repo: repoServer,
  },
  hooks: {
    PostToolUse: [
      {
        matcher: "Edit|Write",
        hooks: [nudgeImpactAnalysisAfterEdit],
      },
    ],
  },
};

export async function runExercise(): Promise<string> {
  for await (const message of query({
    prompt:
      "Make the requested marketplace workspace edit. If the edit touches a " +
      "workspace under packages/ or apps/, use affected_packages before " +
      "selecting validation commands or finishing.",
    options,
  })) {
    if (message.type === "result") {
      return message.result;
    }
  }

  return "No result received.";
}

export const exerciseOptions = options;
