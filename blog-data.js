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
    id: "homeclaw",
    title: "Homeclaw: Giving AI Clients a Way Into Your Machine",
    date: "March 2026",
    excerpt: "Turn your local machine into a remote MCP server so any AI client can access your skills setup and take actions on your machine.",
    url: "blog/post.html?id=homeclaw",
    tags: ["AI & ML", "Systems"]
  },
  {
    id: "embedded-swift-agent",
    title: "Building a Coding Agent in Embedded Swift",
    date: "February 2026",
    excerpt: "How I built a fully featured coding agent in Embedded Swift that compiles to a 195 KB binary and boots in 120ms.",
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
  // Preview duplicates — remove before shipping
  {
    id: "helm-2",
    title: "Helm: A Minimalist Workspace Switcher for your IDE",
    date: "April 2026",
    excerpt: "I built a Cursor/VSCode extension that brings Arc Browser style space and workspace management to your IDE sidebar.",
    url: "blog/post.html?id=helm",
    tags: ["Tools"]
  },
  {
    id: "homeclaw-2",
    title: "Homeclaw: Giving AI Clients a Way Into Your Machine",
    date: "March 2026",
    excerpt: "Turn your local machine into a remote MCP server so any AI client can access your skills setup and take actions on your machine.",
    url: "blog/post.html?id=homeclaw",
    tags: ["AI & ML", "Systems"]
  },
  {
    id: "embedded-swift-agent-2",
    title: "Building a Coding Agent in Embedded Swift",
    date: "February 2026",
    excerpt: "How I built a fully featured coding agent in Embedded Swift that compiles to a 195 KB binary and boots in 120ms.",
    url: "blog/post.html?id=embedded-swift-agent",
    tags: ["Swift", "Systems"]
  },
  {
    id: "metr-doubling-2",
    title: "How Fast Are Agents Improving?",
    date: "January 2026",
    excerpt: "An analysis of METR-Horizon benchmark data showing AI agent capability doubling times, with interactive projections through 2033.",
    url: "blog/post.html?id=metr-doubling",
    tags: ["AI & ML"]
  },
  {
    id: "autoencoders-2-2",
    title: "Autoencoders – Part 2",
    date: "April 2024",
    excerpt: "Using autoencoders in practice: outlier detection, variational autoencoders for data generation, denoising, and the CLIP model.",
    url: "https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/",
    tags: ["AI & ML"],
    external: true
  },
  {
    id: "autoencoders-1-2",
    title: "Autoencoders – Part 1",
    date: "January 2024",
    excerpt: "Building intuition for autoencoders: how they compress data into lower-dimensional representations and what makes them useful.",
    url: "https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/",
    tags: ["AI & ML"],
    external: true
  },
  // Preview duplicates (3rd copy) — remove before shipping
  {
    id: "helm-3",
    title: "Helm: A Minimalist Workspace Switcher for your IDE",
    date: "April 2026",
    excerpt: "I built a Cursor/VSCode extension that brings Arc Browser style space and workspace management to your IDE sidebar.",
    url: "blog/post.html?id=helm",
    tags: ["Tools"]
  },
  {
    id: "homeclaw-3",
    title: "Homeclaw: Giving AI Clients a Way Into Your Machine",
    date: "March 2026",
    excerpt: "Turn your local machine into a remote MCP server so any AI client can access your skills setup and take actions on your machine.",
    url: "blog/post.html?id=homeclaw",
    tags: ["AI & ML", "Systems"]
  },
  {
    id: "embedded-swift-agent-3",
    title: "Building a Coding Agent in Embedded Swift",
    date: "February 2026",
    excerpt: "How I built a fully featured coding agent in Embedded Swift that compiles to a 195 KB binary and boots in 120ms.",
    url: "blog/post.html?id=embedded-swift-agent",
    tags: ["Swift", "Systems"]
  },
  {
    id: "metr-doubling-3",
    title: "How Fast Are Agents Improving?",
    date: "January 2026",
    excerpt: "An analysis of METR-Horizon benchmark data showing AI agent capability doubling times, with interactive projections through 2033.",
    url: "blog/post.html?id=metr-doubling",
    tags: ["AI & ML"]
  },
  {
    id: "autoencoders-2-3",
    title: "Autoencoders – Part 2",
    date: "April 2024",
    excerpt: "Using autoencoders in practice: outlier detection, variational autoencoders for data generation, denoising, and the CLIP model.",
    url: "https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/",
    tags: ["AI & ML"],
    external: true
  },
  {
    id: "autoencoders-1-3",
    title: "Autoencoders – Part 1",
    date: "January 2024",
    excerpt: "Building intuition for autoencoders: how they compress data into lower-dimensional representations and what makes them useful.",
    url: "https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/",
    tags: ["AI & ML"],
    external: true
  }
];

if (typeof window !== 'undefined') {
  window.BLOG_POSTS = BLOG_POSTS;
}
