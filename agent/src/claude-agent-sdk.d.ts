declare module "@anthropic-ai/claude-agent-sdk" {
  export type ToolContentBlock = {
    type: "text";
    text: string;
  };

  export type ToolResult = {
    content: ToolContentBlock[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  };

  export type ToolHandler<TArgs> = (
    args: TArgs,
  ) => Promise<ToolResult> | ToolResult;

  export type CustomTool<TArgs = Record<string, unknown>> = {
    kind: "custom-tool";
    name: string;
    description: string;
    inputSchema: unknown;
    handler: ToolHandler<TArgs>;
    annotations?: {
      readOnlyHint?: boolean;
    };
  };

  export function tool<TArgs>(
    name: string,
    description: string,
    inputSchema: unknown,
    handler: ToolHandler<TArgs>,
    annotations?: {
      readOnlyHint?: boolean;
    },
  ): CustomTool<TArgs>;

  export type SdkMcpServer = {
    name: string;
    version: string;
    tools: Array<CustomTool<any>>;
  };

  export function createSdkMcpServer(server: SdkMcpServer): SdkMcpServer;

  export type HookInput = {
    hook_event_name: string;
    tool_name?: string;
    tool_input?: Record<string, unknown>;
    tool_response?: unknown;
    session_id?: string;
    cwd?: string;
  };

  export type HookOutput = {
    continue?: boolean;
    systemMessage?: string;
    hookSpecificOutput?: {
      hookEventName: string;
      permissionDecision?: "allow" | "deny" | "ask" | "defer";
      permissionDecisionReason?: string;
      updatedInput?: Record<string, unknown>;
      additionalContext?: string;
      updatedToolOutput?: unknown;
    };
  };

  export type HookCallback = (
    input: HookInput,
    toolUseId?: string,
    context?: {
      signal: AbortSignal;
    },
  ) => Promise<HookOutput> | HookOutput;

  export type HookMatcher = {
    matcher?: string;
    hooks: HookCallback[];
    timeout?: number;
  };

  export type Options = {
    permissionMode?: "default" | "acceptEdits";
    tools?: string[];
    allowedTools?: string[];
    mcpServers?: Record<string, SdkMcpServer>;
    hooks?: Partial<
      Record<
        "PreToolUse" | "PostToolUse" | "PostToolUseFailure" | "PostToolBatch" | "Stop",
        HookMatcher[]
      >
    >;
  };

  export type ResultMessage = {
    type: "result";
    subtype: "success" | "error" | "max_turns";
    result: string;
    sessionId?: string;
  };

  export type SDKMessage =
    | {
        type: "system";
        subtype: "init" | "informational" | "compact_boundary";
        sessionId?: string;
      }
    | {
        type: "assistant";
        message: { content: Array<{ type: string; text?: string }> };
      }
    | {
        type: "user";
        message: { content: Array<{ type: string; text?: string }> };
      }
    | ResultMessage;

  export function query(input: {
    prompt: string;
    options?: Options;
  }): AsyncIterable<SDKMessage>;
}
