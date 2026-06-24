## Exercise: Consensus Review Workflow

### Goal

Build a workflow where the script owns fan-out, aggregation, consensus, and side effects.

---

### Scenario

Human and agent edits have been made in the marketplace repo. You need a repeatable workflow that reviews the changed lines, finds consensus across parallel reviewers, and notifies the author through a local chat UI.

- Use the marketplace repo at `marketplace/src/`
- The local thread UI is already implemented under `marketplace/src/apps/admin/`
- The admin chat server is `marketplace/src/apps/admin/server.js` and defaults to port `3001`
- The admin UI assets live in `marketplace/src/apps/admin/public/`
- Use the existing thread API: `GET /api/chat/threads`, `GET /api/chat/threads/:id`, `POST /api/chat/threads`, `POST /api/chat/threads/:id/reply`
- Review a bounded diff that touches at least two files
- Run 3 parallel reviewer agents that each produce line-level findings with file, line, severity, message, and evidence and a nitpicking style
- Aggregate the raw reviewer notes. Discard any findings that do not meet at lest 2-agents consensus.
- Send chat messages only for accepted actionable line findings after consensus
- Create one chat thread per accepted finding
- Allow the user to reply once to each finding/thread
- Launch the local chat server as part of workflow startup and open the admin UI in a browser for the user to review and reply
- Receive thread replies through the chat server API, not through the main chat
- Treat each awaited user reply as blocking workflow input

---

### Tasks

1. Run the existing local thread-based admin chat UI for review feedback.
2. Implement a workflow that gathers the changed lines from the target repo.
3. Fan out review work to at least three focused reviewers.
4. Normalize reviewer output into line-level findings with file, line, severity, message, and evidence.
5. Aggregate raw reviewer notes into consensus groups.
6. Accept only actionable line findings that meet your consensus policy.
7. Send one message per accepted finding to the chat UI, after consensus is complete.
8. Record the generated chat thread IDs in the workflow output.
9. Start the local chat server automatically when the workflow begins.
10. Handle author replies by polling or calling the local chat API, not by waiting for main chat input.
11. Block on each required author reply until it is available through the local chat API.

---

### Success Criteria

- The workflow script, not the main chat, owns the next step between fan-out, aggregation, consensus, and posting.
- The existing admin thread UI is reused as-is rather than reimplemented elsewhere.
- Raw reviewer notes are not sent directly to the user.
- Every chat thread maps to one accepted actionable line finding.
- The consensus policy is explicit and deterministic.
- The workflow output separates raw reviewer notes, accepted findings, rejected findings, and posted chat threads.
- The workflow is responsible for launching the local chat server.
- Reply handling happens through the local chat API rather than the main chat loop.
- When a reply is required, the workflow waits on that chat response as blocking input.
