"use client";

import type { GeekNewsArticle } from '@/services/geeknews';
import { categorize } from "@/lib/categorize";

interface ArticleCardProps {
  article: GeekNewsArticle;
}

const GEEKNEWS_BASE_URL = 'https://news.hada.io';

export default function ArticleCard({ article }: ArticleCardProps) {
  const absoluteUrl = article.url.startsWith('http')
    ? article.url
    : `${GEEKNEWS_BASE_URL}${article.url.startsWith('/') ? '' : '/'}${article.url}`;

  const topicIdMatch = article.url.match(/[?&]id=(\d+)/)?.[1];
  const topicId = topicIdMatch ?? article.url.replace(/\W+/g, '-');
  const headingId = `article-${topicId}`;

  // Prefer pre-computed category attached by categorizeAll() upstream;
  // fall back to running rules here if a bare GeekNewsArticle was passed in.
  const category = article.category ?? categorize(article).category;

  return (
    <article aria-labelledby={headingId}>
      <a
        href={absoluteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block py-4 border-b border-[#efe9da] no-underline text-foreground cursor-pointer hover:bg-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
      >
        <h2
          id={headingId}
          className="text-base md:text-lg font-semibold leading-snug tracking-[-0.005em] m-0"
        >
          {article.title}
        </h2>
        {article.description && (
          <p className="text-sm text-[#5d5447] leading-relaxed mt-1.5 line-clamp-2 m-0">
            {article.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2.5 font-mono text-[11.5px] text-muted-foreground">
          <span className="font-mono text-[10.5px] tracking-[.08em] uppercase text-[#5d5447] border border-border bg-card px-1.5 py-0.5 rounded-[3px]">
            {category}
          </span>
          {topicIdMatch && (
            <>
              <span aria-hidden="true" className="text-[#c8bea7]">·</span>
              <span aria-hidden="true">{topicIdMatch}</span>
            </>
          )}
          <span className="flex-1" />
          <span aria-hidden="true" className="font-serif italic text-primary">읽기 →</span>
        </div>
      </a>
    </article>
  );
}
