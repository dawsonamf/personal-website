// ==UserScript==
// @name         Arena.ai – Leaderboard Freshness Badges
// @namespace    https://dawsonamf.com
// @version      2.0.0
// @description  Shows how recently each leaderboard was updated on the Arena overview page
// @author       Dawson Metzger-Fleetwood
// @match        https://arena.ai/leaderboard
// @match        https://arena.ai/leaderboard/
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

/**
 * Arena.ai doesn't surface "last updated" dates on its leaderboard overview.
 * Each sub-page (Text, Agent, Vision, etc.) has one, but you'd have to click
 * into all 12 to see them.
 *
 * This script fetches every sub-page in parallel on page load, extracts the
 * date from each response stream (aborting the download the moment it finds
 * a match to avoid pulling multi-MB RSC payloads), and injects an inline
 * "Updated N days ago" badge next to each leaderboard title.
 *
 * No class-name selectors — cards are identified by href pattern + "View all"
 * text, so it survives redesigns that don't change the link structure.
 */

(function () {
  "use strict";

  // ── Config ────────────────────────────────────────────────────────

  const LEADERBOARDS = [
    "/leaderboard/agent",
    "/leaderboard/text",
    "/leaderboard/code/webdev",
    "/leaderboard/vision",
    "/leaderboard/document",
    "/leaderboard/text-to-image",
    "/leaderboard/image-edit",
    "/leaderboard/code/image-to-webdev",
    "/leaderboard/search",
    "/leaderboard/text-to-video",
    "/leaderboard/image-to-video",
    "/leaderboard/video-edit",
  ];

  const BADGE_ATTR = "data-arena-freshness";
  const DATE_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/;
  const DOM_POLL_MS = 200;
  const DOM_POLL_MAX = 60;

  const STREAM_BUFFER_LIMIT = 50_000;
  const STREAM_TAIL_KEEP = 200;

  const BADGE_STYLE = {
    display: "inline-block",
    fontSize: "12px",
    fontFamily: "ui-sans-serif, -apple-system, system-ui, sans-serif",
    fontWeight: "400",
    letterSpacing: "0.01em",
    padding: "2px 10px",
    borderRadius: "4px",
    background: "rgba(128, 128, 128, 0.18)",
    color: "inherit",
    marginLeft: "8px",
    verticalAlign: "middle",
    lineHeight: "1.6",
  };

  // ── Date helpers ──────────────────────────────────────────────────

  function formatRelative(dateStr) {
    const then = new Date(dateStr);
    const now = new Date();
    then.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const days = Math.round((now - then) / 86_400_000);
    if (days === 0) return "Updated today";
    if (days === 1) return "Updated yesterday";
    return `Updated ${days}d ago`;
  }

  // ── Streaming fetch ───────────────────────────────────────────────

  async function extractDate(path) {
    const ctrl = new AbortController();
    try {
      const res = await fetch(path, { signal: ctrl.signal });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });

        const match = buf.match(DATE_RE);
        if (match) {
          reader.cancel();
          ctrl.abort();
          return match[0];
        }

        if (buf.length > STREAM_BUFFER_LIMIT) {
          buf = buf.slice(-STREAM_TAIL_KEEP);
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.warn(`[arena-freshness] failed: ${path}`, e);
      }
    }
    return null;
  }

  function fetchAllDates() {
    return Promise.all(
      LEADERBOARDS.map((p) => extractDate(p).then((d) => [p, d]))
    ).then((entries) =>
      Object.fromEntries(entries.filter(([, d]) => d !== null))
    );
  }

  // ── DOM injection ─────────────────────────────────────────────────

  function createBadge(label) {
    const el = document.createElement("span");
    el.textContent = label;
    el.setAttribute(BADGE_ATTR, "");
    Object.assign(el.style, BADGE_STYLE);
    return el;
  }

  function injectBadges(dates) {
    const seen = new Set();
    let count = 0;

    for (const anchor of document.querySelectorAll("a[href]")) {
      if (anchor.querySelector(`[${BADGE_ATTR}]`)) continue;

      const path = (anchor.getAttribute("href") || "").replace(/^https?:\/\/[^/]+/, "");
      if (!path.startsWith("/leaderboard/") || path === "/leaderboard/") continue;
      if (!anchor.textContent.includes("View all")) continue;
      if (seen.has(path)) continue;
      seen.add(path);

      const dateStr = dates[path];
      if (!dateStr) continue;

      const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim()) {
          walker.currentNode.parentElement.appendChild(
            createBadge(formatRelative(dateStr))
          );
          count++;
          break;
        }
      }
    }

    if (count) console.log(`[arena-freshness] ${count} badges injected`);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  function whenCardsReady() {
    return new Promise((resolve) => {
      let n = 0;
      const id = setInterval(() => {
        n++;
        const ready = [...document.querySelectorAll('a[href*="/leaderboard/"]')]
          .some((a) => a.textContent.includes("View all"));
        if (ready || n >= DOM_POLL_MAX) {
          clearInterval(id);
          resolve(ready);
        }
      }, DOM_POLL_MS);
    });
  }

  const datesReady = fetchAllDates();

  Promise.all([datesReady, whenCardsReady()]).then(([dates, domOk]) => {
    if (domOk && Object.keys(dates).length) injectBadges(dates);
  });

  let currentPath = location.pathname;
  new MutationObserver(() => {
    if (location.pathname === currentPath) return;
    currentPath = location.pathname;

    if (currentPath === "/leaderboard" || currentPath === "/leaderboard/") {
      fetchAllDates().then((dates) => setTimeout(() => injectBadges(dates), 800));
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
