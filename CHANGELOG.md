# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.0] - 2025-12-01

### Features

- **Scraper**: Implemented `scrape_geeknews.py` to incrementally scrape upvoted articles from GeekNews.
- **Search**: Added real-time fuzzy search with Korean Chosung (initial consonant) support using `es-hangul`.
- **Infinite Scroll**: Implemented infinite scrolling for seamless article browsing.
- **Data Source**: Added `GEEKNEWS_DATA_PATH` environment variable to support custom local paths or remote URLs for data.
- **UI**: Built a responsive interface using Next.js 15, Tailwind CSS, and Shadcn UI.
- **Header**: Added dynamic display of the total count of upvoted articles.

### Refactor

- **Data Structure**: Moved scraped data to a git-ignored `data/` directory for better security and organization.
- **Project Name**: Renamed application to "My GeekNews Upvotes".

### Documentation

- **README**: Added comprehensive `README.md` with setup instructions and project overview.
