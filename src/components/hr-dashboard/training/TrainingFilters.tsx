"use client";

import React, { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/hr-dashboard/ui/input";
import { Button } from "@/components/hr-dashboard/ui/button";
import type { TrainingEntryFilters, TrainingType } from "@/types/training";

interface TrainingFiltersProps {
  filters: TrainingEntryFilters;
  onFiltersChange: (filters: TrainingEntryFilters) => void;
  isLoading?: boolean;
}

const TRAINING_TYPES: { value: TrainingType; label: string }[] = [
  { value: "course", label: "Course" },
  { value: "workshop", label: "Workshop" },
  { value: "conference", label: "Conference" },
  { value: "certification", label: "Certification" },
  { value: "seminar", label: "Seminar" },
  { value: "other", label: "Other" },
];

const YEARS = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() - i
);

export function TrainingFilters({
  filters,
  onFiltersChange,
  isLoading = false,
}: TrainingFiltersProps) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [searchValue, setSearchValue] = useState(filters.search || "");

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, 300);
  };

  const handleTypeChange = (type: TrainingType | undefined) => {
    onFiltersChange({ ...filters, trainingType: type });
  };

  const handleYearChange = (year: number | undefined) => {
    onFiltersChange({ ...filters, year });
  };

  const handleReset = () => {
    setSearchValue("");
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.search ||
    filters.trainingType ||
    filters.year ||
    filters.employeeId;

  const selectCls =
    "rounded-md border border-input bg-white px-3 py-[7px] text-sm text-gray-800 focus:outline-none disabled:opacity-50 cursor-pointer";

  return (
    <div className="flex flex-1 items-center gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by title, provider, employee…"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-9 pl-9 text-sm text-gray-900"
        />
      </div>

      {/* Type filter */}
      <select
        value={filters.trainingType || ""}
        onChange={(e) =>
          handleTypeChange(
            e.target.value ? (e.target.value as TrainingType) : undefined
          )
        }
        disabled={isLoading}
        className={selectCls}
        style={{ minWidth: 130 }}
      >
        <option value="">All types</option>
        {TRAINING_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {/* Year filter */}
      <select
        value={filters.year || ""}
        onChange={(e) =>
          handleYearChange(
            e.target.value ? parseInt(e.target.value) : undefined
          )
        }
        disabled={isLoading}
        className={selectCls}
        style={{ minWidth: 110 }}
      >
        <option value="">All years</option>
        {YEARS.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      {/* Reset */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isLoading}
          className="h-9 gap-1.5 text-gray-500 hover:text-gray-800"
        >
          <X className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
