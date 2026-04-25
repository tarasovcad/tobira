"use client";

import {Select, SelectItem, SelectPopup, SelectTrigger} from "@/components/ui/coss/select";

import type {TypeFilter, SortMode} from "@/features/home/types";

function getTypeLabel(value: TypeFilter) {
  switch (value) {
    case "website":
      return "Websites";
    case "media":
      return "Media";
    case "post":
      return "Posts";
  }
}

function getSortLabel(value: SortMode) {
  switch (value) {
    case "recent":
      return "Sort: Recent";
    case "oldest":
      return "Sort: Oldest";
    case "az":
      return "Sort: A–Z";
  }
}

export function TypeSelect({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TypeFilter)}>
      <SelectTrigger aria-label="Filter by type" size="sm" className="min-w-36 rounded-md">
        <span className="text-muted-foreground sr-only">Filter by type</span>
        <span className="flex-1 truncate">{getTypeLabel(value)}</span>
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="website">Websites</SelectItem>
        <SelectItem value="media">Media</SelectItem>
        <SelectItem value="post">Posts</SelectItem>
        <SelectItem value="videos" disabled>
          Videos
        </SelectItem>
        <SelectItem value="documents" disabled>
          Documents
        </SelectItem>
        <SelectItem value="notes" disabled>
          Notes
        </SelectItem>
        <SelectItem value="people" disabled>
          People
        </SelectItem>
      </SelectPopup>
    </Select>
  );
}

export function SortSelect({value, onChange}: {value: SortMode; onChange: (v: SortMode) => void}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortMode)}>
      <SelectTrigger aria-label="Sort" size="sm" className="min-w-40 rounded-md">
        <span className="text-muted-foreground sr-only">Sort</span>
        <span className="flex-1 truncate">{getSortLabel(value)}</span>
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="recent">Sort: Recent</SelectItem>
        <SelectItem value="oldest">Sort: Oldest</SelectItem>
        <SelectItem value="az">Sort: A–Z</SelectItem>
      </SelectPopup>
    </Select>
  );
}
