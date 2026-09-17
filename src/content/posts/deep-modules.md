---
publication: published
listingOrder: 3
title: { s: "Deep modules" }
date: June 2026
description: { l: "How to trust large amounts of LLM generated code and merge lots of PRs very quickly without accumulating cognitive debt or causing codebase entropy." }
tags: ["AI & ML", "Systems"]
---

I deeply value writing good code. I like thinking through the types I’m adding, how to make things more generic, and using the language I’m working with as intended to keep the code minimal and elegant. With few exceptions, if I spend enough time on a feature, the code that I write is better than what the latest frontier models can produce. This is both my opinion and that of Fable reviews of past diffs I’ve saved. This, I think, is not that surprising. Nearly all of the senior developers I’ve talked to about this topic agree, and [studies](https://arxiv.org/abs/2603.24755v2) back it up. LLM generated code is generally overly verbose and inelegant, and it increases the entropy of codebases over time.

This leads to a few problems:

1. Distrusting code quality — If I read through and really understand an LLM produced diff, I will find very real code quality issues. Architecture optimizations, useless lines of code, unnecessary types, the list goes on and on. And this isn’t even mentioning the mountains of unnecessary comments. This makes me distrust LLM output in general, especially for large features, refactors, and important pieces of the codebase.
2. An ever degrading codebase — LLMs can output enormous amounts of code very fast. I can’t review a 10k line PR every day and hope to understand what the change is doing, and therefore must either avoid merging the PR or accept a codebase of ever degrading quality. This is nothing new. We’ve all been experiencing this pressure to merge features with implementations we don’t understand, from PMs and POs who don’t care about tech debt.
3. Cognitive debt — this is a relatively new term for a new phenomenon: not understanding what is going on in the codebase you own. If you merge too many PRs you don’t fully understand, you start to lose track of the way your system actually works under the hood. This means that when you make future decisions or review future PRs, your lack of understanding forces you to lean on an LLM even more. You can’t properly review changes to a system you don’t understand. And since you know the LLM’s changes are inelegant, you find yourself unable to critique slop that you know is there, and the enshittification of the codebase picks up pace with each subsequent feature.

And yet, I want to move fast. I want my personal projects to progress quickly, and my tickets to move from left to right. I want to do this while keeping tech debt low and still understanding what is happening in the codebase. I want to have my LLM soup and eat it too.

## The solution

Instead of letting unreviewed slop spread throughout the codebase, what if we contained it? What if we used the old software engineering practice of deep modules to leverage human attention to focus only on the sections of the codebase that matter?

Concretely, what I mean is this: For a brand new feature, have the model expose the functionality in a standalone module/package, with a deterministic, compile time checked API surface boundary. Instead of reviewing the entire diff, I review only the API surface of that package, and as long as the surface of the package works as intended, I don’t need to care about the implementation details. The LLM writes tests to ensure the package functions as intended, both at the module boundary (along the “seam” as Ousterhout would say) and as unit tests inside the module.

Developers do this all the time already, and have since long before AI. We import code we haven’t reviewed, and our understanding extends only to the API surface the package exposes: the types, handles, functions, streams, etc. Even if the code inside is a mess, if the only thing I ever need to see is the package surface, then I don’t have to care.

This lets me build a system component by component. I understand what each component does even if I don’t understand how it does it, and I understand how everything is wired together.

This approach is also very dynamic and lets me scale my review “level” to the reliability of the models. A year ago models could only reliably produce simple packages. I had to review each individual subcomponent of a system and carefully wire it together. Now the models can produce systems that are much more complex. Instead of reviewing the API surface of the subcomponents, I can focus on the API surface of the larger system with the subcomponents abstracted away. As models continue to improve, this approach will scale with them.
