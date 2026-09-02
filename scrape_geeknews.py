import requests
from bs4 import BeautifulSoup
import os
import sys
import json
import time
import re
from datetime import datetime, timedelta
from geeknews_utils import parse_env_file, get_data_path, extract_topic_id

_RELATIVE_DATE_PATTERNS = [
    (re.compile(r'(\d+)\s*분\s*전'), lambda n: timedelta(minutes=n)),
    (re.compile(r'(\d+)\s*시간\s*전'), lambda n: timedelta(hours=n)),
    (re.compile(r'(\d+)\s*일\s*전'), lambda n: timedelta(days=n)),
    (re.compile(r'(\d+)\s*달\s*전'), lambda n: timedelta(days=n * 30)),
    (re.compile(r'(\d+)\s*년\s*전'), lambda n: timedelta(days=n * 365)),
]

# GeekNews (CloudFront) returns 403 for bot-like User-Agents such as python-requests.
BROWSER_USER_AGENT = (
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/128.0 Safari/537.36'
)
LOGIN_URL = 'https://news.hada.io/auth/gn_login'

PLACEHOLDER_TITLES = {'', 'No Title', 'No title'}
TITLE_SELECTORS = [
    '.topictitle .topic-title-heading',
    '.topictitle h1',
    '.topictitle h2',
    '.topictitle a[id^="tr"]',
    '.topictitle a.bold',
    '.topictitle a',
]


def is_placeholder_title(title):
    return (title or '').strip() in PLACEHOLDER_TITLES


def extract_title(container):
    """Extract a topic title from current and legacy GeekNews markup."""
    for selector in TITLE_SELECTORS:
        title_elem = container.select_one(selector)
        if title_elem:
            title = title_elem.get_text(' ', strip=True)
            if not is_placeholder_title(title):
                return title
    return "No Title"


def extract_topic_id_from_row(row):
    topic_id = row.get('data-topic-state-id')
    if topic_id:
        return int(topic_id)

    row_id = row.get('id', '')
    if row_id.startswith('topic_row'):
        return int(row_id.replace('topic_row', ''))

    vote_span = row.select_one('.vote span[id^="vote"]')
    if vote_span:
        return int(vote_span['id'].replace('vote', ''))

    return None


def fetch_topic_title(session, topic_url):
    response = session.get(topic_url)
    if response.status_code != 200:
        print(f"Failed to fetch topic title from {topic_url}, status: {response.status_code}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')
    title = extract_title(soup)
    return None if is_placeholder_title(title) else title


def repair_placeholder_titles(session, topics):
    repaired_count = 0
    for topic in topics:
        if not is_placeholder_title(topic.get('title')):
            continue

        title = fetch_topic_title(session, topic['url'])
        if title:
            topic['title'] = title
            repaired_count += 1
            print(f"Repaired title for {topic['url']}: {title}")
        time.sleep(1)

    if repaired_count:
        print(f"Repaired {repaired_count} placeholder titles.")

    return repaired_count


def login(session, userid, password):
    """Log in to GeekNews. Returns (ok, reason).

    A successful login answers 302 with Location '/', a failed one 302 with
    Location '/login?code=...'. Redirects are not followed on purpose: the
    homepage rejects non-browser clients with 403, which would be mistaken for
    a login failure.
    """
    response = session.post(
        LOGIN_URL,
        data={'userid': userid, 'password': password, 'remember': 'on'},
        allow_redirects=False,
    )
    location = response.headers.get('Location', '')
    if response.status_code in (301, 302, 303, 307, 308):
        if location.startswith('/login'):
            return False, f"redirected to {location} (wrong credentials?)"
        return True, f"redirected to {location or '/'}"
    if response.status_code == 200:
        return True, "status 200"
    return False, f"status code {response.status_code}"


def parse_relative_date(text, now=None):
    """Convert Korean relative date text (e.g., '7시간전', '2일전') to YYYY-MM-DD string."""
    if now is None:
        now = datetime.now()
    for pattern, make_delta in _RELATIVE_DATE_PATTERNS:
        m = pattern.search(text)
        if m:
            return (now - make_delta(int(m.group(1)))).strftime('%Y-%m-%d')
    return None


def scrape():
    creds = parse_env_file()
    userid = creds.get('GEEKNEWS_ID')
    password = creds.get('PASSWORD')

    if not userid or not password:
        print("Error: Could not find credentials in .env")
        sys.exit(1)

    session = requests.Session()
    session.headers['User-Agent'] = BROWSER_USER_AGENT

    print(f"Logging in as {userid}...")
    ok, reason = login(session, userid, password)
    if not ok:
        print(f"Login failed: {reason}")
        sys.exit(1)
    print(f"Login succeeded ({reason}).")

    # Load existing topics
    existing_topics = []
    existing_urls = set()
    
    data_file = get_data_path(create_dirs=True)

    if os.path.exists(data_file):
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                existing_topics = json.load(f)
                existing_urls = set(t['url'] for t in existing_topics)
            print(f"Loaded {len(existing_topics)} existing topics.")
        except Exception as e:
            print(f"Error loading existing file: {e}")

    new_topics = []
    page = 1
    stop_scraping = False
    scrape_time = datetime.now()
    
    while True:
        url = f"https://news.hada.io/upvoted_topics?userid={userid}&page={page}"
        print(f"Scraping page {page}...")
        
        response = session.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch page {page}, status: {response.status_code}")
            break
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        topic_rows = soup.find_all('div', class_='topic_row')
        
        if not topic_rows:
            if page == 1:
                print("DEBUG: No topic rows found on page 1. HTML content:")
                print(soup.prettify()[:1000])
            print(f"No more topics found on page {page}. Stopping.")
            break
            
        page_topics = []
        for row in topic_rows:
            try:
                topic_id = extract_topic_id_from_row(row)
                if not topic_id:
                    # print("DEBUG: Could not find topic ID")
                    continue
                
                title = extract_title(row)
                
                desc_elem = row.select_one('.topicdesc')
                description = desc_elem.get_text(strip=True) if desc_elem else ""

                date = None
                info_elem = row.select_one('.topicinfo')
                if info_elem:
                    info_text = info_elem.get_text()
                    date = parse_relative_date(info_text, now=scrape_time)

                topic_url = f"https://news.hada.io/topic?id={topic_id}"
                
                # Check if we already have this topic
                if topic_url in existing_urls:
                    print(f"Found existing topic {topic_id}. Will stop after this page.")
                    stop_scraping = True
                    continue

                topic_data = {
                    'url': topic_url,
                    'title': title,
                    'description': description,
                    'date': date
                }
                
                # Check for duplicates within the current run (just in case)
                if not any(t['url'] == topic_url for t in new_topics) and not any(t['url'] == topic_url for t in page_topics):
                    page_topics.append(topic_data)
            except Exception as e:
                print(f"Error parsing row: {e}")
                continue

        if page_topics:
            print(f"Found {len(page_topics)} new topics on page {page}")
            new_topics.extend(page_topics)
        
        if stop_scraping:
            break
            
        page += 1
        time.sleep(3) # Be nice to the server

    print(f"Total new topics found: {len(new_topics)}")
    
    # Merge new and existing
    all_topics = new_topics + existing_topics
    repair_placeholder_titles(session, all_topics)
    
    # Sort by ID descending
    all_topics.sort(key=lambda t: extract_topic_id(t['url']) or 0, reverse=True)

    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(all_topics, f, indent=2, ensure_ascii=False)
    
    print(f"Saved to {data_file}")

if __name__ == "__main__":
    scrape()
