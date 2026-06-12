---
title: Fine-Tuning Gemma 4 MoE with Heretic-ARA
date: April 2026
scripts: [https://cdn.plot.ly/plotly-2.27.0.min.js, posts/assets/heretic-ara-charts.js]
styles: [posts/assets/heretic-ara-charts.css]
---

Today's language models are heavily censored. They're trained to refuse requests seen as harmful. While this is certainly important for preventing widespread misuse, it can make the model less useful in certain situations, and it sure takes some fun conversations off the table. How hard is it, then, to get around this? 

This post covers how I used [Heretic](https://github.com/p-e-w/heretic) and heretic-ara to uncensor Gemma 4 26B A4B, Google's latest open source model. I'll cover the core ideas that make heretic work, and what makes the experimental heretic-ara variant different and more powerful. If you'd rather just chat with the models right now, you can download them from huggingface at [dawsonamf/gemma-4-26b-a4b-it-heretic-ara-r3-kl4059-GGUF](https://huggingface.co/dawsonamf/gemma-4-26b-a4b-it-heretic-ara-r3-kl4059-GGUF) and [dawsonamf/gemma-4-26b-a4b-it-heretic-ara-r9-kl1077-GGUF](https://huggingface.co/dawsonamf/gemma-4-26b-a4b-it-heretic-ara-r9-kl1077-GGUF). There's two links because these two models are from different points on the KL-divergence/refusals Pareto frontier. If you don't know what that means, keep reading!

## The need for a heretic

The refusal behavior of early language models was surprisingly easy to bypass. A well thought out prompt could "jailbreak" the model and cause it to comply with any request. However, jailbreaks are much less common today. Now that language models can reason about their own refusal behavior, and perhaps also because post training now takes up a larger percentage of total training, getting around model censorship is more difficult. The only way to get a truly reliably uncensored model is to modify its weights. However, most people don't have millions of dollars to spare for pretraining and fine tuning an unchensored language model. Luckily (or perhaps unluckily) there is a much easier way.

In June 2024 the paper [Refusal in Language Models Is Mediated by a Single Direction](https://arxiv.org/abs/2406.11717) came out. it outlined a cheap and fast process by which a language model's weights could be updated to decrease its tendency to refuse requests. To understand the core idea, you first have to understand the basics of how language models work.

## Tokens, embeddings, and high dimensional spaces

Language models don't see words, they see tokens, and each token is really just a vector. This vector can be thought of as representing that token's semantic meaning in a high dimensional space. For example, if a language model uses token vectors that have 4096 dimensions, each token can be thought of as occupying a point in 4096 dimensional space. 

This 4096 dimensional space is rich with meaning. In fact, studies have shown that not only do points in the space encode maning, but directions do as well. If you take the token vector for king, subtract the vector for man, and add woman, you get a vector close to the token vector for queen! Not only do points in this high dimensional space represent meaning, but directions have semantic meaning as well. There is a direction for "manliness", "womanliness", and so on.

## The residual stream

When you query a language model with a few paragraphs of text, the input to the underlying transformer is just a list of these vectors, one for each token of your input text. Conceptually, the fundamental operation occuring in a transformer is the procedural updating of the location in 4096 dimensional space of each of the tokens in this list. As the list of vectors passes through each layer of the transformer, each vector in the list gets updated slightly. The transformer is slowly shifting the location of each vector in this high dimensional space, altering the "meaning" represented by it.

After the list has traveled through every transformer layer, the language model then uses the final vector in the list (and only this final vector) to determine what token to output next. The location of this final vector in high dimensional space has been updated to represent the "meaning" of the entire query. Now it can be used to predict what token should come next.

This is a critical point to understand. The transformer is updating the final vector in such a way that the next token (and so over multiple turns, the entire response) can be determined solely from this final vector.

## Clustering and the refusal direction

If you were to plot this final vector in high dimensional space, for every answer the language model produces, refusals and non refusals would form separate clusters. This is the insight that heretic exploits. It uses these clusters to compute a direction - called the "refusal direction" - that separates refusals and non refusals. It then applies a transformation to the weights of the language model such that tokens that would have ended up near the refusal cluster end up closer to the non refusal cluster.

## KL divergence and the optimization objective

This core idea is insightful, but it alone is not enough. The weights in transformer layers often serve multiple purposes, and modifying them in support of one single objective is likely to harm their ability to perform the myriad of other functions they are also serving. In short, if we modify the weights of a language model in the wrong way, the model will become dumber. We don't just want less refusals, we want less refusals without damaging the capabilites of the model.

This is where KL divergence comes into play. KL divergence is a measure of how much one probability distribution diverges from another. In this case, we use it to compare the output distribution of our modified model against the original model, looking specifically at outputs that shouldn't have changed (i.e. benign prompts that never induced refusals). A low KL divergence means the model's general behavior (the output probabilities for tokens in normal conversations) are unaffected, and our weight updates primarily served to lower refusals without modifying behavior in any other way (this is what we want!) A high KL divergence means we have modified the model across the board. While we may have made the model refuse less, we've also changed how it responds math and coding questions - and since our updates were not towards maximizing capability, these changes likely came at the cost of model capabliity. 

So, our goal is to have low refusals, while also having low KL divergence. Heretic systematically applies changes to the models weights, observes the KL divergence and refusal rate, and creates an optimal Pareto frontier for us to choose from. We can decide how much KL divergence we are willing to accept for a given refusal rate.

## Heretic-ara

This is a a very effective technique, but rests on one important assumption that is not true: that there exists one single refusal direction in the high dimensional space. While this may be true in some cases, it is certainly not necessarily true. Consider the following two clusters:

!!!! insert 3D plot here !!!!

This plot shows that refusals and non refusals occupy different parts of the space, but they are not so clearly separable by a single direction. Instead, what you should do is look at the location of your potential refusal, and move it closest








































!!!! talk about what could happen if this were ran on Claude Mythos Preview !!!!


-- -- -- -- 




