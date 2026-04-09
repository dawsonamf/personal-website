const FEATURED_PROJECTS = [
  {
    id: "gemma4-heretic-ara",
    title: "Gemma 4 MoE Heretic-ARA",
    description: "I fine-tuned Google's Gemma 4 26B MoE model using Heretic's experimental Arbitrary-Rank Ablation (ARA) method to explore the alignment boundary between refusal suppression and capability preservation. ARA bypasses the standard directional ablation pipeline — which breaks on Gemma 4's custom layer types — by using PyTorch hooks and direct L-BFGS matrix optimization instead.<br><br>The result is two model variants at different points on the KL divergence vs. refusal Pareto frontier, published on HuggingFace in both raw safetensors and GGUF formats. Benchmark comparisons against the vanilla model are planned.",
    image: "../resources/placeholder.png",
    tech: ["Python", "PyTorch", "HuggingFace", "Heretic", "L-BFGS"],
    accentColor: "#F05138",
    url: "blog/post.html?id=gemma4-heretic-ara",
    ctaLabel: "Read the Blog Post",
    external: false
  },
  {
    id: "embedded-swift-agent",
    title: "Embedded Swift Agent",
    description: "I wanted to see how small a fully featured coding agent could be if built from the ground up in Embedded Swift. Without Foundation, I had to replace every dependency manually: networking with libcurl via C interop, JSON parsing by wrapping cJSON with RAII semantics, concurrency with raw pthreads and mutexes, and shell execution with posix_spawn. The agent used itself to help port its own codebase from standard Swift to Embedded Swift.<br><br>The result is a 195 KB binary that boots in 120ms, supports streaming responses, parallel tool execution, subagents, and real-time steering. It's smaller than most JPEGs and significantly more capable than the project that inspired it.",
    image: "../resources/EmbeddedSwiftAgent_CLIScreenshot.png",
    tech: ["Swift", "C", "libcurl", "cJSON", "pthreads"],
    accentColor: "#F05138",
    url: "https://github.com/dawsonamf/EmbeddedSwiftAgent",
    ctaLabel: "View on GitHub",
    external: true
  },
  {
    id: "helm",
    title: "Helm",
    description: "I had over a dozen Cursor windows open at once, each in a different Desktop window on my Mac, and managing them was a job on its own. I wanted Arc Browser's elegant space and tab management, but for my IDE. So I built it.<br><br>Helm is a VS Code and Cursor extension that lives in the Explorer sidebar. You save workspaces, organize them into spaces with custom names, colors, and emojis, and click to switch. The entire UI is a single HTML webview with no framework, styled using VS Code's theme variables so it looks native in any theme. Spaces support trackpad swipe navigation and drag-and-drop reordering.",
    image: "../resources/Helm_All.png",
    tech: ["TypeScript", "VS Code API", "esbuild"],
    accentColor: "#007ACC",
    url: "https://github.com/dawsonamf/helm",
    ctaLabel: "View on GitHub",
    external: true
  },
  {
    id: "toolbelt",
    title: "Toolbelt",
    description: "I realized that the agent loop controlling your computer doesn't have to be running on your computer — it just needs a tunnel. Toolbelt is a remote MCP server that runs on your machine and exposes a configurable set of tools (shell, file I/O, grep, web search, and more) to any AI client over a Cloudflare tunnel.<br><br>The server is written in Python with FastMCP. It auto-generates a bearer token on first launch, opens a Cloudflare Quick Tunnel for HTTPS access, and includes an OAuth 2.0 flow for clients that require it. The entire server is stateless — no session cleanup, no stale connections, no side effects from long-lived sessions.",
    image: "../resources/Purple_Toolbelt_Image.png",
    tech: ["Python", "FastMCP", "Cloudflare", "OAuth 2.0"],
    accentColor: "#F48120",
    url: "https://github.com/dawsonamf/toolbelt",
    ctaLabel: "View on GitHub",
    external: true
  },
  {
    id: "amino-amigo",
    title: "Amino Amigo",
    description: "I like to workout, and building muscle requires lots of protein. Building muscle optimally requires timing protein intake. However, no macronutrient tracking app that I could find takes this into account. None distinguish complete from incomplete protein, or optimal protein windows. This frustrated me to the point that I created the app I wished already existed.<br><br>Amino Amigo has been downloaded in over a dozen countries. The app factors in individual metabolic limits and alerts users to when - and how much - protein to have. The app closely follows Apple's interface guidelines and design principles, and makes use of a wide variety of Swift features and frameworks.",
    image: "../resources/Amino_Media.png",
    tech: ["Swift", "SwiftUI", "Xcode"],
    accentColor: "rgb(162, 78, 245)",
    url: "https://apps.apple.com/us/app/amino-amigo/id1638666228",
    ctaLabel: "View on the App Store",
    external: true
  },
  {
    id: "lexchat",
    title: "LexChat",
    description: "LexChat is a website that allows users to search and talk to the Lex Fridman podcast. I transcribed the podcast with Whisper, created the search engine using vector embeddings, and construct natural language replies based on this search using GPT-3.5. Each search result includes a timestamped link directly to the moment in the podcast episode containing the search result.<br><br>I built this back in 2022, before ChatGPT was launched and the explosion of LLMs in general. Because there was limited LLM tooling at the time, I had to build my own RAG stack from scratch, including hosting the embeddings and implementing my own search engine using approximate k-NN.",
    image: "../resources/LexChat_Media.jpeg",
    tech: ["Python", "Pinecone", "Streamlit", "OpenAI", "BeautifulSoup"],
    accentColor: "#0084ff",
    url: "lexchat.html",
    ctaLabel: "Visit LexChat",
    external: true
  },
  {
    id: "deep-rl",
    title: "Deep RL",
    description: "After graduating college, I became interested in reinforcement learning, and decided to do a self-study using \"Reinforcement Learning: An Introduction\" by Sutton and Barto as a guide. I read that book from cover to cover and fell in love with the ideas there. Along with OpenAI's Spinning Up, I implemented many of the algorithms I learned from scratch, including SARSA, DQN, PPO, DDPG, SAC, and a simple version of Monte Carlo Tree Search inspired by AlphaZero.",
    image: "../resources/RL_Media.png",
    tech: ["Python", "C++", "OpenAI Gym"],
    accentColor: "rgb(216, 134, 0)"
  }
];

