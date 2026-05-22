"use client";

import type { Category } from "@/lib/categorize";
import { CATEGORIES } from "@/lib/categorize";
import { cn } from "@/lib/utils";

interface Props {
  counts: Record<Category, number>;
  total: number;
  selected: Category | null;
  onSelect: (c: Category | null) => void;
}

export default function CategoryFilter({ counts, total, selected, onSelect }: Props) {
  return (
    <div
      className={cn(
        "sticky z-30 bg-background border-b border-border px-4 md:px-8 py-3.5",
        // top offset is the header height — adjust if header height changes.
        // header: 14 (py) + 28 (icon row) + 14 (gap to search) + 44 (search) + 14 (py) = 114 mobile
        //          20 (py) + 28          + 14              + 44              + 20 = 126 desktop
        "top-[114px] md:top-[126px]"
      )}
    >
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <Chip
          label="전체"
          count={total}
          active={selected === null}
          onClick={() => onSelect(null)}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            count={counts[c] ?? 0}
            active={selected === c}
            onClick={() => onSelect(c)}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "text-sm border whitespace-nowrap transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border hover:bg-accent"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "font-mono text-xs",
          active ? "opacity-70" : "text-muted-foreground"
        )}
      >
        {count.toLocaleString()}
      </span>
    </button>
  );
}
