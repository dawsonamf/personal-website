---
title: AI and the Job Market
date: July 2026
scripts: [https://cdn.plot.ly/plotly-2.27.0.min.js, assets/job-market-chart.js, assets/cohorts-chart.js]
styles: [assets/job-market-chart.css, assets/cohorts-chart.css]
---

In 1865, Britain was worried about running out of coal. The entire industrial economy ran on the stuff, the reserves were finite, and the comforting assumption was that efficiency would buy time: James Watt's engine burned far less coal per unit of work than the engines it replaced, so as engines improved, consumption should fall. A young economist named William Stanley Jevons wrote a whole book, [The Coal Question](https://en.wikipedia.org/wiki/The_Coal_Question), arguing the assumption was backwards. Efficient engines made coal-powered work cheaper, cheaper work found buyers everywhere, and Britain burned more coal than ever. In his words: "It is wholly a confusion of ideas to suppose that the economical use of fuel is equivalent to a diminished consumption. The very contrary is the truth."

This became known as the Jevons paradox, and it's now the standard optimist argument for what AI does to software engineers: AI collapses the cost of writing software, the world responds by consuming far more software, and demand for the people who make it goes up rather than down. Tech CEOs invoke it constantly (Satya Nadella tweeted it during the DeepSeek panic in January 2025, though he was talking about demand for compute, not demand for engineers). I wanted it to be true. Meanwhile, every chart I saw about new grads in tech looked like a cliff, which reads like evidence that AI is already eating the entry level. I spent weeks unsure whether those two things contradict each other, and this post is me working through it. I knew zero labor economics when I started, so every term gets defined as it appears. The target audience is me, a few weeks ago.

## Hot Water

My favorite version of the paradox is hot water. For most of history, hot water meant a fire, a pot, and patience, and a bath was a weekly event. Then water heaters made the marginal gallon close to free. If people had kept their habits, heaters would have saved an enormous amount of energy: same weekly bath, a fraction of the fuel. Nobody kept their habits. We started showering daily, and for longer, and then bought machines that wash our dishes and clothes in hot water too. Total energy spent heating water went up. The coal story again, running in your bathroom.

Run the clock forward, though, and the same good tells the opposite story. Water heaters grew for decades and then stopped growing, because demand ran out before the engineering did. There is a shower length you like, and a better heater does not make you want a longer one. Once everyone who wants a daily hot shower has a daily hot shower, further efficiency stops producing more hot water and starts producing smaller bills.

Economists have a word for the difference between those two eras: elasticity, meaning how much more of something people buy when it gets cheaper. Early hot water was wildly elastic (halve the cost, people use far more than double). Modern hot water is inelastic (halve the cost, people take the same shower). Textbooks treat elasticity as a property of a good, but the hot water story makes it look more like a position: every good slides along a curve that runs from starving to satisfied, and elasticity is wherever you currently sit on it. I've been calling it a satiation curve. Hot water traversed the whole thing in under a century. Lighting rode the same curve on a longer runway: candles to kerosene to gas to electric bulbs, with consumption of light exploding at every step for two hundred years. Then LEDs arrived, roughly ten times more efficient, and nobody lit their living room ten times brighter. Demand had saturated, so the efficiency gain finally did the thing the 1865 pessimists expected all along: it lowered the bill.

That reframe is the load-bearing piece of this post. The Jevons paradox is a condition, not a law. Efficiency multiplies consumption only on the steep part of the curve, where appetite still outruns supply, and every good eventually leaves the steep part. Coal in 1865 was on it. Hot water in 1930 was on it. Hot water in 2026 is not.

## From Coal to Code

AI is doing to software what the water heater did to hot water. "A unit of software" is a mushy concept, but concretely: a shipped feature, a fixed bug, an internal dashboard, a one-off automation script. All of them cost far less to produce than they did three years ago, whatever you think of quality at the frontier. So the optimist case hangs on one question: where does software sit on the satiation curve?

The steep-part case writes itself. Most of the economy still coordinates through email and spreadsheets. Every company has a backlog of internal tools nobody built because they cost a developer-month. There's a long tail of dentist offices and school districts and two-person nonprofits that could never afford custom software at $200k per engineer-year but can afford it at whatever the AI-assisted price settles at. Under this reading, cheap code unlocks demand that was always latent, and developers are the coal miners of 1870, busier than ever.

The saturation case says tech is fooling itself the way tech always does. Software budgets are set by the value software produces, not by the cost of producing it. The highest-value veins got mined during the decade of free money, and a company that already runs on software does not want ten times more software because it got ten times cheaper. Under this reading, AI efficiency is arriving late on the curve, like LEDs, and will mostly show up as smaller engineering budgets.

I don't think anyone can settle this from an armchair. It's an empirical question, and there's data. The chart below is live from Indeed's postings tracker: software development postings versus all US postings, indexed to just before the pandemic. It's interactive, and the toggles matter. The AI release markers are already on; add the "Interest Rate" overlay when you want to check my claims.

<div class="jm-toolbar" data-chart="jobs">
  <div class="jm-tabs jm-modes" role="group" aria-label="View mode">
    <button type="button" class="jm-mode is-active" data-mode="index">Index</button>
    <button type="button" class="jm-mode" data-mode="pct">% Change</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-tabs jm-ranges" role="group" aria-label="Time range">
    <button type="button" class="jm-range" data-months="3">3M</button>
    <button type="button" class="jm-range" data-months="6">6M</button>
    <button type="button" class="jm-range" data-months="12">1Y</button>
    <button type="button" class="jm-range" data-months="60">5Y</button>
    <button type="button" class="jm-range is-active" data-months="all">All</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-series" role="group" aria-label="Series">
    <label class="jm-check" data-series="swe"><input type="checkbox" checked> Software Development</label>
    <label class="jm-check" data-series="all"><input type="checkbox" checked> All Jobs</label>
    <label class="jm-check" data-flag="events"><input type="checkbox" checked> AI Releases</label>
    <label class="jm-check" data-flag="rate"><input type="checkbox"> Interest Rate</label>
  </div>
</div>
<div id="job-market-chart"></div>
<div class="jm-bottom-row">
  <p class="jm-caption">US job postings on Indeed, indexed to Feb 1, 2020 = 100. Live from the <a href="https://github.com/hiring-lab/job_postings_tracker" class="text-link" target="_blank" rel="noopener noreferrer">Indeed Hiring Lab</a> tracker. The dashed overlay is the 10-year real interest rate (TIPS yield, right axis), monthly from <a href="https://fred.stlouisfed.org/series/DFII10" class="text-link" target="_blank" rel="noopener noreferrer">FRED</a>. In % Change view each series is measured from the start of the current window, so the dotted line marks that starting level (in Index view it marks the pre-pandemic baseline). Drag the slider below the chart for a custom range.</p>
  <div id="jm-stat" aria-live="polite"></div>
</div>

At the trough, software development postings sat 36% below their pre-pandemic baseline while overall postings ended up roughly where they started. Most of the scary articles about AI eating programming jobs were, at bottom, this picture: the most AI-exposed job category taking the biggest hit while the rest of the labor market shrugged. It looks exactly like displacement.

## The Timing Problem

Except look at when it starts against the release markers. Software postings peaked in early 2022 and were already falling hard when ChatGPT launched on November 30, 2022. Indeed's own economist, Brendon Bernard, [points out](https://www.hiringlab.org/2025/07/30/the-us-tech-hiring-freeze-continues/) that nearly half of the net decline in tech postings happened before ChatGPT was public at all. Whatever started the crash, it wasn't a chatbot that didn't exist yet.

Now toggle the interest rate overlay. That line is the 10-year real rate, meaning the interest rate after subtracting expected inflation, which is roughly the price of funding a business that loses money now to make money later. In other words, the price of funding tech. It bottomed near negative 1.1% in late 2021 (investors were paying for the privilege of lending) and began climbing months before the Fed's first hike in March 2022, and software postings rolled over right as it did. The mechanism is boring and powerful. Most software projects are bets on future revenue: at a negative real rate you fund every moonshot and hire new grads to staff them, and at positive 2% you cancel the moonshots. The first thing a hiring freeze freezes is new hiring.

There's also a tax subplot almost nobody talks about. Section 174, a leftover from the 2017 tax law, kicked in during 2022 and forced companies to spread deductions for R&D salaries (which is what a software engineer is, for tax purposes) over five years instead of deducting them immediately. Overnight, employing an American engineer got meaningfully more expensive, with exact 2022 timing, for reasons that have nothing to do with AI or the Fed. Congress quietly restored the old treatment in mid-2025.

The boring story covers the aggregate crash embarrassingly well. Indeed's chief economist calls the whole arc ["the slow, cyclical unwinding of an unprecedented boom"](https://www.hiringlab.org/2026/04/13/how-the-labor-market-is-emerging-from-the-long-shadow-of-the-pandemic/): pandemic over-hiring, then the bill. LinkedIn's economics team went further and titled a section of their [software engineering report](https://economicgraph.linkedin.com/content/dam/me/economicgraph/en-us/PDF/us-software-engineer-talent-landscape-2026.pdf) "Sluggish hiring is not AI's fault," finding that changes in real interest rates account for most of the variation in software engineer hiring over the past decade. Zoom out past tech and the AI signal gets even weaker. Yale's Budget Lab has been [tracking](https://budgetlab.yale.edu/research/tracking-impact-ai-labor-market) occupational mix and unemployment by AI exposure since ChatGPT launched and finds everything within historical norms, with the honest caveat that their method would "detect the house burning down but might miss a small fire." A [Federal Reserve note](https://www.federalreserve.gov/econres/notes/feds-notes/ai-adoption-and-firms-job-posting-behavior-20260327.html) from March 2026 found that firms adopting AI heavily are not posting fewer jobs than firms that aren't. And some share of the "AI layoffs" you read about is narrative laundering. Even Sam Altman says companies blame AI "whether or not it really is about AI," because AI sounds visionary and "we over-hired at negative real rates" sounds like an apology.

If the post ended here, the conclusion would be relaxing: a rate crash wearing an AI costume. The relaxing conclusion survives until you split the data by age.

## Horses

First, the piece of theory I was missing, the one that finally made the data make sense to me. The Jevons paradox is a claim about the output. Jobs are an input. Demand for software and demand for software engineers are different curves, and the bridge between them is a question the paradox never touches: does the technology make the human more productive, or does it do the human's job? Economists say the technology either complements you or substitutes for you, and that distinction carries the whole rest of this post.

Horses are the canonical warning. Engines made horsepower absurdly cheap, and demand for power exploded, so Jevons held perfectly for the output. The horses did not participate in the boom. The United States had about 26 million of them around 1915, and by 1960 roughly 90% were gone, because horses were the input being substituted. Wassily Leontief, a Nobel-winning economist, made the analogy explicit in 1983: what engines did to horses, computers could do to humans. Booming, elastic demand for software pays software engineers only if engineers remain how software gets made.

And "engineers" turns out to be the wrong resolution to ask the question at. The picture in the data right now is that AI substitutes for the tasks juniors are hired to do (well-specified tickets, boilerplate, the first draft of everything) while complementing the tasks seniors do (deciding what to build, reviewing what got built, owning what breaks). Anthropic's own [usage data](https://www.anthropic.com/research/economic-index-march-2026-report) points the same direction: AI usage in computer and math occupations splits roughly half augmentation, half automation, but Claude Code, the agentic tool, runs closer to 80% automation. If that's what's happening, both stories run at once. The profession rides the Jevons curve while the entry rung rides the horse curve.

## The Entry Rung

Two charts, broad then narrow. First, unemployment for recent college graduates, all majors, from the NY Fed:

<div class="jm-toolbar" data-chart="cu">
  <div class="jm-tabs jm-ranges" role="group" aria-label="Time range">
    <button type="button" class="jm-range" data-months="12">1Y</button>
    <button type="button" class="jm-range" data-months="60">5Y</button>
    <button type="button" class="jm-range is-active" data-months="120">10Y</button>
    <button type="button" class="jm-range" data-months="all">All</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-series" role="group" aria-label="Cohorts">
    <label class="jm-check" data-series="grads"><input type="checkbox" checked> Recent graduates</label>
    <label class="jm-check" data-series="workers"><input type="checkbox" checked> All workers</label>
    <label class="jm-check" data-series="young"><input type="checkbox" checked> Young workers (22-27)</label>
    <label class="jm-check" data-series="college"><input type="checkbox" checked> College graduates</label>
    <label class="jm-check" data-flag="events"><input type="checkbox"> AI Releases</label>
    <label class="jm-check" data-flag="rate"><input type="checkbox"> Interest Rate</label>
  </div>
</div>
<div id="cohort-unemp-chart" class="cc-chart"></div>
<div class="jm-bottom-row cc-bottom-row">
  <p class="jm-caption">US unemployment rate by group, monthly since 1990. Recent graduates are ages 22-27 with a bachelor's degree or higher; young workers are all 22-27-year-olds. Snapshot of the <a href="https://www.newyorkfed.org/research/college-labor-market" class="text-link" target="_blank" rel="noopener noreferrer">NY Fed college labor market</a> data. The dashed overlay is the 10-year real interest rate (right axis, from 2003). Toggle cohorts to compare; drag the slider below the chart for a custom range.</p>
  <div id="cu-stat" class="cc-stat" aria-live="polite"></div>
</div>

For most of this series' history, a degree bought insurance: recent grads ran well below the overall workforce. That insurance has inverted. As of March 2026, recent grads sit at 5.6% unemployment against 4.2% for all workers, young workers overall are at 7.2%, and 41.5% of employed recent grads are underemployed, working jobs that don't require their degree. The line I want to show you here, recent CS grads specifically, does not exist as a monthly series anywhere. The closest thing is an annual snapshot in the same NY Fed data putting CS-major unemployment at 6.99% and computer engineering at 7.78%, both above the all-major average. One number a year, but a brutal one, and an inversion of everything high schoolers were told for fifteen years.

Second, the narrow chart, the one that hooked me originally: software developers specifically, split by age, from Stanford's [Canaries in the Coal Mine](https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/) project. This is ADP payroll data, actual paychecks rather than surveys or postings:

<div class="jm-toolbar" data-chart="cs">
  <div class="jm-tabs jm-modes" role="group" aria-label="View mode">
    <button type="button" class="jm-mode is-active" data-mode="index">Index</button>
    <button type="button" class="jm-mode" data-mode="pct">% Change</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-tabs jm-ranges" role="group" aria-label="Time range">
    <button type="button" class="jm-range" data-months="12">1Y</button>
    <button type="button" class="jm-range" data-months="36">3Y</button>
    <button type="button" class="jm-range is-active" data-months="all">All</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-series" role="group" aria-label="Age buckets">
    <label class="jm-check" data-series="g2225"><input type="checkbox" checked> 22-25</label>
    <label class="jm-check" data-series="g2630"><input type="checkbox"> 26-30</label>
    <label class="jm-check" data-series="g3134"><input type="checkbox"> 31-34</label>
    <label class="jm-check" data-series="g3540"><input type="checkbox"> 35-40</label>
    <label class="jm-check" data-series="g4149"><input type="checkbox" checked> 41-49</label>
    <label class="jm-check" data-series="g50"><input type="checkbox"> 50+</label>
    <label class="jm-check" data-flag="events"><input type="checkbox" checked> AI Releases</label>
    <label class="jm-check" data-flag="rate"><input type="checkbox"> Interest Rate</label>
  </div>
</div>
<div id="cohort-swe-chart" class="cc-chart"></div>
<div class="jm-bottom-row cc-bottom-row">
  <p class="jm-caption">US software developer employment by age, indexed to Nov 2022 = 100 (the month ChatGPT launched). ADP payroll data via Stanford's <a href="https://digitaleconomy.stanford.edu/project/indicators/canaries-dashboard/" class="text-link" target="_blank" rel="noopener noreferrer">Canaries in the Coal Mine</a> project. Age buckets, not education: "22-25" is the closest available proxy for recent-grad software developers. The dashed overlay is the 10-year real interest rate (right axis). Toggle buckets to compare cohorts.</p>
  <div id="cs-stat" class="cc-stat" aria-live="polite"></div>
</div>

The two default lines say it. Since November 2022, the month ChatGPT launched, employment of 22-to-25-year-old software developers has fallen 21%. Developers 41-49 are dead flat. Toggle the other buckets on: 50+ is up 9%, and everything from 26 through 49 sits within a couple points of flat for the entire series, a quiet horizontal band that the youngest cohort falls away from. The Stanford authors call this pattern "seniority-biased technological change," find it concentrated in exactly the occupations where AI usage looks like automation rather than augmentation, and find firms adjusting through headcount, not wages. Junior pay isn't being cut; junior hiring just isn't happening. Their estimate also strengthened between drafts, a 13% relative decline for young workers in exposed occupations in August 2025 becoming 16% by November, which is the opposite of what you'd expect from a fluke as data accumulates.

This chart is why I never fully bought the pure rates story, and it's half the reason this post exists. Rates and Section 174 explain a freeze, but a freeze should land broadly. The split by age needs something more, and unlike the postings crash, this divergence opens after ChatGPT.

The composition story is contested too, though, and the disagreement splits by dataset in a way I find almost funny. Revelio Labs (profile data) [finds](https://www.reveliolabs.com/news/macro/is-ai-responsible-for-the-rise-in-entry-level-unemployment/) that a 10-point increase in AI exposure predicts an 11% drop in entry-level demand, and then, using Ramp's corporate spend data, that the heaviest AI adopters [grew headcount](https://www.reveliolabs.com/news/ai-and-work/greater-ai-investment-more-hiring/) 10.2%. Handshake (campus recruiting) [finds](https://joinhandshake.com/network-trends/class-of-2026-outlook/) AI-exposed entry-level roles are not declining faster than unexposed ones. Lightcast [finds](https://lightcast.io/resources/research/beyond-the-buzz-developing-the-ai-skills-employers-actually-need) AI-skill demand exploding, with a 28% wage premium attached. LinkedIn finds no hiring differences by AI exposure at all, and counts 1.3 million new AI jobs created since 2023. Same economy, four datasets, four answers. That mess is what sent me looking for a test with more teeth.

## The Escalation Test

The test I trust most is dose-response. If AI capability is what's removing young developers, the damage should track the capability. Each leap (ChatGPT, GPT-4, reasoning models, agentic coding tools) extends what AI can do reliably from intern-shaped tasks toward mid-level-shaped tasks, so each leap should march the displacement up the age ladder: 22-25 rolls over first, then 26-30 catches it, then 31-34. Capability-driven displacement should look like a frontier climbing rungs.

The data shows no ladder. The 26-30 bucket sits between 100 and 102 through May 2026, three and a half years and several model generations after ChatGPT, and every older bucket does the same. The gap in that chart is one line separating from a flat pack, a frontier that has not moved a single rung. And no individual model release puts a visible kink in any series in this post. The markers are right there; check for yourself. GPT-4 was supposedly the moment programming changed forever, and every line sails through it without noticing.

Two claims get conflated in this debate, and I want to separate them carefully, because one is solid and one hands your opponent a gotcha. "The decline started before ChatGPT" is true of the postings crash and only of the postings crash; that hinge is early 2022 and rates-shaped. The cohort divergence, the AI-shaped residual, starts after ChatGPT and grows from there. The cleanest statement I can defend is this: the aggregate crash is cyclical, the youngest-cohort split is the only AI-shaped thing in the data, and even it has not escalated up the experience ladder in three years of the fastest capability progress in the technology's history.

There is a fair objection to my test. Model releases are not treatment dates: companies adopt over quarters, procurement and compliance smear any capability jump into a smooth ramp, so smooth divergence is what adoption would produce even if AI were the cause. I accept that for the absence of kinks. I accept it much less for the ladder, because three-plus years of diffusing tools that now allegedly do mid-level engineering should have produced at least a wobble in the 26-30 line, and it has produced nothing.

That makes this a rare internet argument with a scoreboard. If the 26-30 bucket rolls over in the next few vintages of this data, the AI displacement story gets much stronger and I'll say so. If instead the 22-25 line recovers as rates come down, the cyclical story wins, and the scariest chart of 2025 was a macro story all along. I'll keep the snapshots here fresh as new vintages drop, so you can score me on it.

## New Tasks

One thing should nag you about the horse analogy: it has never once worked as a prediction for humans. Two hundred years of automation scares, from the power loom through Leontief's own 1983 essay, and the economy absorbed the displaced workers every time. The reason is a capability horses didn't have. A horse sells exactly one product, muscle, and when engines took that market there was no second product. Humans reallocate. Automation destroys tasks and simultaneously creates categories of work that did not previously exist, and historically the creation has dwarfed the destruction; David Autor's research group estimates that most of today's employment is in occupations that didn't exist in 1940. Economists call the job-creating half the reinstatement effect, and it is the escape hatch every generation of displaced workers has climbed through. The technology took your tasks, but it was narrow, so it could not follow you to the new ones. The weaver's grandchild fixed looms. The loom could not.

The genuinely new thing about AI, stated as precisely as I can: it is the first automation technology general enough to plausibly learn the new tasks too. If the system that displaced you can also learn the category you were going to escape into, the hatch closes, and Leontief stops being wrong. If it can't, this is the power loom again with better marketing. I don't believe anyone currently knows which of those we're living through, and I distrust anyone who claims to.

You can watch the race live, though, because the new tasks show up in the same postings data. The share of US job postings mentioning AI hit about 4.2% in December 2025, 134% above its pre-pandemic level. Lightcast counted 55 postings for generative AI roles in January 2021 and about 10,000 by May 2025, with half of AI-skill demand now sitting outside IT departments. LinkedIn measures hiring into AI Engineer roles at 14 times its 2019 share. And inside tech, the re-sorting is stark: the generic Software Engineer title is down 49% from pre-pandemic while Machine Learning Engineer is up 59% (median posted salary around $260,000), the specialized legacy titles (Android, Java, .NET, iOS) are all down more than 60%, and only 28 of 149 tech titles sit above their pre-pandemic level. The industry is shrinking its old shape while growing a new one. New tasks are arriving on schedule. Whether models learn them faster than people can retrain into them is the open question, and nothing in this post's data can answer it.

## The Recovery

Meanwhile, the first chart has started doing something the 2025 discourse did not predict: recovering. Indeed's July 2026 analysis carries the title ["AI and Job Postings: From Destruction to Creation?"](https://www.hiringlab.org/2026/07/08/ai-and-job-postings-from-destruction-to-creation/) and the question mark is doing honest work, but the numbers under it surprised me. Software development postings have climbed from 36% below baseline to 27.5% below. They're up 14.8% since Claude Code launched in late February 2025, over a period in which overall US postings fell 7%. The category that spent two years as the poster child for AI displacement is currently outgrowing the rest of the labor market while the tools improve every quarter, which is the shape Jevons predicts and the opposite of the shape displacement predicts. Even the cross-sector correlation between AI exposure and posting declines is flipping toward positive. Set the first chart to % Change and drag the slider's left edge to the Claude Code marker; the rebound is right there.

Then read the composition before celebrating. 71% of the past year's gains are senior roles. 37% have AI in the title. The recovery is real, and it's hiring people who look like the flat lines in the age chart, for jobs that didn't have names in 2022. A Jevons boom for the profession and a horse curve for the entry rung, at the same time, in the same dataset. Both camps in the argument I opened with are pointing at real pixels of the same picture.

## Where I Land

The historical analogies all cut both ways, a detail their fans tend to leave out. ATMs are the automation optimist's favorite: tellers per branch fell, but cheaper branches meant more branches, and teller employment grew for three decades after the machine arrived. That story gets retold constantly, and it always stops before the 2010s, when branch counts fell and teller employment finally followed. The complement era lasted thirty years and then became the substitute era; the satiation curve caught up. Spreadsheets are the closer analog and the sharper warning. VisiCalc and Excel erased hundreds of thousands of bookkeeping clerks while accountants and analysts grew faster than ever: the profession thrived, and the entry-level task it used to hire juniors for disappeared. That is more or less exactly the composition Canaries is measuring in software right now. And for the fully zoomed-out version, agriculture had the most Jevons-shaped century imaginable, output exploding beyond any 1900 farmer's comprehension, while farm employment went from around 40% of the US workforce to under 2%. A booming output promises nothing about the input.

There's one more optimist argument, the strongest one, and it needs none of the machinery above. Comparative advantage, David Ricardo, 1817: even if AI ends up better and cheaper than humans at every single task, compute is scarce, so every GPU-hour aimed at task X is a GPU-hour not aimed at task Y. The rational move is to point AI at the work where its edge is largest and leave humans everything else, the same way a surgeon who types faster than her receptionist still doesn't do her own scheduling; her hour is worth more in surgery. Humans stay employed wherever our relative disadvantage is smallest, no complementarity or new tasks required. The fine print is the horse story one more time. Comparative advantage guarantees a job at some wage, and if that wage falls below what it costs to keep a person on payroll at all, people exit the way horses did (horses had comparative advantage too; their hay cost more than their output was worth). The argument also thins a little every year compute gets less scarce. And one detail in the data sits awkwardly with it: Ricardian adjustment runs through wages falling smoothly, while Canaries finds wages flat and headcount doing all the adjusting. Entry pay isn't dropping to clear the market; hiring just stops. Whatever the entry rung is living through, it isn't the textbook version.

Wages are the entire half of this story I've ignored, on purpose. Everything above measures quantities: jobs posted, people on payroll. Theory says prices should move first, and the wage data has its own puzzles. That's a separate post.

Where I land, then. I came into this thinking the new-grad collapse contradicted the Jevons paradox, and I now think that was a confusion between the output and the input. Demand for software looks alive: postings recovering against a falling market, new AI job categories getting minted monthly, exactly what the steep part of the curve should look like. The entry rung is simultaneously living the horse story. And a rate shock painted over both with a crash that made everything look like AI. The cleanest summary I can write down is that the crash was mostly rates, the split is plausibly AI, and the split has not spread. Yet. Watch the 26-30 line. If it holds while 22-25 recovers, then a cohort got cyclically unlucky and we called it an apocalypse. If it rolls over, the ladder really is being pulled up, rung by rung. Either way, it will show up in these charts before it shows up in a headline.

<!-- Standalone rate strip, replaced by the dual-axis "Interest Rate" overlay
on the charts above. Kept for easy restore (its makeCohortChart instance is
commented out at the bottom of cohorts-chart.js).
<div class="jm-toolbar" data-chart="rate">
  <div class="jm-tabs jm-ranges" role="group" aria-label="Time range">
    <button type="button" class="jm-range" data-months="12">1Y</button>
    <button type="button" class="jm-range is-active" data-months="60">5Y</button>
    <button type="button" class="jm-range" data-months="120">10Y</button>
    <button type="button" class="jm-range" data-months="all">All</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-series" role="group" aria-label="Overlays">
    <label class="jm-check" data-flag="events"><input type="checkbox"> AI Releases</label>
  </div>
</div>
<div id="rate-chart" class="cc-chart cc-chart-slim"></div>
<div class="jm-bottom-row cc-bottom-row">
  <p class="jm-caption">10-year real interest rate (TIPS yield), monthly average of daily values, snapshot from <a href="https://fred.stlouisfed.org/series/DFII10" class="text-link" target="_blank" rel="noopener noreferrer">FRED</a>. The shaded band is the Fed's hiking cycle (Mar 2022 to Jul 2023), which took the federal funds rate from near zero to 5.25-5.50%. Real rates began climbing in late 2021, months before the first hike and right as job postings peaked.</p>
  <div id="rate-stat" class="cc-stat" aria-live="polite"></div>
</div>
-->