if (typeof window !== 'undefined') {
  window.FEATURED_PROJECTS = FEATURED_PROJECTS;
}

const BLOG_POSTS = [
  {
    id: "gemma4-heretic-ara",
    title: "Fine-Tuning Gemma 4 MoE with Heretic-ARA",
    date: "April 2026",
    excerpt: "Exploring the alignment boundary of Google's Gemma 4 26B MoE model using Arbitrary-Rank Ablation, with two variants on the KL divergence vs. refusal Pareto frontier.",
    url: "blog/post.html?id=gemma4-heretic-ara",
    tags: ["AI & ML"]
  },
  {
    id: "helm",
    title: "Helm: A Minimalist Workspace Switcher for your IDE",
    date: "April 2026",
    excerpt: "I built a Cursor/VSCode extension that brings Arc Browser style space and workspace management to your IDE sidebar.",
    url: "blog/post.html?id=helm",
    tags: ["Tools"]
  },
  {
    id: "toolbelt",
    title: "Toolbelt: Giving AI Clients a Way Into Your Environment",
    date: "March 2026",
    excerpt: "Turn your local machine into a remote MCP server so any AI client can access your skills setup and take actions on your machine.",
    url: "blog/post.html?id=toolbelt",
    tags: ["Tools", "Systems"]
  },
  {
    id: "embedded-swift-agent",
    title: "Building a Coding Agent in Embedded Swift",
    date: "February 2026",
    excerpt: "Building a fully featured coding agent in Embedded Swift that compiles to a 195 KB binary and boots in 120ms.",
    url: "blog/post.html?id=embedded-swift-agent",
    tags: ["Swift", "Systems"]
  },
  {
    id: "metr-doubling",
    title: "How Fast Are Agents Improving?",
    date: "January 2026",
    excerpt: "An analysis of METR-Horizon benchmark data showing AI agent capability doubling times, with interactive projections through 2033.",
    url: "blog/post.html?id=metr-doubling",
    tags: ["AI & ML"]
  },
  {
    id: "autoencoders-2",
    title: "Autoencoders – Part 2",
    date: "April 2024",
    excerpt: "Using autoencoders in practice: outlier detection, variational autoencoders for data generation, denoising, and the CLIP model.",
    url: "https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/",
    tags: ["AI & ML"],
    external: true
  },
  {
    id: "autoencoders-1",
    title: "Autoencoders – Part 1",
    date: "January 2024",
    excerpt: "Building intuition for autoencoders: how they compress data into lower-dimensional representations and what makes them useful.",
    url: "https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/",
    tags: ["AI & ML"],
    external: true
  },
  {
    id: "college-projects",
    title: "Highlights from My CS Degree",
    date: "May 2022",
    excerpt: "A collection of projects from my Computer Science undergrad, consolidated from an older version of this site.",
    tags: ["AI & ML", "Systems"],
    url: "blog/post.html?id=college-projects"
  },
];

if (typeof window !== 'undefined') {
  window.BLOG_POSTS = BLOG_POSTS;
}
