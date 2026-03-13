"use client";

import type { GeekNewsArticle } from '@/services/geeknews';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ExternalLink, Calendar } from "lucide-react";

interface ArticleCardProps {
  article: GeekNewsArticle;
}

const GEEKNEWS_BASE_URL = 'https://news.hada.io';

export default function ArticleCard({ article }: ArticleCardProps) {
  // Ensure URL is absolute
  const absoluteUrl = article.url.startsWith('http')
    ? article.url
    : `${GEEKNEWS_BASE_URL}${article.url.startsWith('/') ? '' : '/'}${article.url}`;

  const topicId = article.url.match(/[?&]id=(\d+)/)?.[1] ?? article.url.replace(/\W+/g, '-');
  const headingId = `article-${topicId}`;

  return (
    <article aria-labelledby={headingId}>
    <a href={absoluteUrl} target="_blank" rel="noopener noreferrer" className="block">
      <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 hover:bg-accent/50 cursor-pointer">
        <CardHeader className="pb-2">
          <h2 id={headingId} className="text-lg font-semibold leading-none tracking-tight">{article.title}</h2>
          {article.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
              {article.description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center text-sm text-primary">
              View Original <ExternalLink className="ml-1 h-4 w-4" />
            </div>
            {article.date && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-3.5 w-3.5" />
                {article.date}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
    </article>
  );
}
