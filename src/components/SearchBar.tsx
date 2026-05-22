"use client";

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isFetching: boolean;
}

export default function SearchBar({ onSearch, isFetching }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3.5 py-2.5">
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        type="text"
        placeholder="제목·요약·초성으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-0 bg-transparent shadow-none p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={isFetching}
      />
      <kbd className="hidden md:inline-flex font-mono text-[11px] text-muted-foreground border border-border px-1.5 py-0.5 rounded shrink-0">
        ⌘K
      </kbd>
    </div>
  );
}
