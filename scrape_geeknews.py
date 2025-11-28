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

    all_urls = []
    page = 1
    
    while True:
        url = f"https://news.hada.io/upvoted_topics?userid={userid}&page={page}"
        print(f"Scraping page {page}...")
        
        response = session.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch page {page}, status: {response.status_code}")
            break
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all topic links
        # Based on typical structure, links are like /topic?id=...
        # We look for <a> tags with href containing 'topic?id='
        
        links = soup.find_all('a', href=True)
        page_urls = []
        
        for link in links:
            href = link['href']
            if 'topic?id=' in href:
                if '&go=comments' in href:
                    continue
                if href.startswith('http'):
                    full_url = href
                else:
                    # Ensure leading slash
                    if not href.startswith('/'):
                        href = '/' + href
                    full_url = f"https://news.hada.io{href}"
                # Clean up URL (remove other params if any, though usually it's just id)
                if full_url not in all_urls and full_url not in page_urls:
                    page_urls.append(full_url)
        
        if not page_urls:
            print(f"No more topics found on page {page}. Stopping.")
            break
            
        print(f"Found {len(page_urls)} topics on page {page}")
        all_urls.extend(page_urls)
        page += 1
        time.sleep(3) # Be nice to the server

    print(f"Total unique URLs found: {len(all_urls)}")
    
    # Sort by ID descending
    def get_id(url):
        try:
            return int(url.split('id=')[1].split('&')[0])
        except:
            return 0

    all_urls.sort(key=get_id, reverse=True)

    with open('laeyoung-upvote.json', 'w') as f:
        json.dump(all_urls, f, indent=2)
    
    print("Saved to laeyoung-upvote.json")

if __name__ == "__main__":
    scrape()
