---
title: The Sample Efficiency Gap
date: June 2026
---


## OUTLINE

### 1. Setup: In-distribution vs. out-of-distribution
- Define the concept early since the entire post builds on it. A model performs well on data that looks like what it trained on (in-distribution) and poorly on data that doesn't (out-of-distribution).
- Frame the central question: can we make the training distribution wide enough that everything we care about is in-distribution, or is there something fundamentally different about how humans generalize?

### 2. The reward signal thesis
- Core claim: AI is as good as the reward signal it gets. If you can define what correct behavior looks like, the model can learn it.
- Scalable reward signals (chess, Go): self-play loop, not constrained by human capability, produces superhuman performance.
- Constrained reward signals (language, most real-world tasks): bounded by human capability, can't self-play your way out.
- This is both liberating and constraining. It tells you exactly where AI will excel and where it will plateau.

### 3. The cold-start problem
- A randomly initialized model can't learn against a superhuman opponent: zero differential signal, zero reward, no way to tell right from wrong.
- Long-horizon tasks (Minecraft ender dragon / Dota 2 / similar): the probability of stumbling into a win by random action is astronomically low. <do the calculation or find it>
- The bootstrap: train on human trajectories first to get the model good enough to occasionally win on its own, then let self-play take over. <pick the best game example after research>

### 4. Language as the big success case
- Models trained on human language trajectories learn to mimic language generation.
- This baseline is good enough to then train for specific objectives: chatbot interfaces, math problems with verifiable solutions, coding problems with compilable/testable outputs.
- The method never changed: see huge numbers of trajectories, learn to reproduce the high-reward ones.

### 5. Pretraining hits a wall
- GPT-1 through the scaling era: train on human data, scale it up, add instruction tuning.
- Summer 2022 anecdote: manually formatting "User: ... Assistant: ..." to turn chat into next-token prediction.
- Two problems: (1) not enough internet data to scale indefinitely, (2) reward signal constrained by average human capability as expressed on the internet.
- Response: clean the dataset, supplement with expert human data. Labs are still doing this (Meror/Serge job listings, domain-specific experts). But human capability remains the bottleneck.

### 6. RL environments as the attempted fix
- Build verifiable reward environments: math (code-verified solutions, Lean proofs), coding (compiles, passes tests).
- Aside: coding agents overengineering their output makes sense given how they're trained, they're optimizing for "compiles and passes first time" above all else.
- Labs hand-curate these RL environments. <list interesting/unusual ones>
- The process is messy and bespoke. Each skill needs its own environment, rubrics, expert data.

### 7. Generalization didn't emerge
- The hope: enough RL environments would produce emergent general intelligence.
- What happened: models got better, but only in-distribution. Performance didn't transfer to domains outside the training data the way it would for a human who "gets" a general concept.
- The hope that all of human data was enough to make AGI in-distribution appears to not be the case.

### 8. The scale of the data gap (from transcript)
- How much data these models actually consume vs. humans:
  - Language tokens: ~200M human lifetime vs. tens-to-hundreds of trillions. ~millionfold difference.
  - Robotics: humans learn to operate new hardware in hours; AIs can't even with millions of hours of demos.
  - Driving: 20 hours of teen practice vs. 3-4 OOM more data for Waymo/Tesla.
- GRPO and the credit assignment grind: hundreds to thousands of rollouts per task vs. a human practicing once or twice.
- The right mental model: Frankenstein's monster built from a billion carefully constructed example graphs, not a human who learned many skills.

### 9. Why open source catches up so fast
- Epoch: open models lag frontier by ~4 months.
- Data is the real driver and can be distilled from public APIs. If hyperparameters/architecture were driving progress, catching up would be much harder.

### 10. Common objections (from transcript)
- "Evolution pre-trained us": genome is only 3 GB, 1-2% protein coding. Evolution found hyperparameters and loss functions, not weights. And even granting the comparison, it doesn't explain why each new marginal skill needs so much data.
- "You're ignoring multimodal sensory data": blind and deaf people still have general intelligence. The millionfold gap may be an understatement.
- "We just haven't scaled enough": Chinchilla scaling laws show parameter and data terms are additive. Infinite parameters only buys ~10x less data. Humans are thousands-to-millions of times more efficient. Different scaling curve.

