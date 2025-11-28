import requests
from bs4 import BeautifulSoup
import os
import json
import time

def get_credentials():
    env_path = '.env'
    creds = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    creds[key] = value
    return creds

def scrape():
    creds = get_credentials()
    userid = creds.get('GEEKNEWS_ID')
    password = creds.get('PASSWORD')

    if not userid or not password:
        print("Error: Could not find credentials in .env")
        return

    session = requests.Session()
    
    # Login
    login_url = 'https://news.hada.io/auth/gn_login'
    login_data = {
        'userid': userid,
        'password': password,
        'remember': 'on'
    }
    
    print(f"Logging in as {userid}...")
    response = session.post(login_url, data=login_data)
    
    if response.status_code != 200:
        print(f"Login failed with status code {response.status_code}")
        return

    # Check if login was successful (usually redirects or sets cookies)
    # We can assume success if we get a 200 OK from the POST and subsequent requests work.
    # A better check might be to see if we are redirected or check cookies, 
    # but let's proceed to scrape.

    all_topics = []
    page = 1
    
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
                topic_id = None
                # Try getting ID from row id
                row_id = row.get('id', '')
                if row_id.startswith('topic_row'):
                    topic_id = int(row_id.replace('topic_row', ''))
                
                # Try getting ID from vote span
                if not topic_id:
                    vote_span = row.select_one('.vote span[id^="vote"]')
                    if vote_span:
                        topic_id = int(vote_span['id'].replace('vote', ''))
                
                if not topic_id:
                    # print("DEBUG: Could not find topic ID")
                    continue
                
                title_elem = row.select_one('.topictitle h1')
                title = title_elem.get_text(strip=True) if title_elem else "No Title"
                
                desc_elem = row.select_one('.topicdesc')
                description = desc_elem.get_text(strip=True) if desc_elem else ""
                
                topic_url = f"https://news.hada.io/topic?id={topic_id}"
                
                topic_data = {
                    'url': topic_url,
                    'title': title,
                    'description': description
                }
                
                # Check for duplicates based on URL
                if not any(t['url'] == topic_url for t in all_topics) and not any(t['url'] == topic_url for t in page_topics):
                    page_topics.append(topic_data)
            except Exception as e:
                print(f"Error parsing row: {e}")
                continue

        print(f"Found {len(page_topics)} topics on page {page}")
        all_topics.extend(page_topics)
        page += 1
        time.sleep(3) # Be nice to the server

    print(f"Total unique topics found: {len(all_topics)}")
    
    # Sort by ID descending
    def get_id(topic):
        try:
            return int(topic['url'].split('id=')[1])
        except:
            return 0

    all_topics.sort(key=get_id, reverse=True)

    with open('laeyoung-upvote.json', 'w', encoding='utf-8') as f:
        json.dump(all_topics, f, indent=2, ensure_ascii=False)
    
    print("Saved to laeyoung-upvote.json")

if __name__ == "__main__":
    scrape()
