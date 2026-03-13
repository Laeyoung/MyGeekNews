"""
Backfill date field for existing articles that don't have one.
Fetches the exact datePublished from each topic's JSON-LD metadata.

Usage:
    python3 backfill_dates.py
    python3 backfill_dates.py --data-path /path/to/data.json
    python3 backfill_dates.py --sleep 2  (seconds between requests, default 1)
"""

import requests
import json
import re
import os
import sys
import time
import argparse
from geeknews_utils import get_data_path, extract_topic_id

_JSON_LD_PATTERN = re.compile(
    r'<script\s+type="application/ld\+json">\s*(\{.*?\})\s*</script>',
    re.DOTALL,
)


def fetch_date_published(session, topic_id):
    """Fetch datePublished from a topic page's JSON-LD metadata."""
    url = f"https://news.hada.io/topic?id={topic_id}"
    resp = session.get(url, timeout=10)
    resp.raise_for_status()

    match = _JSON_LD_PATTERN.search(resp.text)
    if not match:
        return None

    try:
        ld = json.loads(match.group(1))
        date_str = ld.get('datePublished', '')
        # "2021-09-13T09:29:10+09:00" -> "2021-09-13"
        if date_str:
            return date_str[:10]
    except (json.JSONDecodeError, KeyError):
        pass

    return None


def main():
    parser = argparse.ArgumentParser(description='Backfill dates for existing articles')
    parser.add_argument('--data-path', help='Path to JSON data file')
    parser.add_argument('--sleep', type=float, default=1.0, help='Sleep seconds between requests (default: 1)')
    args = parser.parse_args()

    data_path = get_data_path(args.data_path)
    if not os.path.exists(data_path):
        print(f"Error: Data file not found: {data_path}")
        sys.exit(1)

    with open(data_path, 'r', encoding='utf-8') as f:
        articles = json.load(f)

    missing = [(i, a) for i, a in enumerate(articles) if not a.get('date')]
    print(f"Total articles: {len(articles)}, missing date: {len(missing)}")

    if not missing:
        print("All articles already have dates. Nothing to do.")
        return

    session = requests.Session()
    session.headers['User-Agent'] = 'Mozilla/5.0 (compatible; GeekNewsBackfill/1.0)'

    updated = 0
    failed = 0
    save_interval = 50  # save progress every N articles

    for count, (idx, article) in enumerate(missing, 1):
        topic_id = extract_topic_id(article['url'])
        if not topic_id:
            print(f"  [{count}/{len(missing)}] Skipping (no topic ID): {article['url']}")
            failed += 1
            continue

        try:
            date = fetch_date_published(session, topic_id)
            if date:
                articles[idx]['date'] = date
                updated += 1
                print(f"  [{count}/{len(missing)}] ID {topic_id}: {date}")
            else:
                print(f"  [{count}/{len(missing)}] ID {topic_id}: date not found")
                failed += 1
        except requests.RequestException as e:
            print(f"  [{count}/{len(missing)}] ID {topic_id}: request failed - {e}")
            failed += 1

        # Save progress periodically
        if count % save_interval == 0:
            with open(data_path, 'w', encoding='utf-8') as f:
                json.dump(articles, f, indent=2, ensure_ascii=False)
            print(f"  -- Progress saved ({updated} updated so far) --")

        time.sleep(args.sleep)

    # Final save
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Updated: {updated}, Failed: {failed}, Total: {len(articles)}")
    print(f"Saved to {data_path}")


if __name__ == '__main__':
    main()
