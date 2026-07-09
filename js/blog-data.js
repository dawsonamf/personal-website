const FEATURED_PROJECTS = [
  {
    id: "gemma4-heretic-ara",
    title: "Gemma 4 MoE Heretic-ARA",
    description:
      "Out of curiosity I rented an H100 on RunPod and fine tuned Google's Gemma 4 26B MoE model using Heretic's experimental ARA branch. I couldn't decide between two of the models on the KL divergence/refusals Pareto frontier, so I benchmarked them both against the evals Google released for the original model (MMMLU, MMMU Pro, AIME 2026, GPQA Diamond, LiveCodeBench V6, τ2-bench, etc).<br><br>I'm currently working on a blog post that explains in more depth what I did, how Heretic works, and how arbitrary rank ablation improves on Heretic's original design. In the meantime, you can download and try the models yourself using the link below.",
    image: "../resources/KLvsRefusals.png",
    tech: [
      "Directional Ablation",
      "KL Divergence",
      "Refusal Suppression",
      "HuggingFace",
      "L-BFGS",
      "PyTorch",
    ],
    accentColor: "#61ffda",
    url: "https://huggingface.co/dawsonamf",
    ctaLabel: "View on HuggingFace",
    external: true,
  },
  {
    id: "embedded-swift-agent",
    title: "Embedded Swift Agent",
    description:
      "Recently I decided I wanted to build a coding agent from scratch. With so many tutorials online, I decided to make it a little more challenging for myself; make the final binary as small as possible. Rather than learn Rust, I went with Embedded Swift. Without Foundation I had to create almost every dependency manually: networking with libcurl via C interop, JSON parsing by wrapping cJSON with RAII semantics, concurrency with raw pthreads and mutexes, etc. Once the initial implementation was working in standard Swift, I used the agent running inside its own binary to help port itself to Embedded Swift.<br><br>The final result is a 195 KB binary that boots in 120ms, supports streaming responses, parallel tool execution, subagents, and more. It's smaller than most JPEGs, with the same capabilities as agents more than 500x its size.",
    image: "../resources/EmbeddedSwiftAgent_CLIScreenshot.png",
    tech: ["Embedded Swift", "C", "libcurl", "cJSON", "pthreads"],
    accentColor: "#61ffda",
    url: "/embedded-swift-agent/",
    ctaLabel: "Try it in your browser",
    url2: "https://github.com/dawsonamf/EmbeddedSwiftAgent",
    ctaLabel2: "View on GitHub",
    external2: true,
  },
  {
    id: "helm",
    title: "Helm",
    description:
      "I often work on many projects at the same time. Sometimes I find myself with over a dozen Cursor windows open at once. At a certain point, managing them all started to feel like a job on its own. I am a huge fan of Arc Browser and wanted its elegant space and tab management inside my IDE, so I built it.<br><br>Helm is a VS Code/Cursor extension that lives in the Explorer sidebar. You can save workspaces, and organize them into “spaces” with custom names, colors, and emojis. You can swipe between spaces with the trackpad, and drag and drop to reorder. The styling uses VS Code's built-in theme variables, so it looks native regardless of which theme you're using.",
    image: "../resources/Helm_All.png",
    tech: ["TypeScript", "VSCode API", "Webview", "CSP", "esbuild"],
    accentColor: "#61ffda",
    url: "https://marketplace.visualstudio.com/items?itemName=dawsonamf.project-helm",
    ctaLabel: "View on VS Code Marketplace",
    external: true,
  },
  {
    id: "toolbelt",
    title: "Toolbelt",
    description:
      "Fundamentally, a coding agent is just a chatbot with access to a filesystem. There's no reason that access must be restricted to a CLI agent running locally on a machine. In theory, any chatbot could become a coding agent if given the right access.<br><br>Toolbelt is an MCP server that does exactly that. It runs on your machine (or a cloud VM/dev box) and exposes a configurable set of tools (bash, read_file, write_file, glob, grep, web_search, etc) over the internet through a secure Cloudflare tunnel. Add Toolbelt to any MCP compatible chatbot (like the ChatGPT app on your iPhone or a local model in LM Studio) and it will become an agent capable of taking actions on your machine. This makes the chat interface the minor component of the agentic system; you can swap it out anytime without having to modify your tools or environment.",
    image: "../resources/Purple_Toolbelt_Image.jpg",
    tech: ["Python", "FastMCP", "Cloudflare", "OAuth 2.0"],
    accentColor: "#61ffda",
    url: "https://github.com/dawsonamf/toolbelt",
    ctaLabel: "View on GitHub",
    external: true,
  },
  {
    id: "amino-amigo",
    title: "Amino Amigo",
    description:
      "I like to workout, and building muscle requires lots of protein. Building muscle optimally requires timing protein intake. However, no macronutrient tracking app that I could find takes this into account. None distinguish complete from incomplete protein, or optimal protein windows. This frustrated me to the point that I created the app I wished already existed.<br><br>Amino Amigo has been downloaded in over a dozen countries. The app factors in individual metabolic limits and alerts users to when - and how much - protein to have. The app closely follows Apple's interface guidelines and design principles, and makes use of a wide variety of Swift features and frameworks.",
    image: "../resources/Amino_Media.png",
    tech: ["Swift", "SwiftUI", "Xcode"],
    accentColor: "#61ffda",
    url: "https://apps.apple.com/us/app/amino-amigo/id1638666228",
    ctaLabel: "View on the App Store",
    external: true,
  },
  {
    id: "lexchat",
    title: "LexChat",
    description:
      "LexChat is a website that allows users to search and talk to the Lex Fridman podcast. I transcribed the podcast with Whisper, created the search engine using vector embeddings, and construct natural language replies based on this search using GPT-3.5. Each search result includes a timestamped link directly to the moment in the podcast episode containing the search result.<br><br>I built this back in 2022, before ChatGPT was launched and the explosion of LLMs in general. Because there was limited LLM tooling at the time, I had to build my own RAG stack from scratch, including hosting the embeddings and implementing my own search engine using approximate k-NN.",
    image: "../resources/LexChat_Media.jpeg",
    tech: ["Python", "Pinecone", "Streamlit", "OpenAI", "BeautifulSoup"],
    accentColor: "#61ffda",
    url: "/lexchat/",
    ctaLabel: "Visit LexChat",
    external: true,
  },
  {
    id: "deep-rl",
    title: "Deep RL",
    description:
      'After graduating college, I became interested in reinforcement learning, and decided to do a self-study using "Reinforcement Learning: An Introduction" by Sutton and Barto as a guide. I read that book from cover to cover and fell in love with the ideas there. Along with OpenAI\'s Spinning Up, I implemented many of the algorithms I learned from scratch, including SARSA, DQN, PPO, DDPG, SAC, and a simple version of Monte Carlo Tree Search inspired by AlphaZero.',
    image: "../resources/RL_Media.png",
    tech: ["Python", "C++", "OpenAI Gym"],
    accentColor: "#61ffda",
  },
];

