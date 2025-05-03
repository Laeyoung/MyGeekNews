"use client";

import { useState, useEffect, useMemo } from 'react';
import type { GeekNewsArticle } from '@/services/geeknews';
import { getAllUpvotedArticles } from '@/services/geeknews';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // For manual fetch trigger
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'year'
  const { toast } = useToast();

  const fetchArticles = async () => {
    setIsFetching(true);
    setError(null);
    try {
      // Simulate fetching - replace with actual call to getAllUpvotedArticles
      // In a real app, this would likely fetch from a backend that has scraped the data.
      // For this frontend-only example, we'll use the mock data directly.
      // const articles = await getAllUpvotedArticles(GEEKNEWS_USER_ID);

      // Using mock data for now as scraping isn't implemented here
       const articles: GeekNewsArticle[] = [
        { title: "Introduction to Next.js 14", url: "https://news.hada.io/topic/1" },
        { title: "Advanced React Patterns", url: "https://news.hada.io/topic/2" },
        { title: "State Management with Zustand", url: "https://news.hada.io/topic/3" },
        { title: "Building Performant Web Apps", url: "https://news.hada.io/topic/4" },
        { title: "Understanding Server Components", url: "https://news.hada.io/topic/5" },
        { title: "CSS Tricks for Modern Layouts", url: "https://news.hada.io/topic/6" },
        { title: "Database Optimization Techniques", url: "https://news.hada.io/topic/7" },
        { title: "Web Security Fundamentals", url: "https://news.hada.io/topic/8" },
        { title: "Deploying Apps with Vercel", url: "https://news.hada.io/topic/9" },
        { title: "GraphQL vs REST APIs", url: "https://news.hada.io/topic/10" },
        { title: "The Rise of AI in Development", url: "https://news.hada.io/topic/11" },
        { title: "Mastering TypeScript Generics", url: "https://news.hada.io/topic/12" },
      ];

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));


      setAllArticles(articles);
      toast({
        title: "Articles Fetched",
        description: `Successfully fetched ${articles.length} upvoted articles.`,
      });
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      setError("Failed to fetch articles. Please try again later.");
       toast({
        variant: "destructive",
        title: "Fetch Error",
        description: "Could not fetch articles.",
      });
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  // Initial fetch on component mount (or trigger manually)
   useEffect(() => {
    // In a real app, you might check local storage or fetch on button click
    // fetchArticles();
    // For now, load mock data immediately
    setIsLoading(true);
    const articles: GeekNewsArticle[] = [
        { title: "Introduction to Next.js 14", url: "https://news.hada.io/topic/1" },
        { title: "Advanced React Patterns", url: "https://news.hada.io/topic/2" },
        { title: "State Management with Zustand", url: "https://news.hada.io/topic/3" },
        { title: "Building Performant Web Apps", url: "https://news.hada.io/topic/4" },
        { title: "Understanding Server Components", url: "https://news.hada.io/topic/5" },
        { title: "CSS Tricks for Modern Layouts", url: "https://news.hada.io/topic/6" },
        { title: "Database Optimization Techniques", url: "https://news.hada.io/topic/7" },
        { title: "Web Security Fundamentals", url: "https://news.hada.io/topic/8" },
        { title: "Deploying Apps with Vercel", url: "https://news.hada.io/topic/9" },
        { title: "GraphQL vs REST APIs", url: "https://news.hada.io/topic/10" },
        { title: "The Rise of AI in Development", url: "https://news.hada.io/topic/11" },
        { title: "Mastering TypeScript Generics", url: "https://news.hada.io/topic/12" },
      ];
    setAllArticles(articles);
    setIsLoading(false);
   }, []);

  // Filter articles based on search query and date filter
  useEffect(() => {
    let results = allArticles;

    // Apply search query
    if (searchQuery) {
      results = results.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter (requires article dates, which are not in the mock data)
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
        <p className="text-muted-foreground">Search your upvoted articles</p>
      </header>

      {/* Manual Fetch Button - Remove if fetching automatically */}
      <div className="mb-6 text-center">
          <Button onClick={fetchArticles} disabled={isFetching}>
              {isFetching ? 'Fetching Articles...' : 'Fetch/Refresh Upvoted Articles'}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">(Manual trigger for fetching data)</p>
      </div>

      <SearchBar onSearch={handleSearch} isFetching={isFetching} />

      {error && (
         <Alert variant="destructive" className="mb-6">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
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
             <Alert className="mt-6">
               <Terminal className="h-4 w-4" />
               <AlertTitle>No Results Found</AlertTitle>
               <AlertDescription>
                 {allArticles.length === 0 && !isFetching ? "No articles fetched yet. Click 'Fetch/Refresh Upvoted Articles'." : "Try adjusting your search query or filters."}
               </AlertDescription>
             </Alert>
          )}
        </>
      )}
    </main>
  );
}
