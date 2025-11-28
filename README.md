# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Scraping GeekNews Upvoted Topics

A script `scrape_geeknews.py` is included to scrape upvoted topics from GeekNews.

### Prerequisites

- Python 3
- `requests` and `beautifulsoup4` libraries:
  ```bash
  pip install requests beautifulsoup4
  ```
- A `.env` file in the root directory with your GeekNews credentials:
  ```
  GEEKNEWS_ID=your_id
  PASSWORD=your_password
  ```

### Usage

Run the script:

```bash
python3 scrape_geeknews.py
```

This will:
1. Log in to GeekNews using credentials from `.env`.
2. Iterate through pages of your upvoted topics.
3. Save the unique topic URLs to `laeyoung-upvote.json`.
