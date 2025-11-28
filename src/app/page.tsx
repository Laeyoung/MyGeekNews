"use client";

import { useState, useEffect } from 'react';
import type { GeekNewsArticle } from '@/services/geeknews';
import { getUpvotedArticles } from '@/services/geeknews';
import { fuzzySearch } from '@/lib/searchUtils';
import SearchBar from '@/components/SearchBar';
import ArticleCard from '@/components/ArticleCard';
import InfiniteScrollTrigger from '@/components/InfiniteScrollTrigger';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

const ARTICLES_PER_PAGE = 20;

export default function Home() {
  const [allArticles, setAllArticles] = useState<GeekNewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<GeekNewsArticle[]>([]);
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchArticles = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const data = await getUpvotedArticles();
      setAllArticles(data);
      // Filter will be applied by the useEffect
    } catch (err: any) {
      console.error("Failed to fetch articles:", err);
      setError(err.message || "Failed to fetch articles.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch articles.",
      });
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchArticles();
  }, []);

  // Filter articles when search query changes
  useEffect(() => {
    let results = allArticles;

    if (searchQuery) {
      results = results.filter(article =>
        fuzzySearch(article.title, searchQuery) ||
        (article.description && fuzzySearch(article.description, searchQuery))
      );
    }

    setFilteredArticles(results);
    setVisibleCount(ARTICLES_PER_PAGE);
  }, [searchQuery, allArticles]);

  const loadMore = () => {
    setVisibleCount(prev => prev + ARTICLES_PER_PAGE);
  };

  const displayedArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <main className="container mx-auto p-4 md:p-8 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">My GeekNews Upvotes</h1>
        <p className="text-muted-foreground">Search your upvoted articles</p>
      </header>

      <SearchBar onSearch={handleSearch} isFetching={isFetching} />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
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
          {!error && filteredArticles.length > 0 && (
            <div className="transition-opacity duration-300 ease-in-out">
              <div className="flex flex-col gap-4">
                {displayedArticles.map((article) => (
                  <ArticleCard key={article.url} article={article} />
                ))}
              </div>

              <InfiniteScrollTrigger
                onIntersect={loadMore}
                isLoading={false}
                hasMore={hasMore}
              />
            </div>
          )}

          {!isLoading && !error && allArticles.length === 0 && (
            <Alert className="mt-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>No Articles Loaded</AlertTitle>
              <AlertDescription>
                No articles loaded. Please check the data file.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && allArticles.length > 0 && filteredArticles.length === 0 && (
            <Alert className="mt-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>No Matching Results</AlertTitle>
              <AlertDescription>
                No articles match your current search query. Try adjusting your search.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </main>
  );
}
