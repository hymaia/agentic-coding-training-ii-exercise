import express from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const issueResolutionsDirectory = path.resolve(
  __dirname,
  "../../../../knowledge-base/issue-resolutions",
);

const app = express();
const port = process.env.PORT || 3001;

function isoNow() {
  return new Date().toISOString();
}

let nextThreadId = 1;
let nextMessageId = 1;

const reviewThreads = [];

function sanitizeThread(thread) {
  return {
    ...thread,
    replyAllowed: !thread.messages.some((message) => message.author === "author"),
  };
}

function toIssueFilename(threadId) {
  return `${threadId.replace(/[^a-zA-Z0-9-_]/g, "-")}.md`;
}

function toIssueMarkdown(thread, reply) {
  return `# Review Reply: ${thread.id}

## Finding

- File: \`${thread.finding.file}\`
- Line: ${thread.finding.line}
- Severity: ${thread.finding.severity}
- Message: ${thread.finding.message}
- Evidence: ${thread.finding.evidence}

## Thread

- Thread ID: ${thread.id}
- Created At: ${thread.createdAt}
- Reply Recorded At: ${reply.createdAt}

## Review Bot Message

${thread.messages
  .filter((message) => message.author === "review-bot")
  .map((message) => message.body)
  .join("\n\n")}

## Author Reply

${reply.body}
`;
}

async function storeReplyAsMarkdown(thread, reply) {
  await mkdir(issueResolutionsDirectory, { recursive: true });
  const issueFilename = toIssueFilename(thread.id);
  const issuePath = path.join(issueResolutionsDirectory, issueFilename);
  await writeFile(issuePath, toIssueMarkdown(thread, reply), "utf8");
  return path.relative(process.cwd(), issuePath);
}

function summarizeThreads(threads) {
  return threads.map((thread) => ({
    id: thread.id,
    status: thread.status,
    createdAt: thread.createdAt,
    finding: thread.finding,
    replyAllowed: !thread.messages.some((message) => message.author === "author"),
    messageCount: thread.messages.length,
    lastMessageAt: thread.messages.at(-1)?.createdAt ?? thread.createdAt,
    preview: thread.messages.at(-1)?.body ?? "",
  }));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "admin-review-inbox",
    timestamp: isoNow(),
  });
});

app.get("/api/chat/threads", (_req, res) => {
  const threads = summarizeThreads(reviewThreads).sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
  res.json({ items: threads, total: threads.length });
});

app.get("/api/chat/threads/:id", (req, res) => {
  const thread = reviewThreads.find((item) => item.id === req.params.id);
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  res.json(sanitizeThread(thread));
});

app.post("/api/chat/threads", (req, res) => {
  const { finding, message } = req.body ?? {};
  if (
    !finding ||
    typeof finding.file !== "string" ||
    typeof finding.line !== "number" ||
    typeof finding.severity !== "string" ||
    typeof finding.message !== "string" ||
    typeof finding.evidence !== "string" ||
    typeof message !== "string"
  ) {
    res.status(400).json({ error: "Invalid thread payload" });
    return;
  }

  const createdAt = isoNow();
  const thread = {
    id: `thread-${nextThreadId++}`,
    finding,
    status: "open",
    createdAt,
    messages: [
      {
        id: `message-${nextMessageId++}`,
        author: "review-bot",
        body: message.trim(),
        createdAt,
      },
    ],
  };

  reviewThreads.unshift(thread);
  res.status(201).json(sanitizeThread(thread));
});

app.post("/api/chat/threads/:id/reply", async (req, res) => {
  const thread = reviewThreads.find((item) => item.id === req.params.id);
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  if (thread.messages.some((message) => message.author === "author")) {
    res.status(409).json({ error: "Author reply already recorded for this thread" });
    return;
  }

  const body = String(req.body?.body ?? "").trim();
  if (!body) {
    res.status(400).json({ error: "Reply body is required" });
    return;
  }

  const reply = {
    id: `message-${nextMessageId++}`,
    author: "author",
    body,
    createdAt: isoNow(),
  };

  try {
    const replyDocumentPath = await storeReplyAsMarkdown(thread, reply);
    thread.messages.push(reply);
    thread.status = "replied";
    thread.replyDocumentPath = replyDocumentPath;
  } catch (error) {
    res.status(500).json({
      error: "Failed to store reply in knowledge-base/issue-resolutions",
      detail: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  res.status(201).json(sanitizeThread(thread));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Admin review inbox listening on http://localhost:${port}`);
});
