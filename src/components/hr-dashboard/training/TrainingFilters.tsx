"use client";

import React from "react";
import { Search, Filter } from "lucide-react";
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

const YEARS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return year;
});

export function TrainingFilters({
  filters,
  onFiltersChange,
  isLoading = false,
}: TrainingFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleTypeChange = (type: TrainingType | undefined) => {
    onFiltersChange({ ...filters, trainingType: type });
  };

  const handleYearChange = (year: number | undefined) => {
    onFiltersChange({ ...filters, year });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.search ||
    filters.trainingType ||
    filters.year ||
    filters.employeeId;

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Search</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Course title, provider..."
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={isLoading}
              className="pl-8"
            />
          </div>
        </div>

        {/* Training Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Training Type
          </label>
          <select
            value={filters.trainingType || ""}
            onChange={(e) =>
              handleTypeChange(
                e.target.value ? (e.target.value as TrainingType) : undefined
              )
            }
            disabled={isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">All Types</option>
            {TRAINING_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Year</label>
          <select
            value={filters.year || ""}
            onChange={(e) =>
              handleYearChange(
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            disabled={isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">All Years</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasActiveFilters || isLoading}
            className="w-full"
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
