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
  console.log(`Fetching page: ${url}`);
  const response = await fetch(url, {
    headers: {
      // Add headers that might mimic a browser request if needed
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const articles: GeekNewsArticle[] = [];

  // Target the topic entries. Adjust selector if the site structure changes.
  // Common structure is often a list (<ul>, <ol>) or divs containing article links.
  // Inspect the target page's HTML structure carefully.
  // Example selector: '.topic_row' or similar containing div/li for each topic
   $('.topic_row').each((_, element) => {
      const titleElement = $(element).find('div.topictitle a').first();
      let title = titleElement.text().trim();
      let href = titleElement.attr('href');

      // Handle potential empty titles or missing hrefs
      if (!title || !href) {
          console.warn(`Skipping entry with missing title or URL on page ${page}`);
          return; // Skip this iteration
      }

      // Remove trailing count like '(12)' if present
      title = title.replace(/\s*\(\d+\)$/, '').trim();

      // Resolve relative URLs
      if (href && href.startsWith('/')) {
        href = `${GEEKNEWS_BASE_URL}${href}`;
      } else if (href && !href.startsWith('http')) {
        // Handle cases where it might be missing the base URL entirely
        console.warn(`Unexpected URL format found: ${href}. Attempting to resolve.`);
        // You might need more robust logic here depending on possible URL formats
        href = `${GEEKNEWS_BASE_URL}/${href.startsWith('/') ? '' : '/'}${href}`;
      }


      articles.push({ title, url: href });
    });

  console.log(`Found ${articles.length} articles on page ${page}`);
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
    return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 });
  }

  try {
    let currentPage = 1;
    let allArticles: GeekNewsArticle[] = [];
    let hasMorePages = true;

    console.log(`Starting fetch for user: ${userId}`);

    while (hasMorePages) {
      const articlesFromPage = await fetchPage(userId, currentPage);

      if (articlesFromPage.length === 0) {
        // If a page returns no articles, assume we've reached the end
        hasMorePages = false;
        console.log(`No more articles found on page ${currentPage}. Stopping pagination.`);
      } else {
        // Basic duplicate check (by URL) before adding
        const uniqueArticles = articlesFromPage.filter(
            (newArticle) => !allArticles.some((existingArticle) => existingArticle.url === newArticle.url)
        );
        allArticles = allArticles.concat(uniqueArticles);
        console.log(`Fetched ${articlesFromPage.length} articles from page ${currentPage}. Total unique: ${allArticles.length}`);

        // Check if we fetched fewer articles than expected (e.g., < 15 per page typical on GeekNews)
        // This is a heuristic, might need adjustment if page size varies.
        // GeekNews seems to show 15 topics per page.
        if (articlesFromPage.length < 15) {
            hasMorePages = false;
             console.log(`Fetched ${articlesFromPage.length} (less than 15) on page ${currentPage}. Assuming end of pages.`);
        } else {
            currentPage++;
             // Optional: Add a small delay between page fetches to be polite to the server
             await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      }

      // Safety break: Limit the number of pages to prevent infinite loops
      if (currentPage > 50) { // Adjust limit as needed
         console.warn(`Reached page limit (50) for user ${userId}. Stopping pagination.`);
         hasMorePages = false;
      }
    }

    console.log(`Finished fetching for user ${userId}. Total articles: ${allArticles.length}`);
    return NextResponse.json(allArticles);

  } catch (error: any) {
    console.error(`Error scraping GeekNews for user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to scrape GeekNews', details: error.message }, { status: 500 });
  }
}

// Optional: Define configuration for the route
// export const dynamic = 'force-dynamic'; // Ensure the route is always executed dynamically
// export const revalidate = 0; // Do not cache the response (or set a reasonable revalidation time)
