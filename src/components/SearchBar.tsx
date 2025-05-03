"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string, filter: string) => void;
  isFetching: boolean;
}

export default function SearchBar({ onSearch, isFetching }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'month', 'year'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, filter);
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
         <Select value={filter} onValueChange={setFilter} disabled={isFetching}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                 {/* Add more specific filters if needed */}
            </SelectContent>
         </Select>
        <Button type="submit" disabled={isFetching}>
          {isFetching ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </form>
  );
}