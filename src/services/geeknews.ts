/**
 * Represents a GeekNews article with its title and URL.
 */
export interface GeekNewsArticle {
  /**
   * The title of the GeekNews article.
   */
  title: string;
  /**
   * The URL of the GeekNews article. URLs might be relative, ensure they are resolved correctly.
   */
  url: string;
  /**
   * The description or summary of the article.
   */
  description?: string;
  /**
   * The date the article was posted (YYYY-MM-DD format).
   */
  date?: string | null;
  /**
   * Persisted category from categorize_llm.py batch run, if any.
   * If absent, derived at runtime via categorize() in src/lib/categorize.ts.
   */
  category?: string | null;
  /** Free-form keyword tags from the LLM (1-3 items). Used for display. */
  tags?: string[];
  /** "rule" | "llm" — debug only. */
  category_source?: "rule" | "llm";
}

// Fetching logic is now handled by the API route: /api/upvoted-articles/route.ts

export async function getUpvotedArticles(): Promise<GeekNewsArticle[]> {
  const response = await fetch('/api/upvoted-articles');
  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`);
  }
  return response.json();
}
