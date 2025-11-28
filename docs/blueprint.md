# **App Name**: My GeekNews Upvotes

## Core Features:

- **Data Fetching and Storage**:
    - Python script (`scrape_geeknews.py`) to scrape upvoted articles from GeekNews.
    - Supports incremental updates: stops scraping when an existing topic is found.
    - Handles pagination automatically.
    - Stores data in `geeknews_my_upvotes.json`.
    - Configurable User ID and Password via `.env`.

- **Search and Filtering**:
    - **Fuzzy Search**: Real-time search with support for Korean Chosung (initial consonant) search (e.g., "ㄱㄴ" matches "가나").
    - Filters articles by title and description.

- **Results Display**:
    - **Infinite Scroll**: Automatically loads more articles as the user scrolls down.
    - **Responsive Design**: Clean, card-based layout using Shadcn UI and Tailwind CSS.
    - **Loading States**: Skeleton loaders for a smooth user experience.
    - **Error Handling**: Clear error messages and empty state indicators.

## Tech Stack:

- **Frontend**: Next.js 15, React 18, Tailwind CSS, Shadcn UI.
- **Backend/Scripting**: Python 3 (Requests, BeautifulSoup4) for scraping.
- **Utilities**: `es-hangul` for Korean text processing.

## Style Guidelines:

- **Theme**: Minimalist, consistent with GeekNews aesthetics.
- **Colors**:
    - Text: #232323 (Gray tone).
    - Background: #f3f3f3 (Light gray).
    - Highlight: #697070.
- **Components**:
    - Clean cards for articles.
    - Simple, accessible search bar.
    - Subtle transitions and hover effects.