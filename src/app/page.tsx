"use client";

import { useState, useEffect, useMemo } from 'react';
import type { GeekNewsArticle } from '@/services/geeknews';
import { getUpvotedArticles } from '@/services/geeknews';
import { fuzzySearch } from '@/lib/searchUtils';
import { categorizeAll, type Category } from '@/lib/categorize';
import SearchBar from '@/components/SearchBar';
import ArticleCard from '@/components/ArticleCard';
import CategoryFilter from '@/components/CategoryFilter';
import InfiniteScrollTrigger from '@/components/InfiniteScrollTrigger';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle, Github, MoonStar } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

const ARTICLES_PER_PAGE = 20;

export default function Home() {
  const [allArticles, setAllArticles] = useState<GeekNewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<(GeekNewsArticle & { category?: string })[]>([]);
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const fetchArticles = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const data = await getUpvotedArticles();
      setAllArticles(data);
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

  useEffect(() => {
    setIsLoading(true);
    fetchArticles();
  }, []);

  const { items: categorized, counts } = useMemo(
    () => categorizeAll(allArticles),
    [allArticles]
  );

  useEffect(() => {
    let results: (GeekNewsArticle & { category?: string })[] = categorized;

    if (selectedCategory) {
      results = results.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery) {
      results = results.filter(article =>
        fuzzySearch(article.title, searchQuery) ||
        (article.description && fuzzySearch(article.description, searchQuery))
      );
    }

    setFilteredArticles(results);
    setVisibleCount(ARTICLES_PER_PAGE);
  }, [searchQuery, selectedCategory, categorized]);

  const loadMore = () => {
    setVisibleCount(prev => prev + ARTICLES_PER_PAGE);
  };

  const displayedArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 bg-background/92 backdrop-blur border-b border-border px-4 py-3.5 md:px-8 md:py-5">
        <div className="max-w-[760px] mx-auto">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="text-[17px] font-bold tracking-tight">geeknews</span>
            <span className="text-[#b8552d]">/</span>
            <span className="font-mono text-[13px] text-muted-foreground">upvotes</span>
            <span className="flex-1" />
            {allArticles.length > 0 && (
              <span className="hidden md:inline font-mono text-xs text-muted-foreground">
                {allArticles.length.toLocaleString()} 글
              </span>
            )}
            <button
              type="button"
              aria-label="Toggle theme"
              className="w-7 h-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoonStar className="h-4 w-4" />
            </button>
            <a
              href="https://github.com/Laeyoung/MyGeekNews"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
          <SearchBar onSearch={handleSearch} isFetching={isFetching} />
        </div>
      </header>

      <CategoryFilter
        counts={counts}
        total={allArticles.length}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="max-w-[760px] mx-auto px-4 md:px-14 py-10 pb-20">
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
              <Skeleton key={i} className="h-[84px] w-full" />
            ))}
          </div>
        ) : (
          <>
            {!error && filteredArticles.length > 0 && (
              <div className="transition-opacity duration-300 ease-in-out">
                <div className="flex flex-col">
                  {displayedArticles.map((article, i) => {
                    const prev = i > 0 ? displayedArticles[i - 1] : null;
                    const showDivider = !prev || prev.date !== article.date;
                    return (
                      <div key={article.url}>
                        {showDivider && article.date && (
                          <div className="flex items-center gap-3 pt-[22px] pb-2.5">
                            <span className="font-mono text-[11.5px] tracking-[.08em] uppercase text-primary">
                              {formatKDate(article.date)}
                            </span>
                            <span className="flex-1 h-px bg-border" />
                          </div>
                        )}
                        <ArticleCard article={article} />
                      </div>
                    );
                  })}
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
      </div>
    </main>
  );
}

function formatKDate(d: string): string {
  const date = new Date(d + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 · ${days[date.getDay()]}`;
}
