import { useEffect, useMemo, useState } from "react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import {
  applyEmployeesListPipeline,
  DEFAULT_EMPLOYEES_LIST_FILTERS,
  type EmployeesListFilters,
  paginate,
} from "./employeesListHelpers";
import type { ProfilesListView } from "./atoms/ViewToggle";

interface UseEmployeesListViewOptions {
  employees: EmployeeProfileData[];
  perPage?: number;
}

interface UseEmployeesListViewResult {
  view: ProfilesListView;
  setView: (v: ProfilesListView) => void;
  search: string;
  setSearch: (v: string) => void;
  filters: EmployeesListFilters;
  setFilter: <K extends keyof EmployeesListFilters>(
    key: K,
    value: EmployeesListFilters[K]
  ) => void;
  resetFilters: () => void;
  filtered: EmployeeProfileData[];
  paged: EmployeeProfileData[];
  page: number;
  setPage: (p: number) => void;
  perPage: number;
  pageCount: number;
  activeFilterCount: number;
}

/** Encapsulates list-view UI state: view/search/filter/sort/page. */
export function useEmployeesListView({
  employees,
  perPage = 12,
}: UseEmployeesListViewOptions): UseEmployeesListViewResult {
  const [view, setView] = useState<ProfilesListView>("grid");
  const [search, setSearchRaw] = useState("");
  const [filters, setFilters] = useState<EmployeesListFilters>(
    DEFAULT_EMPLOYEES_LIST_FILTERS
  );
  const [page, setPage] = useState(1);

  const setSearch = (v: string) => {
    setSearchRaw(v);
    setPage(1);
  };
  const setFilter: UseEmployeesListViewResult["setFilter"] = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const resetFilters = () => {
    setSearchRaw("");
    setFilters(DEFAULT_EMPLOYEES_LIST_FILTERS);
    setPage(1);
  };

  const filtered = useMemo(
    () => applyEmployeesListPipeline(employees, search, filters),
    [employees, search, filters]
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(
    () => paginate(filtered, page, perPage),
    [filtered, page, perPage]
  );

  // Snap page back into range when filters shrink the dataset.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const activeFilterCount =
    (search ? 1 : 0) +
    (filters.department !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0);

  return {
    view,
    setView,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    filtered,
    paged,
    page,
    setPage,
    perPage,
    pageCount,
    activeFilterCount,
  };
}
