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
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-card rounded-lg shadow">
      <div className="flex-grow relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search your upvoted articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          disabled={isFetching}
        />
      </div>
    </div>
  );
}