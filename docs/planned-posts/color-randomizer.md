---
title: Shuffling Colors
date: June 2026
---

I like [realtimecolors.com](https://www.realtimecolors.com/). It's fun to play around with different color combinations, to lock one color you like and watch the rest of the page reshuffle around it. When I happened to find a similar formula online, at **`<add where you found it here>`**, I wanted to wire it into my own site.

Five roles drive every color on the page: text, background, primary, secondary, and accent. To build a palette, you start from a single base hue, pick one of the classic color relationships for it (monochromatic, analogous, complementary, triadic, or tetradic), and then generate the other four colors by rotating their hue off that base and varying their lightness and saturation. Lock a color and it becomes the base everything else is built around. Leave everything unlocked and the base hue is picked at random.

The part I added is bounded randomization. A purely random palette is fun on a blank demo page, but it falls apart on a real site. Some of my themes are meant to be loud and some quiet, some only read well in light mode and others only in dark. So each theme sets its own limits, per role, on how light, dark, and saturated a random color is allowed to get, with separate limits for light and dark mode. The dice still roll, they just roll inside the bounds that keep each theme looking like itself. Any theme that doesn't set its own limits falls back to a sensible default.

You can find this in the themes menu, in the top right of the page. Play around with it. Lock a color and see how the others adapt around it. And definitely check out the original [realtimecolors.com](https://www.realtimecolors.com/), still the greatest out there.

<!-- TODO (Dawson): once the themes post is written, add a closing line linking it, e.g. "If you're interested in how I built the themes themselves, check out [this post](post.html?id=THEMES_POST_ID)." Left off the page for now since that post doesn't exist yet. -->
