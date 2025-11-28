# My GeekNews Upvotes

A personal search engine for your upvoted articles on [GeekNews](https://news.hada.io/). This application allows you to scrape your upvoted topics and search through them with a fast, fuzzy search interface that supports Korean Chosung (initial consonant) matching.

## Features

- **Incremental Scraping**: Efficiently scrapes only new upvoted articles using a Python script.
- **Smart Search**: Real-time fuzzy search with Korean Chosung support (e.g., searching "ㄱㄴ" finds "GeekNews").
- **Infinite Scroll**: Seamless browsing experience with automatic loading of more articles.
- **Responsive UI**: Built with Next.js, Tailwind CSS, and Shadcn UI for a modern, clean look.

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS, Shadcn UI
- **Scraping**: Python 3 (`requests`, `beautifulsoup4`)
- **Utilities**: `es-hangul` (for Korean search logic)

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3
- A GeekNews account

### 1. Setup Environment Variables

Copy `.env.example` to `.env` and fill in your GeekNews credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEEKNEWS_ID=your_id
PASSWORD=your_password
```

### 2. Scrape Upvoted Articles

Install Python dependencies:

```bash
pip install requests beautifulsoup4
```

Run the scraping script:

```bash
python3 scrape_geeknews.py
```

This will create or update `data/geeknews_my_upvotes.json` with your upvoted articles. Note that the `data/` directory is git-ignored to keep your personal data safe.

### 3. Run the Application

Install Node.js dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `scrape_geeknews.py`: Python script to scrape upvoted topics.
- `src/app`: Next.js app router pages and API routes.
- `src/components`: React components (ArticleCard, SearchBar, etc.).
- `src/lib`: Utility functions, including the fuzzy search logic.
- `src/services`: Data fetching services.