if (typeof window !== "undefined") {
  window.FEATURED_PROJECTS = FEATURED_PROJECTS;
}

const BLOG_POSTS = [
  // {
  //   id: "gemma4-heretic-ara",
  //   title: "Fine-Tuning Gemma 4 MoE with Heretic-ARA",
  //   date: "April 2026",
  //   excerpt: "Exploring the alignment boundary of Google's Gemma 4 26B MoE model using Arbitrary-Rank Ablation, with two variants on the KL divergence vs. refusal Pareto frontier.",
  //   url: "blog/post.html?id=gemma4-heretic-ara",
  //   tags: ["AI & ML"]
  // },
  {
    id: "underviewed-art",
    title: "The Art Nobody Looks At",
    date: "July 2026",
    excerpt:
      "Great museums contain far more art than they could ever show. The Met's collection has more than 1.5 million objects, and only about 4 percent of them are on the walls on any given day. The rest sits in storage, catalogued but almost never seen.",
    url: "blog/post.html?id=underviewed-art",
    tags: ["Tools"],
  },
  {
    id: "arena-freshness",
    title: "Arena.ai Leaderboard Update Badges",
    date: "May 2026",
    excerpt:
      "How a Tampermonkey script, regexing RSC payload streams, and React hydration injection make the case for an open web.",
    url: "blog/post.html?id=arena-freshness",
    tags: ["Tools"],
  },
  {
    id: "helm",
    title: "Helm: A Minimalist Workspace Switcher for your IDE",
    date: "April 2026",
    excerpt:
      "Building a Cursor/VSCode extension that brings Arc Browser style space and workspace management to your IDE sidebar.",
    url: "blog/post.html?id=helm",
    tags: ["Tools"],
  },
  {
    id: "toolbelt",
    title: "Toolbelt: Giving AI Clients a Way Into Your Environment",
    date: "March 2026",
    excerpt:
      "Turn your local machine into a remote MCP server so any AI client can access your skills setup and take actions on your machine.",
    url: "blog/post.html?id=toolbelt",
    tags: ["Tools", "Systems"],
  },
  {
    id: "embedded-swift-agent",
    title: "Building a Coding Agent in Embedded Swift",
    date: "February 2026",
    excerpt:
      "Building a fully featured coding agent in Embedded Swift that compiles to a 195 KB binary and boots in 120ms.",
    url: "blog/post.html?id=embedded-swift-agent",
    tags: ["Swift", "Systems"],
  },
  {
    id: "metr-doubling",
    title: "How Fast Are Agents Improving?",
    date: "January 2026",
    excerpt:
      "An analysis of METR-Horizon benchmark data showing AI agent capability doubling times, with interactive projections through 2033.",
    url: "blog/post.html?id=metr-doubling",
    tags: ["AI & ML"],
  },
  {
    id: "autoencoders-2",
    title: "Autoencoders – Part 2",
    date: "April 2024",
    excerpt:
      "Using autoencoders in practice: outlier detection, variational autoencoders for data generation, denoising, and the CLIP model.",
    url: "https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/",
    tags: ["AI & ML"],
    external: true,
  },
  {
    id: "autoencoders-1",
    title: "Autoencoders – Part 1",
    date: "January 2024",
    excerpt:
      "Building intuition for autoencoders: how they compress data into lower-dimensional representations and what makes them useful.",
    url: "https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/",
    tags: ["AI & ML"],
    external: true,
  },
  {
    id: "college-projects",
    title: "Highlights from My CS Degree",
    date: "May 2022",
    excerpt:
      "A collection of projects from my Computer Science undergrad, consolidated from an older version of this site.",
    tags: ["AI & ML", "Systems"],
    url: "blog/post.html?id=college-projects",
  },
];

if (typeof window !== "undefined") {
  window.BLOG_POSTS = BLOG_POSTS;
}
