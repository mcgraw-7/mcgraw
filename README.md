
## mcgraw — mcgraw.io Portfolio

Live: https://mcgraw.io

[![framework: Next.js](https://img.shields.io/badge/framework-Next.js-000000.svg)](https://nextjs.org/) [![language: TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/) [![host: Vercel](https://img.shields.io/badge/host-Vercel-black.svg)](https://vercel.com/)

A clean, fast React (Next.js + TypeScript) portfolio for McGraw — the source for https://mcgraw.io, showcasing projects, writing, and contact info with a minimal, accessible design.

Overview
- Purpose: present projects, case studies, blog posts, and contact details in a performant, accessible, and minimal design.
- Framework: Next.js (React + TypeScript)
- Hosting: Vercel (recommended for instant previews, optimized static & SSR deployments)

Quick start (pnpm)
1. Clone
   git clone https://github.com/mmcgraw73/mcgraw.git
   cd mcgraw

2. Install dependencies
   pnpm install

3. Run locally (development)
   pnpm dev
   Open http://localhost:3000

4. Build for production
   pnpm build

5. Serve production (Next.js)
   pnpm start

vercel deployment
- Vercel detects Next.js automatically. Connect the repository in the Vercel dashboard and import the project.
- Default build command: pnpm build (or let Vercel detect it)
- No custom output directory is required for Next.js
- Enable Preview Deployments for PRs to get shareable previews on every branch

structure
- /pages or /app — Next.js pages and routing
- /src — components, hooks, utilities
- /public — static assets (images, icons)
- /content or /data — markdown/JSON content for projects and posts
- /styles — global styles or Tailwind config

tooling
- Use pnpm for consistent installs (include .nvmrc for Node version)
- Linting / formatting: ESLint + Prettier
- Pre-commit hooks: husky + lint-staged

Contact
- Author: McGraw
- Site: https://mcgraw.io
- GitHub: https://github.com/mmcgraw73
