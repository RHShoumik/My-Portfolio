# Ragib Hassan Shoumik — Portfolio

Personal portfolio website built with **Next.js 16**, **TypeScript**, and **Tailwind CSS v4**. Features a blog powered by MDX, animated UI with Framer Motion, dynamic color palettes, and a contact API.

🌐 **Live:** [rhshoumik.dev](https://rhshoumik.dev)

---

## Tech Stack

| Layer | Libraries / Tools |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, ShadCN UI |
| Animation | Framer Motion 12 |
| Blog | MDX, `@next/mdx`, `remark-gfm`, `rehype-pretty-code` |
| State | Zustand 5 |
| Theming | `next-themes` |
| Icons | Lucide React |
| Syntax highlighting | Shiki |
| Linting | ESLint 9 |
| Deployment | Vercel |

---

## Features

- **Multi-palette theming** — 6 color palettes (Slate, Emerald, Indigo, Rose, Amber, Cyan) with dark/light mode
- **MDX blog** — file-based blog with frontmatter, GFM tables, and syntax-highlighted code blocks
- **Animated sections** — scroll-triggered animations via Framer Motion with a custom cursor
- **GitHub contribution graph** — live activity grid
- **Scroll progress indicator**
- **OpenGraph image API** — dynamic OG images at `/api/og`
- **Contact form API** — serverless contact route at `/api/contact`
- **SEO** — `sitemap.ts`, `robots.ts`, and per-page metadata
- **View Transitions API** — experimental Next.js view transitions
- **React Compiler** — enabled for optimized re-renders

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page (all sections)
│   ├── layout.tsx            # Root layout with providers
│   ├── globals.css           # Global styles + palette CSS vars
│   ├── robots.ts             # robots.txt
│   ├── sitemap.ts            # XML sitemap
│   ├── blog/
│   │   ├── page.tsx          # Blog listing
│   │   └── [slug]/page.tsx   # Blog post
│   └── api/
│       ├── contact/route.ts  # Contact form endpoint
│       └── og/route.tsx      # Dynamic OG image
├── components/
│   ├── sections/             # Hero, About, Experience, Projects, Skills, Contact
│   ├── ui/                   # ShadCN primitives
│   ├── navbar.tsx
│   ├── footer.tsx
│   ├── theme-switcher.tsx
│   ├── palette-sync.tsx
│   ├── custom-cursor.tsx
│   ├── scroll-progress.tsx
│   ├── github-graph.tsx
│   └── motion.tsx            # Reusable motion wrappers
├── content/
│   └── blog/                 # MDX blog posts
├── lib/
│   ├── constants.ts          # Site config, nav, experience, projects, skills
│   ├── blog.ts               # MDX parsing helpers
│   └── utils.ts              # cn() and other utilities
└── store/
    └── theme-store.ts        # Zustand palette store
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Install

```bash
git clone https://github.com/rhshoumik/portfolio.git
cd portfolio
npm install
```

### Run locally

```bash
npm run dev
# Starts on http://localhost:3001
```

### Build for production

```bash
npm run build
npm start
# Serves on http://localhost:3001
```

---

## Writing Blog Posts

Add a `.mdx` file to `src/content/blog/` with the following frontmatter:

```mdx
---
title: "Your Post Title"
date: "2026-02-24"
description: "A short description for the listing page."
tags: ["Next.js", "TypeScript"]
---

Your content here...
```

The post will be available at `/blog/your-post-title` (slug derived from the filename).

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Required for the contact form (e.g. Resend, Nodemailer, etc.)
CONTACT_EMAIL=you@example.com

# Optional — public site URL (used for OG image generation)
NEXT_PUBLIC_SITE_URL=https://rhshoumik.dev
```

---

## License

MIT — feel free to use this as inspiration for your own portfolio, but please swap out personal content (name, experience, projects) with your own.
