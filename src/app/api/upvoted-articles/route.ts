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

  // Updated selector based on inspection (as of late 2024)
  // Topics are within div.board_list > div.topic_row
  // Title link is within div.topic__title > a
  $('.topic_row').each((index, element) => {
      const titleElement = $(element).find('div.topic__title > a').first();
      let title = titleElement.text().trim();
      let href = titleElement.attr('href');

      // Handle potential empty titles or missing hrefs more robustly
      if (!title || !href) {
          console.warn(`[GeekNews Scraper] Skipping entry index ${index} on page ${page} due to missing title or URL.`);
          // Log the problematic element's HTML for inspection
          // console.warn(`[GeekNews Scraper] Problematic element HTML: ${$(element).html()?.substring(0, 200)}...`);
          return; // Skip this iteration
      }

      // Clean up title: Remove potential trailing comment counts like '(12)'
      // The count might be in a separate span now, but this regex handles old formats too.
      title = title.replace(/\s*\(\d+\)$/, '').trim();
      // Further cleanup: Remove any comment count span text if present directly in the link text
      const commentCountText = titleElement.find('span.topic__comment__count').text().trim();
      if(commentCountText) {
          title = title.replace(commentCountText, '').trim();
      }

      // Resolve relative URLs
      if (href && href.startsWith('/')) {
        href = `${GEEKNEWS_BASE_URL}${href}`;
      } else if (href && !href.startsWith('http')) {
        // Handle cases where it might be missing the base URL entirely or other unexpected formats
        console.warn(`[GeekNews Scraper] Unexpected URL format found: ${href}. Attempting to resolve relative to base.`);
        // Assume it's relative to the base URL if it doesn't start with '/' or 'http'
        href = `${GEEKNEWS_BASE_URL}/${href.startsWith('/') ? '' : '/'}${href}`;
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
    // GeekNews seems to consistently show 15 items per page.
    const ITEMS_PER_PAGE = 15;
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

        // Check if we fetched fewer articles than the expected page size.
        // This is a more reliable heuristic than checking for exactly 0.
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

```

  </change>
  <change>
    <file>src/app/page.tsx</file>
    <description>Improve error handling and display in the frontend when fetching articles fails. Show more specific error messages based on the API response.</description>
    <content><![CDATA["use client";

import { useState, useEffect, useMemo } from 'react';
import type { GeekNewsArticle } from '@/services/geeknews';
import SearchBar from '@/components/SearchBar';
import ArticleCard from '@/components/ArticleCard';
import PaginationControls from '@/components/PaginationControls';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ARTICLES_PER_PAGE = 10;
const GEEKNEWS_USER_ID = 'laeyoung'; // Replace with actual user ID or make configurable

export default function Home() {
  const [allArticles, setAllArticles] = useState<GeekNewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<GeekNewsArticle[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // Controls skeleton visibility
  const [isFetching, setIsFetching] = useState(false); // Controls button disable state
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'year'
  const { toast } = useToast();

  const fetchArticles = async () => {
    setIsFetching(true); // Disable button immediately
    setError(null);
    setAllArticles([]); // Clear existing articles before fetching
    setFilteredArticles([]);
    setCurrentPage(1);
    setIsLoading(true); // Show loading skeleton

    try {
      console.log("Attempting to fetch articles from API...");
      const response = await fetch(`/api/upvoted-articles?userId=${GEEKNEWS_USER_ID}`);
      console.log("API Response Status:", response.status);

      if (!response.ok) {
         let errorData = { error: `HTTP error ${response.status}`, details: response.statusText };
         try {
           // Try to parse the error response from the API
           errorData = await response.json();
           console.error("API Error Data:", errorData);
         } catch (parseError) {
            console.error("Could not parse error response body:", parseError);
            // Use status text if JSON parsing fails
            errorData.details = response.statusText || "Unknown error";
         }
         // Construct a user-friendly message
         const message = `Failed to fetch articles. ${errorData.error || 'Server error'} ${errorData.details ? `(${errorData.details})` : ''}`;
         throw new Error(message);
      }
      const articles: GeekNewsArticle[] = await response.json();
      console.log(`Successfully fetched ${articles.length} articles.`);

      setAllArticles(articles);
      toast({
        title: "Articles Fetched",
        description: `Successfully fetched ${articles.length} upvoted articles.`,
      });
    } catch (err: any) {
      console.error("Failed to fetch articles:", err);
      const errorMessage = err.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage); // Set error state to display in the Alert component
       toast({
        variant: "destructive",
        title: "Fetch Error",
        description: errorMessage, // Show detailed error in toast as well
      });
    } finally {
      setIsLoading(false); // Hide skeleton
      setIsFetching(false); // Re-enable button
    }
  };

  // Filter articles based on search query and date filter
  useEffect(() => {
    let results = allArticles;

    // Apply search query
    if (searchQuery) {
      results = results.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter (requires article dates, which are not currently scraped)
    // This is a placeholder for where date filtering logic would go.
    // if (dateFilter !== 'all') {
    //   const now = new Date();
    //   let cutoffDate: Date;
    //   if (dateFilter === 'month') {
    //     cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
    //   } else if (dateFilter === 'year') {
    //     cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
    //   }
    //   results = results.filter(article => article.date && new Date(article.date) >= cutoffDate); // Assuming article has a 'date' field
    // }

    setFilteredArticles(results);
    setCurrentPage(1); // Reset to first page on new search/filter
  }, [searchQuery, dateFilter, allArticles]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);

  const currentArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    return filteredArticles.slice(startIndex, endIndex);
  }, [filteredArticles, currentPage]);

  const handleSearch = (query: string, filter: string) => {
    setSearchQuery(query);
    setDateFilter(filter);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
  };

  return (
    <main className="container mx-auto p-4 md:p-8 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">My GeekNews</h1>
        <p className="text-muted-foreground">Search your upvoted articles for user: <span className="font-mono">{GEEKNEWS_USER_ID}</span></p>
      </header>

      <div className="mb-6 text-center">
          <Button onClick={fetchArticles} disabled={isFetching}>
              <svg className={cn("animate-spin -ml-1 mr-3 h-5 w-5 text-white", {"hidden": !isFetching})} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isFetching ? 'Fetching Articles...' : 'Fetch/Refresh Upvoted Articles'}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">(Fetches all upvoted articles from news.hada.io)</p>
      </div>

      <SearchBar onSearch={handleSearch} isFetching={isFetching} />

      {error && (
         <Alert variant="destructive" className="mb-6">
           <AlertCircle className="h-4 w-4" /> {/* Use AlertCircle for better visual indication */}
           <AlertTitle>Error Fetching Articles</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Only show articles if there's no error */}
          {!error && filteredArticles.length > 0 && (
            <div className="transition-opacity duration-300 ease-in-out">
              {currentArticles.map((article) => (
                <ArticleCard key={article.url} article={article} />
              ))}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Initial state message or no articles found message */}
          {!isLoading && !error && allArticles.length === 0 && (
            <Alert className="mt-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>No Articles Loaded</AlertTitle>
              <AlertDescription>
                Click the 'Fetch/Refresh Upvoted Articles' button above to load your data from GeekNews.
              </AlertDescription>
            </Alert>
          )}

          {/* No results message after filtering */}
          {!isLoading && !error && allArticles.length > 0 && filteredArticles.length === 0 && (
             <Alert className="mt-6">
               <Terminal className="h-4 w-4" />
               <AlertTitle>No Matching Results</AlertTitle>
               <AlertDescription>
                 No articles match your current search query or date filter. Try adjusting your search.
               </AlertDescription>
             </Alert>
          )}
        </>
      )}
    </main>
  );
}
```

  </change>
  <change>
    <file>src/lib/utils.ts</file>
    <description>Add cn utility function from shadcn/ui if not already present.</description>
    <content><![CDATA[import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines Tailwind CSS classes with conditional class names.
 * Uses clsx for handling conditional classes and tailwind-merge for resolving conflicts.
 * @param inputs - Class values (strings, arrays, objects).
 * @returns A string of combined and merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// You can add other utility functions here if needed.
