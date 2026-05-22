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

  const topicId = article.url.match(/[?&]id=(\d+)/)?.[1] ?? article.url.replace(/\W+/g, '-');
  const headingId = `article-${topicId}`;

  const { category } = categorize(article);

  return (
    <article aria-labelledby={headingId}>
      <a
        href={absoluteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block py-4 border-b border-[#efe9da] no-underline text-foreground cursor-pointer hover:bg-accent/40 transition-colors"
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
          <span className="text-[#c8bea7]">·</span>
          <span>{topicId}</span>
          <span className="flex-1" />
          <span className="font-serif italic text-primary">읽기 →</span>
        </div>
      </a>
    </article>
  );
}
