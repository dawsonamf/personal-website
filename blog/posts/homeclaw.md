---
title: "Homeclaw: Giving AI Clients a Way Back Into Your Machine"
date: March 2026
tags: [AI & ML, Systems]
---

I kept running into the same problem. I'd be working in Cursor or Claude, and I'd want the AI to run something on a different machine, or access skills I'd written that lived somewhere else. MCP is supposed to solve this, but every MCP server I found was either local-only or required me to set up port forwarding, configure DNS, mess with firewalls. I didn't want to do any of that.

So I built homeclaw. It's a remote MCP server that runs on your machine and tunnels out through Cloudflare. You start it, it prints a config block, you paste that into your AI client, and now that client can run shell commands and read your skill files from anywhere. No network configuration.

## How it works

The whole thing is about 400 lines of TypeScript running on Bun. When you start it, a few things happen in sequence:

1. It loads a bearer token from `~/.homeclaw/token` (you generate this yourself with openssl)
2. It starts an HTTP server on localhost
3. It opens a Cloudflare Quick Tunnel, which gives you a random HTTPS URL that routes back to your machine
4. It prints the MCP client config to your terminal so you can copy-paste it

The server exposes three tools over MCP's Streamable HTTP transport: one to list your skill files, one to read a skill's frontmatter, and one to run shell commands. That's it. Each incoming request gets a fresh MCP server instance, so there's no session state to worry about.

## The auth situation

The bearer token is the real security boundary. Treat it like an SSH key. Anyone who has it can run commands on your machine.

I also had to implement OAuth 2.0 because some MCP clients (connectors, specifically) won't connect without it. The OAuth flow auto-approves everything, which sounds alarming until you think about it for a second. This is a personal server. There's one user. The bearer token already gates access. The OAuth layer exists purely so clients that require OAuth can actually connect.

The OAuth credentials get auto-generated on first launch and stored in `~/.homeclaw/`. You can also hardcode them in a config file if you want them to stay stable across restarts.

## Building it

I wanted the codebase to be boring in a good way. Each source file does one thing. `auth.ts` handles tokens. `oauth.ts` handles OAuth flows. `permissions.ts` does glob matching for command allow/deny rules. `shell.ts` spawns processes. `tunnel.ts` manages the Cloudflare tunnel lifecycle. `http.ts` routes requests. No dependency injection frameworks, no class hierarchies, just functions that take arguments and return values.

The one design decision I keep coming back to is making the server stateless. Every request creates a new `McpServer` instance. This means there's no session cleanup, no stale state, no memory leaks from long-lived connections. It's wasteful in theory but the overhead is negligible and it removes an entire category of bugs.

I wrote the whole thing against Bun because I wanted native TypeScript execution without a build step. `bun run src/index.ts` and you're going. The test suite covers permissions, auth, OAuth flows, skill discovery, shell execution, and full HTTP integration, all running through `bun test`.

## Command permissions

By default, homeclaw lets the AI run anything. If that makes you nervous (fair), you can drop a `config.json` next to it with glob-based allow/deny rules:

```json
{
  "commands": {
    "*": "deny",
    "ls *": "allow",
    "git *": "allow",
    "cat *": "allow"
  }
}
```

Last matching rule wins, so you put the catch-all deny first and specific allows after. It's not a sandbox. Someone determined could probably work around it. But it's enough to keep an overeager AI from running `rm -rf /` by accident.

## What I'd do differently

Honestly, not much. The scope is small on purpose. It does three things and I want it to keep doing three things. If I were starting over I might skip the OAuth implementation and just tell people to use bearer tokens, but enough MCP clients require OAuth that it would have been a constant support issue.

The Cloudflare tunnel dependency is the part I like least. It works well, but it means you need an internet connection even if you're tunneling to a machine on your own network. A local mode exists (set `TUNNEL=false`) for that case, but then you're back to configuring your own network.

## Using it

```bash
curl -fsSL https://bun.sh/install | bash
mkdir -p ~/.homeclaw && openssl rand -base64 32 > ~/.homeclaw/token
bunx homeclaw
```

Three commands. It prints the config. You paste it into Cursor, Claude, whatever. Done. Or, just point your agent at the [repo](https://github.com/dawsonamf/homeclaw) and let it figure out the setup for you.

[github.com/dawsonamf/homeclaw](https://github.com/dawsonamf/homeclaw)
