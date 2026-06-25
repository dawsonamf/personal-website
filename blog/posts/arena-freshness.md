---
title: Arena.ai Leaderboard Update Badges
date: May 2026
---

I am an [arena.ai](https://arena.ai)-aholic. I compulsively check the leaderboard to see how the model rankings have changed. More than any benchmark or eval, arena.ai has always roughly matched my sense of which models are the best at various tasks, consistently enough that I will trust it rather than do an endless number of pairwise tests myself every time a new model drops or gets updated.

A few weeks ago they updated their UI. I like the new UI. But I don't like that the last updated date was removed from the leaderboard overview page. A quick scan used to be sufficient to see which rankings had changed, but now I had to click into each leaderboard individually to see when it was last updated. So, I wrote a [Tampermonkey](https://www.tampermonkey.net/) script to surface that data on the overview page.

## The Problem

As of writing, the overview page at [arena.ai/leaderboard](https://arena.ai/leaderboard) shows 12 leaderboard cards: Agent, Text, WebDev, Vision, Document, Text-to-Image, Image Edit, Image-to-WebDev, Search, Text-to-Video, Image-to-Video, and Video Edit. Each card shows the top 10 models and a "View all" link. Clicking into any individual leaderboard reveals more details about it, including the date it was updated last. In order to surface that information on the main leaderboard I had to fetch the relevant date from each leaderboard's detail page and inject new UI components on the overview page. The concept is straightforward but the implementation had a few wrinkles.

Arena is built with Next.js using React Server Components, so when you fetch a page, you don't get nice HTML, you get an RSC payload; multiple megabytes of serialized JSON inside a `__next_f` script tag. The date we're looking for is buried somewhere in there, and can be matched with a regex. But doing this 12 times can take a non-trivial amount of time and leads to a noticeable delay.

## Fetching the Data Quickly

One optimization is to fetch the pages in parallel. But that still requires fetching upwards of 40MB of RSC payloads just to extract 12 short strings. So instead, we use a streaming fetch with an early abort. The date is metadata, and usually appears early in the response. So instead of using `await res.text()` we read the body as a stream:

```javascript
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
}
```

Each time a chunk comes in we append it to the running result and test the regex again. When we get a match, we call `reader.cancel()` and `ctrl.abort()` to end the connection. In practice, this always finds the date within the first few chunks. I tested the naive and optimized approaches 30 times each, and found a roughly 8x improvement. The optimized approach (parallel streaming with early abort) completed in a median of ~900ms, compared to ~7.7s for sequential full download appoach.

## Displaying the Data

The DOM on the overview page is generated with React hydration, meaning class names are hashed and unstable. Inspecting them using devtools and writing them into a script wouldn't work because they'd break the next time arena.ai was deployed. They're also not inspectable from the server response (it's RSC, not HTML). Instead we can work around this by relying on the persistent user-facing content to anchor the page structure and uniquely identify the places where we'll inject the data we scraped:

1. `<a>` elements whose `href` starts with `/leaderboard/`
2. Whose `textContent` includes "View all"

This is stable across deploys because it depends on the link structure and copy, not on generated class names.

The result is a customized version of arena.ai suited to my personal needs. If you're interested, the [script can be downloaded here](../../resources/arena-freshness.user.js).

## On the Open Web

While this is a small quality of life fix for an individual user on a relatively niche site, it speaks to something much bigger: the increasing value of openness. The web is the biggest platform where an end user can hook into an interface, decide what they'd like to change about it, and make exactly that change. They don't need to ask for permission from any business analyst, for the time of any developer, or for an App Store review. What happens on your browser belongs to you. You can just write a script and the browser runs it.

People have been customizing the web for as long as its existed. [Unhook](https://unhook.app/) lets you remove YouTube's Shorts and recommendations. Arc Browser's [Boosts](https://arc.net/boosts) let you inject custom CSS into any site. [uBlock Origin](https://ublockorigin.com/) gives you control over what content loads at all. Greasemonkey and Tampermonkey have been around for two decades. Each of these can exist because the web is built on open standards that anyone can read, modify, and extend. This lets people reshape the internet they see to fit their lives.

Closed ecosystems don't allow this. I can't modify an iOS app's UI, or restyle a desktop application's layout, or rearrange the controls on a smart TV's interface. Of course there are legitimate reasons for some applications to be closed; Sandboxing prevents malicious code from accessing private data or hijacking system resources. Platform owners can guarantee stability for critical systems, i.e. an app that controls the power grid, a stock exchange, or a pacemaker won't break because a user injected a script conflicts with an update.

But there is a cost: every closed application is one where users can't help themselves. Customization is economically efficient. I can write a script to block a distracting sidebar on a page my friend visits daily, or change the fonts and background colors to help someone with a rare form of color blindness read a site better. The site's developers would likely never make these changes because it's likely not worth their time for just a few users. If you multiply that across billions of websites being visited billions of times per day, there's some real value being left on the table.

While this is not a new insight, this is a new moment in time, because the barrier to writing these customizations is collapsing. The script I wrote used to require expertise in streaming fetch, AbortControllers, DOM traversal, MutationObservers, and the ReadableStream API. You used to need to be a web developer with a specific flavor of expertise to write it. But with a little help from an AI it's now accessible to anyone. As AI diffuses across society, the technical gate that kept this type of customization limited will quickly dissolve. This means the value of openness is compounding, and the platforms that build on open, inspectable foundations will be ones that enable some enormous value creation during the next phase of society.