### 11. Does sample efficiency matter for the labs' goals?
- Automating white-collar work: common tasks can be brought in-distribution. Revenue curves say there's enormous value here even without human-level sample efficiency. Human lifespan is the bottleneck for humans, not for AI. Ludicrously inefficient training is still wildly in the green when amortized across billions of sessions.
- The OOD question: how much out-of-distribution thinking do real jobs require? Some jobs were automatable pre-AI. Others (software engineering) deal daily with OOD problems. Prediction: more demand for human SWEs in 2027 than today.
- The recursive path: automate AI research first, then have automated researchers solve sample efficiency. Tease the follow-up post: people think about this too clumsily, either dismissing it or assuming a god pops out. The interesting question is what faster-than-usual AI progress looks like atop LLMs and their particular kind of intelligence.


-- -- -- -- -- -- -- --


## STREAM OF CONSCIOUSNESS NOTES

actualy lets talk about the feasability of discussing/framing this from a slightly different perspective, ie the core idea is: ai is as good as the reward signal it gets. since the release of the transformer which solved the sequence length problem, if you can provide a reward signal (what correct behavior looks like), the AI can learn it. whether it be image classification, predicting the next token, etc. this can be both liberating and constraining. if you have a truly scaleable reward signal like chess and go, you can setup a nice loop where better models play against themselves and get even higher quality reward signals. you can run this process indefinitely in that case creating increasingly (and superhumanely) good models. the reward signal you've set up (which model one the game) is not constrained by human capability and thus get superhuman performance. but this is not the case in every domain.

also call out that if the environment is too tough the model will never learn, ie a randomly initialized model couldn't ever improve against the current superhuman chess ais as they would never win, never generate any trajectories that were better or worse than others, so there would be zero positive reward ie zero reward signal at all. and they could never figure out what they were doing right vs wrong. consider attempting to train a model on minecraft to beat the ender dragon. the trajectoreis are so unbelievably long that to beat the game by random action/luck alone and generate one solid reward signal would likely never occur in the lifetime of the universe <provide a calculation here that estimates. we are gonna look it up later and see if we can find it online>. luckily though there is a way around this, by using human data first, then setting up the loop. by training on human action trajectories, the models get good enough to ocassionally generate wins on their own in minecraft, and can then be left to their own devices, generating more and more reward, and getting better and faster at winning <not sure if minecraft is the right game to call out here maybe dota 2 or sometjing league of legends idk we need to do research for the specific example we're going to use>.

a great case where this came to pass is language. models get trained on human trajectories through language generation and learn to mimic it. this gives them enough of a baseline that you can then train them for specific objectives ie chatbot interfaces, give them math problems that they have to write code to solve but can be verified automatically, give them coding problems that can be verified automatically. and they'll get better at these things.

What hasn't changed in all this time though is the method by which the models learn. they learn by seeing absurdly high numbers of trajectories with varying levels of reward and learn to reproduce the ones with high reward. in fact there is the chinchilla scaling law papers that show how a model will improve given 1 dataset size 2 model size 3 training time <is this true?>

so that brings us to gpt 1 where the model was trained to reproduce human data, like training a chess ai to reproduce human moves. then we scaled that up (called it pretraining) and did a little bit of additional training so the model would answer in a q/a style rather than simply next token prediction. if you were there in the summer of 2022 you had to manually write User: what is x? Assistant: X is.. and it would fill it in. you had to turn the call response format into a simple next token prediction problem.
so the issue with this is twofold. first there isn't enough data on the internet to continue scaling this indefinitely, we need to generate more data. and second, the reward signal of the data is constrained by human capability, and if you're training on the whole internet its constrained by average human capability as expressed in text that appears on the internet. so what do we do? we clean up the dataset, supplement more of it with text generated by expert humans. and if you look thats what labs are still doing. <cue the examples from the transcript below>. But this doens't solve the core problem of human capability still being the bottleneck.
so rl environments got made. lets get as many verifiable reward envirnoments as possible and generate data with those. ie math. write code to solve math rpoblems. lean proofs, etc. and coding, write code that compiles first time, or passes tests, etc. if you've worked with coding agents you know they way overdo the code they write, adding dependencies that don't need to be there because its like they're so scared of the code not compiling and the tests not passing first time which makes sense given how they're trained. but this process is messy, and what the labs have to do is hand curate all of these RL environments <list a few cool ones that i havent said before>.
a few years ago, the hope was that with enough rl environments the models would just generalize. straight up suddently get an emergent property that went aha i got it now i'm generally intelligent. but that didn't happen, the models got better but only in the data they were trained on. ie in distribution. the hope was all of human data was enough to make agi in distribution but that seems to not be the case. <maybe i have to talk about distribution more earlier to make it feel less random>

so that brings us to today, we have these models that are trained on human data and supplemented with








