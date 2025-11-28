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
  // Optional: Add a date field if available from the source for filtering
  // date?: string | Date;
}

// Fetching logic is now handled by the API route: /api/upvoted-articles/route.ts
