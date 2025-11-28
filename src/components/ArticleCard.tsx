"use client";

import type { GeekNewsArticle } from '@/services/geeknews';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ArticleCardProps {
  article: GeekNewsArticle;
}

const GEEKNEWS_BASE_URL = 'https://news.hada.io';

export default function ArticleCard({ article }: ArticleCardProps) {
  // Ensure URL is absolute
  const absoluteUrl = article.url.startsWith('http')
    ? article.url
    : `${GEEKNEWS_BASE_URL}${article.url.startsWith('/') ? '' : '/'}${article.url}`;

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{article.title}</CardTitle>
        {article.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {article.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Button
          variant="link"
          asChild
          className="p-0 h-auto text-primary hover:underline"
        >
          <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">
            View Original <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
