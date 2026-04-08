const FEATURED_PROJECTS = [
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
    id: "rotobrush",
    title: "Rotobrush",
    description: "With Rotobrush, a user can manually mark the border of an object in the first frame of a video, and Rotobrush will automatically propagate that border across all subsequent frames.<br><br>This project was based on a paper called \"Video SnapCut\" (Bai et al.) that was revolutionary at the time of its release in 2009. SnapCut was immediately included by Adobe Systems in Photoshop, and was only recently replaced by more modern techniques. I am proud that my implementation achieves superior performance to the 2009 version.",
    image: "../resources/Rotobrush_Media.png",
    tech: ["Matlab"],
    accentColor: "#4cc7e5",
    url: "../resources/SnapCut.pdf",
    ctaLabel: "Read the Paper",
    external: true
  },
  {
    id: "other-ml",
    title: "Other ML",
    description: "My computer science concentration was in machine learning, so I've had exposure to much of the machine learning lifecycle. This includes scraping data, preprocessing and preparing data, data analysis and presentation, designing, training, debugging, and testing model architectures, and integrating the results into existing applications.<br><br>I've developed a variety of traditional models from scratch, including neural networks (backpropagation and gradient descent too), transformers, CNNs, autoencoders, softmax regression and classification, embeddings, PCA, simulated annealing, A* search, particle filters, Kalman filters, entropy based decision trees, Bayes nets, GMMs, ensemble methods, and more. I've also used techniques to support model development such as ANMS, RANSAC, SfM, SLAM, factor graphs, GTSAM, importance sampling, and more.",
    image: "../resources/ML_Media.png",
    tech: ["Python", "Matlab", "TensorFlow", "Numpy", "Pandas", "and more"],
    accentColor: "hsl(63, 100%, 70%)"
  },
  {
    id: "microcaml",
    title: "MicroCaml",
    description: "MicroCaml is my own - albeit simple - programming language. It's Turing complete, and has many of the features of OCaml. I created the lexer, parser, and interpreter from scratch using context free grammar, and created an interactive shell to interface with the programming language from the command line.<br><br>As a precursor to designing MicroCaml, I familiarized myself with context free grammar by creating a regular expression engine using NFAs and DFAs.",
    image: "../resources/MicrOCaml_Media_2.png",
    tech: ["OCaml"],
    accentColor: "#5af8a1"
  },
  {
    id: "architecture",
    title: "Systems Architecture",
    description: "In college, I took a computer systems architecture class revolving around optimizing performance of multithreaded and networked systems. I implemented Tomasulo's algorithm, four branch predictors (G-share, Two-Level Adaptive, etc), and three cache coherency protocols (MOESI, etc) for parallelized processors ranging from 4 to 16 cores. Testing my implementations and finding the best hyper-parameters for various processors involved extensive scripting. Some of these projects involved working directly in MIPS Assembly.",
    image: "../resources/Systems_Media.png",
    tech: ["C", "C++", "MIPS Assembly", "Python"],
    accentColor: "#ff8a2b"
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
    id: "helm",
    title: "Helm: A Minimalist Workspace Switcher for your IDE",
    date: "April 2026",
    excerpt: "I built a Cursor/VSCode extension that brings Arc Browser style space and workspace management to your IDE sidebar.",
    url: "blog/post.html?id=helm",
    tags: ["Tools"]
  },
  {
    id: "toolbelt",
    title: "Toolbelt: Giving AI Clients a Way Into Your Machine",
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
];

if (typeof window !== 'undefined') {
  window.BLOG_POSTS = BLOG_POSTS;
}
