---
publication: published
listingOrder: 0
title: { s: "Review the spec, not just the diff" }
date: October 2026
description: { l: "If we're working at the architectural level, the architectural level is what should be reviewed." }
tags: ["AI & ML", "Systems"]
---

Over the last few months my daily work has changed a lot. AI usage has caught on, and every dev on every team I talk to is on board, even the senior guys. This has, unfortunately, led to some cascading problems, and I think I have a good solution to them.

TL;DR: a code change's architecture is critiqued most heavily during the PR process, after it's been implemented. For large changes, I think we should be reviewing the spec before we build, not just the code after.

## PRs are massive now

It seems like the cost of production has fallen below the cost of coordination for much larger swaths of code changes. It is now much faster for me to architect and send agents to build an entire integrated subsystem, spanning multiple frontend, backend, and package repos, rather than coordinate with multiple specialized developers over the course of a few weeks.

This unfortunately means the PRs I make and have to review are absolutely enormous, with diffs regularly containing thousands of lines changed.

## Agents review the code, humans review the architecture

Since the dev who opened the PR doesn't understand the code at a line by line level, no other dev realistically is going to either. Therefore, the only way to reliably review for correctness, cleanliness, and codebase standards is with agents (tests and linters help too of course).

That means human review needs to look for different issues. PRs used to be about the lines of code themselves, the types, functions, handles, and API surfaces chosen. But now they're much more architectural. My team is much more interested in the design of the system, rather than the implementation details.

For large diffs, I've found that code review has mostly turned into an architecture discussion, and the issues found tend to be architectural rather than at the line level.

## There is value in review

I personally find these "architecture" reviews extremely valuable. I'm meeting with guys who have deep knowledge of parts of the stack I have never been exposed to before. And talking to them is a vastly, and I cannot stress this enough, VASTLY superior experience to talking to agents. There is something about talking to and learning from another human that the machines can't replicate yet.

## Why review the spec

### Architecture issues are cheaper to fix before they're built

If architectural issues are found during code review, implementation has already happened and tokens have already been spent. Issues are both more annoying and more expensive to fix. Why not critique beforehand?

### A spec is a reasonable diff

A diff with thousands of lines changed isn't something a person can meaningfully review. A spec for the same change is a few pages, which is something a reviewer can actually read in one sitting and push back on.

There's data on this from before LLMs. A SmartBear study of about 2,500 code reviews at Cisco found that reviewers' ability to find defects drops off once a review goes past 200–400 lines of code. The spec is the version of the change that's actually sized for a human.

### If someone else reads it, I'll read it

There is a pull to be sloppy with the spec. When I know nobody else is going to read it, it's easy to skim the agent's draft, let my eyes glaze over a little, and approve it. If I miss something, it gets multiplied into thousands of lines of code.

If I know the spec is going to be reviewed by another person, I'll pay more attention to making it clean, accurate, and readable, and I'm less likely to glaze over the slop. The same study saw this with code: authors who annotated and explained their changes before review had far fewer defects, presumably because it forced them to review their own work first.

It isn't productive when another dev meat proxies their agent's 6 page spec to me without looking at it first. A spec review would force the other dev to deeply understand, iterate on, and own what their agent is proposing, as they may have to explain it in their own words in a live meeting.

### It keeps the best parts of code review

Reviewing the spec also keeps the most important parts of the pre LLM code review process:

- To make sure the change is reasonable — a senior developer with more experience or a colleague with fresh eyes is a great source of drilling into what the right changes should be.
- To keep the team in sync with an ever changing codebase.
- To teach junior engineers about their craft — In the pre LLM days, I learned more from months of code review than in years of lectures and reading manuals and blogs. Now, our craft has moved a level up.

### Review the level we work at

Since I'm spending most of my time on architecture rather than implementation, reviewing the output of MY work means reviewing the spec rather than the code. It seems like the spec is the highest leverage point for review to occur at.

## Code review still has a place

For minor changes there would of course be no point in a spec review. And there is still a place for a post implementation review. During the build, agents may have surfaced tradeoffs and decisions that required attention, or run into blockers and pivoted to a different design. Ensuring the final architecture is correct can still be important.

If we're working at the architectural level, the architectural level is what should be reviewed.
