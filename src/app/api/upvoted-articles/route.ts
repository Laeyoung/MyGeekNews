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
    const filePath = path.join(process.cwd(), 'geeknews_my_upvotes.json');

    if (!fs.existsSync(filePath)) {
      console.error(`[GeekNews API] File not found: ${filePath}`);
      return NextResponse.json({ error: 'Data file not found' }, { status: 404 });
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
