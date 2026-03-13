# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My GeekNews Upvotes — a personal search engine for upvoted articles on [GeekNews](https://news.hada.io/). Users scrape their upvoted topics via a Python script, then search them through a Next.js web app with Korean Chosung (initial consonant) fuzzy matching.

## Commands

- `npm run dev` — Start dev server with Turbopack on port 9002
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)
- `python3 scrape_geeknews.py` — Scrape upvoted articles (requires `.env` with `GEEKNEWS_ID` and `PASSWORD`)
- Python deps: `pip install requests beautifulsoup4`

## Architecture

**Two-part system:**

1. **Python scraper** (`scrape_geeknews.py`): Logs into GeekNews, scrapes upvoted topics with incremental updates (stops when it hits an already-scraped article), saves to `data/geeknews_my_upvotes.json`. The `data/` directory is git-ignored.

2. **Next.js 15 web app** (App Router, React 18, client-side rendering):
   - `src/app/page.tsx` — Main page (client component). Fetches articles from API, applies client-side fuzzy search, renders with infinite scroll.
   - `src/app/api/upvoted-articles/route.ts` — API route that reads article data from local JSON file or remote URL (configured via `GEEKNEWS_DATA_PATH` env var).
   - `src/lib/searchUtils.ts` — Fuzzy search using `es-hangul` library. Supports standard substring match, Chosung search (ㄱㄴ → 가나), and disassembled Jamo search.
   - `src/services/geeknews.ts` — Client-side fetch wrapper and `GeekNewsArticle` type definition.
   - `src/components/` — ArticleCard, SearchBar, InfiniteScrollTrigger, plus Shadcn UI primitives in `ui/`.

**Data flow:** Python scraper → JSON file → API route → Client fetch → Client-side fuzzy search → Rendered cards with infinite scroll.

## Key Conventions

- **UI components**: Shadcn UI (default style, CSS variables, `@/components/ui`). Add new components via `npx shadcn@latest add <component>`.
- **Path aliases**: `@/*` maps to `./src/*`.
- **Styling**: Tailwind CSS with `tailwind-merge` and `clsx` via the `cn()` utility in `src/lib/utils.ts`.
- **Build config**: TypeScript and ESLint errors are ignored during builds (`next.config.ts`).
- **Design theme**: Minimalist — text #232323, background #f3f3f3, highlight #697070.
