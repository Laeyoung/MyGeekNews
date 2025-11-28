"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isFetching: boolean;
}

export default function SearchBar({ onSearch, isFetching }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-card rounded-lg shadow">
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
      <div className="flex gap-4">
        <Button type="submit" disabled={isFetching}>
          {isFetching ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </form>
  );
}