-- -- -- -- -- -- -- --


## Intelligence as sample efficiency

- Define intelligence as sample efficiency: how much data do you need to operate competently in a given domain?
- Argue that we haven't made much progress in training sample efficiency itself; we've mainly widened and improved the data distribution.

## RL as synthetic data generation

- RL is essentially synthetic data generation: dump compute against a verifier/rubric, find the good data, then train the model to predict correct rollouts.
- For this to work the model needs some prior probability of the correct solution, which is why you need massive amounts of human expert trajectories in every skill you want competence in.
- The data is extremely task-specific and bespoke. Point to job descriptions on Meror/Serge: word specialists, legal experts writing M&A diligences, management consultants writing market research.
- Each skill requires hundreds of human experts generating completions, writing rubrics, explaining reasoning. The data labeling industry is earning billions (soon decabillions) a year.

## GRPO and the credit assignment grind

- Models grind tasks far harder than humans: GRPO generates hundreds to thousands of rollouts per task.
- A human practices a textbook problem once or twice; models need orders of magnitude more repetition to solve credit assignment.
- The right mental model: not a human who learned many skills, but a Frankenstein's monster built from a billion graphs of carefully constructed examples sewn together.

## Why open source catches up so fast

- Epoch reports open models lag frontier by ~4 months.
- Data is the real driver of progress, and data can be distilled from public APIs. Hyperparameters, training tricks, and architectural optimizations cannot.
- If the latter were driving most of the progress, catching up would be far harder than we observe.

## The scale of the data gap

### Language tokens
- A person sees/hears ~2,000 words/hour. Birth to adulthood: ~200 million tokens.
- Frontier models train on tens to hundreds of trillions of tokens. Close to a millionfold difference.

### Robotics
- A human can learn to operate a random humanoid or robot arm within hours.
- AIs can't do this, even with millions of hours of demonstrations, because they learn far less efficiently.

### Driving
- A teenager learns to drive with ~20 hours of practice.
- Even including 16 years of building physical intuition, still 3-4 orders of magnitude less data than Waymo/Tesla use.

## Common objections

### "Evolution pre-trained us"
- Our genome is only 3 GB, 1-2% protein coding. Not enough space to store a pre-trained network.
- Evolution found the right hyperparameters and loss functions; within our lifetime we build the connectome from scratch (analogous to weights/parameters).
- Even granting that pre-training catches up to evolution, it doesn't explain why each new marginal capability still requires enormous amounts of data.

### "You're ignoring multimodal sensory data"
- Including all sensor information from birth to adulthood: tens to hundreds of billions of tokens.
- But blind and deaf people still have general intelligence. The billions of sensory tokens aren't the thing making humans smart.
- Deaf people consuming language only via sign language and reading likely ingest far fewer than 200M tokens, so the millionfold gap may be an understatement.

### "We just haven't scaled enough"
- Human brain: ~100 trillion synapses. Frontier models: ~5 trillion parameters. Maybe 1-2 OOM bigger would close the gap?
- The scaling loss equations add parameter and data terms independently.
- Even increasing parameters to infinity only decreases required data by ~10x (per Chinchilla constants).
- Humans are thousands to millions of times more sample efficient. Scaling model size can't close that gap.
- This suggests humans are on a different scaling curve altogether.

## Does sample efficiency matter for the labs' goals?

### Automating white-collar work
- The bet: common tasks (software engineering, analysis, accounting) are common enough to bring into the training distribution.
- Revenue curves suggest enormous value even without human-level sample efficiency.
- It may be more inefficient to train AIs on these tasks than to train humans, but human lifespan doesn't allow the quantity and breadth of training that models experience.
- AIs can firehose gigawatts of training and amortize what they learn across billions of sessions. Ludicrously inefficient training can still be wildly in the green.

### The out-of-distribution question
- How much OOD thinking do white-collar jobs require that you can't train for in advance?
- Some jobs were automatable long before modern AI (bank tellers, travel agents). Others deal daily with problems distant from the data distribution.
- Software engineering is probably in the latter category. Prediction: more demand for human software engineers in 2027 than today, largely due to complementary input of AI.

### The recursive path
- The labs' plan for harder jobs: automate AI research first, then have automated researchers solve sample efficiency.
- Can AIs without human-level sample efficiency solve the remaining research problems standing in the way of humanlike learning?
- Tease: people think about this too clumsily. Either dismiss AI speeding up AI research, or assume a god pops out. The interesting question is what it looks like to have much faster AI progress happening atop LLMs and their particular kind of intelligence.
