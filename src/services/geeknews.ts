/**
 * Represents a GeekNews article with its title and URL.
 */
export interface GeekNewsArticle {
  /**
   * The title of the GeekNews article.
   */
  title: string;
  /**
   * The URL of the GeekNews article.
   */
  url: string;
  // Optional: Add a date field if available from the source for filtering
  // date?: string | Date;
}

/**
 * Asynchronously retrieves all upvoted GeekNews articles for a given user ID.
 *
 * **Note:** This currently returns mock data. The actual implementation
 * would involve scraping https://news.hada.io/upvoted_topics?userid=...
 * which should ideally be done on a backend server to avoid CORS issues
 * and browser limitations. Scraping directly from the frontend is generally
 * not feasible or recommended.
 *
 * @param userId The GeekNews user ID (currently unused due to mock data).
 * @returns A promise that resolves to an array of GeekNewsArticle objects.
 */
export async function getAllUpvotedArticles(userId: string): Promise<GeekNewsArticle[]> {
  console.warn("Using mock data for getAllUpvotedArticles. Implement backend scraping for real data.");

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // TODO: Replace this mock data with data fetched from a backend endpoint
  // that performs the scraping of GeekNews.
  return [
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
    // Add more mock articles as needed for testing pagination
    { title: "Testing React Applications", url: "https://news.hada.io/topic/13" },
    { title: "Introduction to WebAssembly", url: "https://news.hada.io/topic/14" },
    { title: "Progressive Web Apps (PWAs)", url: "https://news.hada.io/topic/15" },
    { title: "UI/UX Design Principles", url: "https://news.hada.io/topic/16" },
    { title: "Working with Docker Containers", url: "https://news.hada.io/topic/17" },
    { title: "CI/CD Pipelines Explained", url: "https://news.hada.io/topic/18" },
    { title: "Serverless Architecture Overview", url: "https://news.hada.io/topic/19" },
    { title: "Microfrontend Strategies", url: "https://news.hada.io/topic/20" },
    { title: "Data Structures and Algorithms", url: "https://news.hada.io/topic/21" },
    { title: "Functional Programming Concepts", url: "https://news.hada.io/topic/22" },
  ];
}
