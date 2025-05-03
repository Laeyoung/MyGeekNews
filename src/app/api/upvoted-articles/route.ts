import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { GeekNewsArticle } from '@/services/geeknews';

const GEEKNEWS_BASE_URL = 'https://news.hada.io';

/**
 * Fetches and parses a single page of upvoted topics.
 * @param userId The user ID.
 * @param page The page number to fetch.
 * @returns A promise that resolves to an array of articles from that page.
 */
async function fetchPage(userId: string, page: number): Promise<GeekNewsArticle[]> {
  const url = `${GEEKNEWS_BASE_URL}/upvoted_topics?userid=${userId}&page=${page}`;
  console.log(`[GeekNews Scraper] Fetching page: ${url}`);
  const response = await fetch(url, {
    headers: {
      // Mimic a browser request to potentially avoid simple blocks
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': GEEKNEWS_BASE_URL, // Specify the origin
      'Referer': `${GEEKNEWS_BASE_URL}/upvoted_topics?userid=${userId}`, // Include Referer header
    },
     // Add cache busting? Maybe not necessary if serverless function
     // cache: 'no-store', // Uncomment if running in environments that cache aggressively
  });

  if (!response.ok) {
    console.error(`[GeekNews Scraper] Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    // Log response body if possible for debugging
    try {
        const errorBody = await response.text();
        console.error(`[GeekNews Scraper] Error response body: ${errorBody.substring(0, 500)}...`); // Log first 500 chars
    } catch (e) {
        console.error('[GeekNews Scraper] Could not read error response body.');
    }
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  // console.log(`[GeekNews Scraper] Fetched HTML for page ${page} (first 500 chars): ${html.substring(0, 500)}...`); // Optional: Log HTML for debugging

  const $ = cheerio.load(html);
  const articles: GeekNewsArticle[] = [];

  // Target each article container within the main content area
  $('main > article > div.topics > div.topic_row').each((index, element) => {
      // Find the anchor tag within the title container
      const titleAnchor = $(element).find('div.topictitle > a').first();

      // Extract the title text from the h1 tag inside the anchor
      let title = titleAnchor.find('h1').text().trim();
      // Extract the URL from the anchor's href attribute
      let href = titleAnchor.attr('href');

      // Handle potential empty titles or missing hrefs more robustly
      if (!title || !href) {
          console.warn(`[GeekNews Scraper] Skipping entry index ${index} on page ${page} due to missing title or URL.`);
          // Log the problematic element's HTML for inspection
          // console.warn(`[GeekNews Scraper] Problematic element HTML: ${$(element).html()?.substring(0, 200)}...`);
          return; // Skip this iteration
      }

      // Resolve relative URLs
      if (href.startsWith('/')) {
        href = `${GEEKNEWS_BASE_URL}${href}`;
      } else if (!href.startsWith('http')) {
        // Handle cases where it might be missing the base URL entirely or other unexpected formats
        // e.g., topic?id=20667
        if (href.startsWith('topic?')) {
             href = `${GEEKNEWS_BASE_URL}/${href}`;
        } else {
            console.warn(`[GeekNews Scraper] Unexpected URL format found: ${href} on page ${page}. Assuming it's relative to base.`);
            // Assume it's relative to the base URL if it doesn't start with '/' or 'http'
            href = `${GEEKNEWS_BASE_URL}/${href.startsWith('/') ? '' : '/'}${href}`;
        }
      }


      articles.push({ title, url: href });
    });

  console.log(`[GeekNews Scraper] Found ${articles.length} articles on page ${page}`);
  return articles;
}


/**
 * GET handler for the /api/upvoted-articles route.
 * Fetches all upvoted articles for a given user by paginating through GeekNews.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    console.error('[GeekNews Scraper] Missing userId query parameter');
    return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 });
  }

  try {
    let currentPage = 1;
    let allArticles: GeekNewsArticle[] = [];
    let hasMorePages = true;
    // Check the example HTML: it shows 20 items per page, plus a "More" link.
    // Let's assume 20 items per page, but the logic to stop based on fetched count is more robust.
    const ITEMS_PER_PAGE = 20; // Adjust based on observation, but the stop condition is key.
    const MAX_PAGES_TO_FETCH = 50; // Safety limit

    console.log(`[GeekNews Scraper] Starting fetch for user: ${userId}`);

    while (hasMorePages) {
      console.log(`[GeekNews Scraper] Fetching page ${currentPage} for user ${userId}`);
      const articlesFromPage = await fetchPage(userId, currentPage);

      if (articlesFromPage.length === 0) {
        // If a page returns *no* articles, assume we've definitively reached the end.
        hasMorePages = false;
        console.log(`[GeekNews Scraper] No articles found on page ${currentPage}. Stopping pagination.`);
      } else {
        // Basic duplicate check (by URL) before adding
        const uniqueArticles = articlesFromPage.filter(
            (newArticle) => !allArticles.some((existingArticle) => existingArticle.url === newArticle.url)
        );
        if (uniqueArticles.length < articlesFromPage.length) {
            console.warn(`[GeekNews Scraper] Found ${articlesFromPage.length - uniqueArticles.length} duplicate articles on page ${currentPage}.`);
        }
        allArticles = allArticles.concat(uniqueArticles);
        console.log(`[GeekNews Scraper] Fetched ${articlesFromPage.length} articles (${uniqueArticles.length} unique) from page ${currentPage}. Total unique: ${allArticles.length}`);

        // Check if we fetched fewer articles than the expected page size OR if the 'more' link is absent.
        // The provided HTML has `<div class='next commentTD'><a href='/upvoted_topics?userid=laeyoung&page=2' class=u>더 불러오기</a></div>`
        // Let's rely on the number of items fetched as the primary indicator.
        // If exactly ITEMS_PER_PAGE are fetched, we assume there *might* be more.
        // If fewer are fetched, we assume it's the last page.
        if (articlesFromPage.length < ITEMS_PER_PAGE) {
            hasMorePages = false;
            console.log(`[GeekNews Scraper] Fetched ${articlesFromPage.length} articles (less than ${ITEMS_PER_PAGE}) on page ${currentPage}. Assuming end of pages.`);
        } else {
            currentPage++;
            // Add a delay between page fetches to be polite to the server and avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay
        }
      }

      // Safety break: Limit the number of pages to prevent infinite loops
      if (currentPage > MAX_PAGES_TO_FETCH) {
         console.warn(`[GeekNews Scraper] Reached page limit (${MAX_PAGES_TO_FETCH}) for user ${userId}. Stopping pagination.`);
         hasMorePages = false;
      }
    }

    console.log(`[GeekNews Scraper] Finished fetching for user ${userId}. Total unique articles retrieved: ${allArticles.length}`);
    return NextResponse.json(allArticles);

  } catch (error: any) {
    console.error(`[GeekNews Scraper] Error scraping GeekNews for user ${userId}:`, error);
    // Check if the error is the one thrown from fetchPage
    if (error.message.startsWith('Failed to fetch')) {
         return NextResponse.json({ error: 'Failed to fetch data from GeekNews', details: error.message }, { status: 502 }); // Bad Gateway might be appropriate
    }
    // Generic server error for other issues
    return NextResponse.json({ error: 'An internal error occurred while scraping GeekNews', details: error.message }, { status: 500 });
  }
}

// Optional: Define configuration for the route
export const dynamic = 'force-dynamic'; // Ensure the route is always executed dynamically
// export const revalidate = 0; // Deprecated in App Router, use dynamic = 'force-dynamic' instead

