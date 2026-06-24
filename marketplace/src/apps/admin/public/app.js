const apiStatus = document.querySelector("#api-status");
const resultsCount = document.querySelector("#results-count");
const threadCount = document.querySelector("#thread-count");
const openCount = document.querySelector("#open-count");
const threadList = document.querySelector("#thread-list");
const threadPanel = document.querySelector("#thread-panel");

let threads = [];
let selectedThreadId = null;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function sendJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityLabel(severity) {
  return severity.toUpperCase();
}

function replyState(thread) {
  return thread.replyAllowed
    ? {
        label: "AWAITING REPLY",
        detail: "Author can still reply",
        className: "reply-state-open",
      }
    : {
        label: "REPLIED",
        detail: "Author reply already recorded",
        className: "reply-state-closed",
      };
}

function renderThreadList() {
  resultsCount.textContent = `${threads.length} accepted finding${threads.length === 1 ? "" : "s"}`;
  threadCount.textContent = String(threads.length);
  openCount.textContent = String(threads.filter((thread) => thread.replyAllowed).length);

  if (!threads.length) {
    threadList.innerHTML = `
      <div class="empty-list">
        <p class="eyebrow">No threads</p>
        <p>The workflow has not posted any accepted findings yet.</p>
      </div>
    `;
    return;
  }

  threadList.innerHTML = "";
  threads.forEach((thread, index) => {
    const state = replyState(thread);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `thread-card${thread.id === selectedThreadId ? " is-selected" : ""}`;
    button.style.animationDelay = `${index * 30}ms`;
    button.innerHTML = `
      <div class="thread-card-topline">
        <span class="severity-badge severity-${thread.finding.severity}">${severityLabel(thread.finding.severity)}</span>
        <span class="reply-state ${state.className}">${state.label}</span>
      </div>
      <h3>${thread.finding.message}</h3>
      <p>${thread.finding.file}:${thread.finding.line}</p>
      <p class="thread-status-detail">${state.detail}</p>
      <div class="thread-card-footer">
        <span>${thread.id}</span>
        <span>${formatDate(thread.lastMessageAt)}</span>
      </div>
    `;
    button.addEventListener("click", () => {
      void selectThread(thread.id);
    });
    threadList.append(button);
  });
}

function renderThreadPanel(thread) {
  const state = replyState(thread);
  const messagesHtml = thread.messages
    .map(
      (message) => `
        <article class="message-bubble ${message.author === "author" ? "message-author" : "message-bot"}">
          <div class="message-meta">
            <strong>${message.author === "author" ? "Author" : "Review Bot"}</strong>
            <span>${formatDate(message.createdAt)}</span>
          </div>
          <p>${message.body}</p>
        </article>
      `,
    )
    .join("");

  threadPanel.innerHTML = `
    <header class="thread-header">
      <div>
        <p class="eyebrow">Accepted finding</p>
        <h3>${thread.finding.message}</h3>
      </div>
      <div class="thread-header-meta">
        <span class="severity-badge severity-${thread.finding.severity}">${severityLabel(thread.finding.severity)}</span>
        <span class="reply-state ${state.className}">${state.label}</span>
      </div>
    </header>
    <div class="finding-card">
      <div class="finding-grid">
        <div>
          <span class="finding-label">Location</span>
          <strong>${thread.finding.file}:${thread.finding.line}</strong>
        </div>
        <div>
          <span class="finding-label">Thread ID</span>
          <strong>${thread.id}</strong>
        </div>
      </div>
      <div class="thread-status-banner ${state.className}">
        <span class="finding-label">Reply status</span>
        <strong>${state.label}</strong>
        <p>${state.detail}</p>
      </div>
      <div>
        <span class="finding-label">Evidence</span>
        <p>${thread.finding.evidence}</p>
      </div>
    </div>
    <section class="messages-column">${messagesHtml}</section>
    <form class="reply-form" id="reply-form">
      <label for="reply-input" class="finding-label">Author reply</label>
      <textarea
        id="reply-input"
        name="body"
        rows="4"
        placeholder="Reply once with intent, context, or follow-up."
        ${thread.replyAllowed ? "" : "disabled"}
      ></textarea>
      <div class="reply-actions">
        <span>${thread.replyAllowed ? "Reply slot is open." : "Reply slot is closed."}</span>
        <button type="submit" ${thread.replyAllowed ? "" : "disabled"}>Send reply</button>
      </div>
    </form>
  `;

  const replyForm = threadPanel.querySelector("#reply-form");
  if (!thread.replyAllowed || !replyForm) {
    return;
  }

  replyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(replyForm);
    const body = String(formData.get("body") || "").trim();
    if (!body) {
      return;
    }

    const button = replyForm.querySelector("button");
    button.disabled = true;

    try {
      await sendJson(`/api/chat/threads/${thread.id}/reply`, { body });
      await loadThreads(thread.id);
    } catch (error) {
      button.disabled = false;
      apiStatus.textContent = error.message;
    }
  });
}

async function selectThread(threadId) {
  selectedThreadId = threadId;
  renderThreadList();
  const thread = await fetchJson(`/api/chat/threads/${threadId}`);
  renderThreadPanel(thread);
}

async function loadThreads(preferredThreadId) {
  const data = await fetchJson("/api/chat/threads");
  threads = data.items;

  const nextSelection =
    preferredThreadId && threads.some((thread) => thread.id === preferredThreadId)
      ? preferredThreadId
      : selectedThreadId && threads.some((thread) => thread.id === selectedThreadId)
      ? selectedThreadId
      : threads[0]?.id;

  selectedThreadId = nextSelection || null;
  renderThreadList();

  if (selectedThreadId) {
    await selectThread(selectedThreadId);
  } else {
    threadPanel.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">Inbox empty</p>
        <h3>No accepted findings have been posted yet.</h3>
        <p>Use the workflow to create threads through the local API.</p>
      </div>
    `;
  }
}

async function boot() {
  try {
    const health = await fetchJson("/api/health");
    apiStatus.textContent = `${health.status} • ${new Date(health.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    await loadThreads();
  } catch (error) {
    apiStatus.textContent = "API unavailable";
    resultsCount.textContent = "Failed to load inbox";
    threadList.innerHTML = "";
    threadPanel.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">Connection error</p>
        <h3>Inbox unavailable.</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

boot();
