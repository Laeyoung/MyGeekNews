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
- `python3 backfill_dates.py` — Backfill dates for articles missing date info (fetches from topic page JSON-LD)
- Python deps: `pip install requests beautifulsoup4`

## Architecture

**Two-part system:**

1. **Python scripts**: Shared utilities in `geeknews_utils.py` (env parsing, data path resolution, topic ID extraction).
   - `scrape_geeknews.py` — Logs into GeekNews, scrapes upvoted topics with incremental updates (stops when it hits an already-scraped article), saves to `data/geeknews_my_upvotes.json`. The `data/` directory is git-ignored.
   - `backfill_dates.py` — Fetches exact `datePublished` from each topic page's JSON-LD for articles missing dates. Saves progress every 50 articles.

2. **Next.js 15 web app** (App Router, React 18, client-side rendering):
   - `src/app/page.tsx` — Main page (client component). Fetches articles from API, applies client-side fuzzy search, renders with infinite scroll.
   - `src/app/api/upvoted-articles/route.ts` — API route that reads article data from local JSON file or remote URL (configured via `GEEKNEWS_DATA_PATH` env var).
   - `src/lib/searchUtils.ts` — Fuzzy search using `es-hangul` library. Supports standard substring match, Chosung search (ㄱㄴ → 가나), and disassembled Jamo search.
   - `src/services/geeknews.ts` — Client-side fetch wrapper and `GeekNewsArticle` type definition.
   - `src/components/` — ArticleCard, SearchBar, InfiniteScrollTrigger, plus Shadcn UI primitives in `ui/`.

**Data flow:** Python scraper → JSON file → API route → Client fetch → Client-side fuzzy search → Rendered cards with infinite scroll.

## GeekNews HTML Notes

- Topic listing pages use `div.topic_row` with children: `.topictitle h1`, `.topicdesc`, `.topicinfo`
- `.topicinfo` text format: `"N points by username N시간전 | 댓글 N개"` — date is Korean relative time (분전/시간전/일전/달전/년전)
- Individual topic pages (`/topic?id=N`) contain `<script type="application/ld+json">` with exact `datePublished` in ISO format

## Key Conventions

- **UI components**: Shadcn UI (default style, CSS variables, `@/components/ui`). Add new components via `npx shadcn@latest add <component>`.
- **Path aliases**: `@/*` maps to `./src/*`.
- **Styling**: Tailwind CSS with `tailwind-merge` and `clsx` via the `cn()` utility in `src/lib/utils.ts`.
- **Build config**: TypeScript and ESLint errors are ignored during builds (`next.config.ts`).
- **Design theme**: Minimalist — text #232323, background #f3f3f3, highlight #697070.

## Gotchas

- Python `None` → JSON `null` → TypeScript `null` (not `undefined`). Optional fields from JSON should be typed as `string | null`, not just `string`.
- `npm run typecheck` requires `node_modules` installed (`npm install` first); pre-existing type errors exist due to `ignoreBuildErrors: true` in next.config.ts.
