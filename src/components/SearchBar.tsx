"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isFetching: boolean;
}

export default function SearchBar({ onSearch, isFetching }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isMac, setIsMac] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
      <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
      <Input
        ref={inputRef}
        type="text"
        aria-label="검색"
        aria-keyshortcuts="Meta+k Control+k"
        placeholder="제목·요약·초성으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-0 bg-transparent shadow-none p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={isFetching}
      />
      {isMac !== null && (
        <kbd className="hidden md:inline-flex font-mono text-[11px] text-muted-foreground border border-border px-1.5 py-0.5 rounded shrink-0">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      )}
    </div>
  );
}
