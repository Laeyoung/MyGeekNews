import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { GeekNewsArticle } from '@/services/geeknews';

/**
 * GET handler for the /api/upvoted-articles route.
 * Reads upvoted articles from a local JSON file.
 */
export async function GET(request: NextRequest) {
  try {
    const customPath = process.env.GEEKNEWS_DATA_PATH;

    // Check if it's a remote URL
    if (customPath && (customPath.startsWith('http://') || customPath.startsWith('https://'))) {
      try {
        console.log(`[GeekNews API] Fetching data from remote URL: ${customPath}`);
        const response = await fetch(customPath, { next: { revalidate: 60 } }); // Cache for 60 seconds

        if (!response.ok) {
          throw new Error(`Failed to fetch remote data: ${response.statusText}`);
        }

        const articles: GeekNewsArticle[] = await response.json();
        console.log(`[GeekNews API] Successfully fetched ${articles.length} articles from remote URL`);
        return NextResponse.json(articles);
      } catch (error: any) {
        console.error(`[GeekNews API] Error fetching remote data:`, error);
        return NextResponse.json({ error: 'Failed to fetch remote data', details: error.message }, { status: 500 });
      }
    }

    // Local file handling
    const filePath = customPath
      ? (path.isAbsolute(customPath) ? customPath : path.join(process.cwd(), customPath))
      : path.join(process.cwd(), 'data', 'geeknews_my_upvotes.json');

    if (!fs.existsSync(filePath)) {
      console.warn(`[GeekNews API] File not found: ${filePath}`);
      // Return empty array instead of error, so the UI can show "No Articles Loaded" state
      // or we could return a specific error code if we want the UI to prompt for scraping.
      // For now, let's return an empty list to avoid breaking the UI.
      return NextResponse.json([]);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const articles: GeekNewsArticle[] = JSON.parse(fileContent);

    console.log(`[GeekNews API] Successfully read ${articles.length} articles from ${filePath}`);
    return NextResponse.json(articles);

  } catch (error: any) {
    console.error(`[GeekNews API] Error reading data file:`, error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
