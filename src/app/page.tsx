"use client";

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
import { cn } from "@/lib/utils"; // Import cn utility

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
              <svg className={cn("animate-spin -ml-1 mr-3 h-5 w-5", {"hidden": !isFetching})} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
