## Exercise: Consensus Review Memory with QMD

### Goal

Extend the `020` consensus review workflow so it learns from thread replies over time.

Keep the existing workflow shape, thread UI, consensus policy, and blocking reply behavior from `020`. Add QMD as the memory layer for thread feedback so the workflow can use prior thread replies during future review runs.

---

### Prerequisites

- Install QMD via npm or bun (cf https://github.com/tobi/qmd)
- Add the collection folder for the issue resolutions:
  
`qmd collection add ~/<path-to-this-project>/knowledge-base/issue-resolutions --name issue-resolutions`

- ⚠️ Do not forget to run `qmd update` and `qmd embed` after adding new documents to the collection so that they are available for retrieval.

---

### Scenario

You already have the consensus review workflow from `020`:

- The script owns fan-out, aggregation, consensus, and side effects
- The workflow reviews a bounded diff that touches at least two files under `marketplace/src/`
- The existing admin thread UI is reused from `marketplace/src/apps/admin/`
- The admin chat server is `marketplace/src/apps/admin/server.js` and defaults to port `3001`
- The existing thread API is used for thread creation, listing, reading, and replies
- One chat thread is created per accepted actionable line finding
- The user can reply once to each finding/thread
- Each awaited user reply is treated as blocking workflow input and must be received through the chat server API, not through the main chat

Now extend that workflow so it learns from those replies.

The accepted findings and thread replies now contain useful review policy, product context, and author intent that should influence future review runs. Your job is to add a memory-backed review loop that:

- Stores user replies from review threads in QMD
- Retrieves relevant prior feedback before a future consensus review
- Produces a review packet that explains which findings changed because of retrieved memory
---

### Starting Point

Use the workflow shape from `020`:

```text
bounded diff -> changed lines -> 3 parallel reviewers -> consensus groups -> QMD memory read -> auto-fix -> filter unfixed -> one chat thread per finding -> thread reply via local chat API -> QMD memory write
```

Extend it into:

```text
future bounded diff -> changed lines -> 3 parallel reviewers -> consensus groups -> QMD memory read -> auto-fix -> filter unfixed -> one chat thread per finding -> thread reply via local chat API -> QMD memory write
```

---

### Tasks

1. Run or inspect the `020` solution and preserve its workflow shape, thread UI integration, and blocking reply behavior.
2. Update the workflow to read relevant prior feedback from QMD after consensus grouping and before any fix or posting step.
3. Read relevant prior feedback from QMD after consensus grouping and before any fix or posting step.
4. Define a QMD memory schema for review-thread feedback.
5. Use the retrieved QMD feedback to decide how findings should be auto-fixed, suppressed, rewritten, or left unchanged.
6. Attempt automatic fixes for findings that should be handled without opening a thread.
7. Filter out findings that were successfully auto-fixed so only unresolved findings remain.
8. Create one chat thread per unresolved finding through the local chat API.
9.  Continue to receive thread replies through the local chat API rather than the main chat whenever the workflow needs follow-up input.
10. Block on each required thread reply until it is available through the local chat API.

---

### Success Criteria

- The `020` workflow behavior remains intact: the script owns fan-out, aggregation, consensus, and side effects.
- The existing admin thread UI and local chat API are reused as-is rather than replaced.
- The workflow uses QMD as persistent memory, not just as static documentation search.
- User replies from prior threads affect at least one future review decision.
- Findings can be auto-fixed before any chat thread is created.
- Only unresolved findings are posted as chat threads after memory read and auto-fix have both been applied.
- Raw reviewer notes are not sent directly to the thread platform.
- Every posted chat thread maps to one unresolved finding that remains after filtering.
- Reply handling still happens through the local chat API rather than the main chat loop.
- The final review packet explains why memory changed the output.

---

### Bonus Goal

- The workflow is integrated into the Agent SDK app implemented in `010`.
- The Agent SDK app integrates RTK for blame and history inspection when deciding whether a finding is new, recurring, or already accepted tradeoff.
