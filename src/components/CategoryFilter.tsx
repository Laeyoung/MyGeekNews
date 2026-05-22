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
    <div className="bg-background border-b border-border px-4 md:px-8 py-3.5">
      <div
        className="max-w-[760px] mx-auto"
        style={{
          maskImage: "linear-gradient(to right, black calc(100% - 36px), transparent)",
          WebkitMaskImage: "linear-gradient(to right, black calc(100% - 36px), transparent)",
        }}
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
      aria-pressed={active}
      aria-label={`${label} ${count.toLocaleString()}개`}
      onFocus={(e) =>
        e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })
      }
      className={cn(
        "flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "text-sm border whitespace-nowrap transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border hover:bg-accent"
      )}
    >
      <span aria-hidden="true">{label}</span>
      <span
        aria-hidden="true"
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
