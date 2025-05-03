"use client";

import type { GeekNewsArticle } from '@/services/geeknews';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ArticleCardProps {
  article: GeekNewsArticle;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{article.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="link"
          asChild
          className="p-0 h-auto text-primary hover:underline"
        >
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            View Original <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}