/**
 * Filter utilities for searching and filtering collections.
 * Used across all HR modules to maintain consistent filter behavior.
 */

export interface FilterConfig<T extends Record<string, unknown>> {
  searchFields: (keyof T)[];
  filters: Record<string, string | number | "all">;
  filterFields: Record<string, keyof T>;
}

/**
 * Generic filter builder supporting search and categorical filtering.
 * Reduces duplicate filter logic across 14+ HR modules.
 *
 * @example
 * const filtered = filterItems(documents, "contract", {
 *   searchFields: ["name", "description"],
 *   filters: { category: "contracts", status: "active" },
 *   filterFields: { category: "category", status: "status" }
 * });
 */
export function filterItems<T extends Record<string, unknown>>(
  items: T[],
  searchTerm: string,
  config: FilterConfig<T>
): T[] {
  const lowerSearchTerm = searchTerm.toLowerCase();

  return items.filter((item) => {
    const matchesSearch = config.searchFields.some((field) =>
      String(item[field]).toLowerCase().includes(lowerSearchTerm)
    );

    const matchesFilters = Object.entries(config.filters).every(
      ([filterName, filterValue]) => {
        const field = config.filterFields[filterName];
        if (!field) return true;
        return filterValue === "all" || item[field] === filterValue;
      }
    );

    return matchesSearch && matchesFilters;
  });
}

/**
 * Filter items by multiple criteria with AND logic.
 * Useful when filter values can be arrays or require custom comparison.
 */
export function filterItemsByMultipleCriteria<
  T extends Record<string, unknown>,
>(items: T[], predicates: Array<(item: T) => boolean>): T[] {
  return items.filter((item) =>
    predicates.every((predicate) => predicate(item))
  );
}

/**
 * Sort collection by field, supporting nested properties.
 * @param field - Property name or "none" to skip sorting
 * @param direction - "asc" or "desc"
 */
export function sortItems<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T | "none",
  direction: "asc" | "desc" = "asc"
): T[] {
  if (field === "none") return items;

  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    if (aValue == null || bValue == null) return 0;

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return direction === "asc" ? comparison : -comparison;
  });
}

/**
 * Search items across multiple fields, supporting partial matching.
 */
export function searchItems<T extends Record<string, unknown>>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  caseSensitive = false
): T[] {
  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  return items.filter((item) =>
    searchFields.some((field) => {
      const value = String(item[field]);
      const searchValue = caseSensitive ? value : value.toLowerCase();
      return searchValue.includes(term);
    })
  );
}

/**
 * Group items by a field value.
 * @returns Map of field value → items with that value
 */
export function groupByField<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): Map<unknown, T[]> {
  const grouped = new Map<unknown, T[]>();

  items.forEach((item) => {
    const key = item[field];
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  return grouped;
}

/**
 * Count items by a field value.
 * @returns Record of field value → count
 */
export function countByField<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): Record<string, number> {
  const counts: Record<string, number> = {};

  items.forEach((item) => {
    const key = String(item[field]);
    counts[key] = (counts[key] ?? 0) + 1;
  });

  return counts;
}

/**
 * Filter items with expiration date check.
 * Common pattern in Documents, Vacations, Benefits modules.
 */
export function filterByExpiration<
  T extends Record<string, unknown> & { expiryDate?: string },
>(
  items: T[],
  expirationFilter: "all" | "expiring_soon" | "expired" | "valid"
): T[] {
  if (expirationFilter === "all") return items;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return items.filter((item) => {
    if (!item.expiryDate) return expirationFilter !== "expired";

    const expiryDate = new Date(item.expiryDate);

    switch (expirationFilter) {
      case "expiring_soon":
        return expiryDate > now && expiryDate <= thirtyDaysFromNow;
      case "expired":
        return expiryDate < now;
      case "valid":
        return expiryDate > now;
      default:
        return true;
    }
  });
}

/**
 * Filter items by status, supporting status arrays or single values.
 * Common in all status-tracking modules.
 */
export function filterByStatus<
  T extends Record<string, unknown> & { status: string | string[] },
>(items: T[], allowedStatuses: string[]): T[] {
  return items.filter((item) => {
    const itemStatus = Array.isArray(item.status) ? item.status : [item.status];
    return itemStatus.some((s) => allowedStatuses.includes(s));
  });
}
