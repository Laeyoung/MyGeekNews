"use client";

import { useState, useEffect, useMemo } from 'react';
import type { GeekNewsArticle } from '@/services/geeknews';
// import { getAllUpvotedArticles } from '@/services/geeknews'; // Removed as fetching is now via API
import SearchBar from '@/components/SearchBar';
import ArticleCard from '@/components/ArticleCard';
import PaginationControls from '@/components/PaginationControls';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ARTICLES_PER_PAGE = 10;
const GEEKNEWS_USER_ID = 'laeyoung'; // Replace with actual user ID or make configurable

export default function Home() {
  const [allArticles, setAllArticles] = useState<GeekNewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<GeekNewsArticle[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // Initially not loading, triggered by button
  const [isFetching, setIsFetching] = useState(false); // For manual fetch trigger
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'year'
  const { toast } = useToast();

  const fetchArticles = async () => {
    setIsFetching(true);
    setError(null);
    setAllArticles([]); // Clear existing articles before fetching
    setFilteredArticles([]);
    setCurrentPage(1);
    setIsLoading(true); // Show loading skeleton while fetching

    try {
      const response = await fetch(`/api/upvoted-articles?userId=${GEEKNEWS_USER_ID}`);
      if (!response.ok) {
         const errorBody = await response.text();
         console.error("API Error Response:", errorBody);
         throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
      }
      const articles: GeekNewsArticle[] = await response.json();

      setAllArticles(articles);
      toast({
        title: "Articles Fetched",
        description: `Successfully fetched ${articles.length} upvoted articles.`,
      });
    } catch (err: any) {
      console.error("Failed to fetch articles:", err);
      const errorMessage = err.message || "Could not fetch articles. Please check the console or try again later.";
      setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Fetch Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setIsFetching(false);
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
    //   results = results.filter(article => new Date(article.date) >= cutoffDate); // Assuming article has a 'date' field
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
              {isFetching ? 'Fetching Articles...' : 'Fetch/Refresh Upvoted Articles'}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">(Fetches all upvoted articles from news.hada.io)</p>
      </div>

      <SearchBar onSearch={handleSearch} isFetching={isFetching} />

      {error && (
         <Alert variant="destructive" className="mb-6">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Error Fetching Articles</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {filteredArticles.length > 0 ? (
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
          ) : (
             // Show message only if not fetching and no error occurred during fetch
             !isFetching && !error && allArticles.length === 0 && (
               <Alert className="mt-6">
                 <Terminal className="h-4 w-4" />
                 <AlertTitle>No Articles Found</AlertTitle>
                 <AlertDescription>
                   {searchQuery || dateFilter !== 'all'
                      ? "No articles match your current search/filter criteria."
                      : "Click 'Fetch/Refresh Upvoted Articles' to load your data."
                   }
                 </AlertDescription>
               </Alert>
             )
          )}
          {/* Show no results message if filtering yielded no results but there are fetched articles */}
          {!isFetching && !error && allArticles.length > 0 && filteredArticles.length === 0 && (
             <Alert className="mt-6">
               <Terminal className="h-4 w-4" />
               <AlertTitle>No Matching Results</AlertTitle>
               <AlertDescription>
                 Try adjusting your search query or filters.
               </AlertDescription>
             </Alert>
          )}
        </>
      )}
    </main>
  );
}
