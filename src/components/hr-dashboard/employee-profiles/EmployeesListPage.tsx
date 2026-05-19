import { Search, Users } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { Button } from "../ui/button";
import { EmployeesListHeader } from "./EmployeesListHeader";
import { EmployeesListToolbar } from "./EmployeesListToolbar";
import { EmployeesListGrid } from "./EmployeesListGrid";
import { EmployeesListTable } from "./EmployeesListTable";
import { EmptyState, Pagination, SkeletonCard, SkeletonRow } from "./atoms";
import { useEmployeesListView } from "./useEmployeesListView";
import { uniqueDepartments } from "./employeesListHelpers";
import type { EmployeesListFilters } from "./employeesListHelpers";
import { useAvatarsReady } from "./useAvatarsReady";

export interface EmployeesExportContext {
  filteredEmployees: EmployeeProfileData[];
  search: string;
  filters: EmployeesListFilters;
  activeFilterCount: number;
}

interface EmployeesListPageProps {
  employees: EmployeeProfileData[];
  isLoading?: boolean;
  canEditAll?: boolean;
  canAdd?: boolean;
  canExport?: boolean;
  onOpenEmployee: (
    employee: EmployeeProfileData,
    mode: "view" | "edit"
  ) => void;
  onAdd?: () => void;
  onExport?: (context: EmployeesExportContext) => void;
}

/**
 * Top-level employees list page. Self-contained — owns view/search/filter/page
 * state via `useEmployeesListView`. Wire into ProfilesModule by passing the
 * employees array + permission flags + open handler.
 */
export function EmployeesListPage({
  employees,
  isLoading = false,
  canEditAll,
  canAdd = true,
  canExport = true,
  onOpenEmployee,
  onAdd,
  onExport,
}: EmployeesListPageProps) {
  const v = useEmployeesListView({ employees });
  const departments = uniqueDepartments(employees);
  const avatarsReady = useAvatarsReady(employees);
  // Treat the view as "loading" until both the data fetch and the avatar
  // pre-load batch finish — keeps cards from popping in without pictures.
  const effectiveLoading = isLoading || !avatarsReady;
  const showToolbar = effectiveLoading || employees.length > 0;
  const noResults =
    !effectiveLoading && employees.length > 0 && v.filtered.length === 0;
  const showPagination =
    !effectiveLoading && !noResults && v.filtered.length > 0;

  return (
    <section className="ep-scope flex h-full min-h-0 w-full flex-1 flex-col bg-[#f7f7f6] px-8 pt-10 pb-7">
      <EmployeesListHeader
        count={employees.length}
        canAdd={canAdd}
        canExport={canExport}
        onAdd={onAdd}
        onExport={() =>
          onExport?.({
            filteredEmployees: v.filtered,
            search: v.search,
            filters: v.filters,
            activeFilterCount: v.activeFilterCount,
          })
        }
      />

      {showToolbar ? (
        <EmployeesListToolbar
          search={v.search}
          onSearch={v.setSearch}
          view={v.view}
          onView={v.setView}
          filters={v.filters}
          onFilter={v.setFilter}
          onClearAll={v.resetFilters}
          departments={departments}
          resultCount={v.filtered.length}
          totalCount={employees.length}
          activeFilterCount={v.activeFilterCount}
        />
      ) : null}

      <div className="min-h-[300px]">
        {effectiveLoading ? (
          v.view === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
              <SkeletonCard count={8} />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <tbody>
                  <SkeletonRow cols={6} rows={8} />
                </tbody>
              </table>
            </div>
          )
        ) : employees.length === 0 ? (
          <EmptyState
            icon={<Users size={36} aria-hidden />}
            title="No employees yet"
            description="Add your first employee to start building your team directory."
            actions={
              canAdd ? (
                <Button onClick={onAdd} className="gap-1.5">
                  Add first employee
                </Button>
              ) : null
            }
          />
        ) : noResults ? (
          <EmptyState
            icon={<Search size={32} aria-hidden />}
            title="No matches found"
            description="We couldn't find anyone matching your search or filters."
            actions={
              <Button variant="outline" onClick={v.resetFilters}>
                Clear search & filters
              </Button>
            }
          />
        ) : v.view === "grid" ? (
          <EmployeesListGrid employees={v.paged} onOpen={onOpenEmployee} />
        ) : (
          <EmployeesListTable
            employees={v.paged}
            onOpen={onOpenEmployee}
            canEditAll={canEditAll}
          />
        )}
      </div>

      {showPagination ? (
        <Pagination
          page={v.page}
          pageCount={v.pageCount}
          totalLabel={`Showing ${(v.page - 1) * v.perPage + 1}–${Math.min(v.page * v.perPage, v.filtered.length)} of ${v.filtered.length}`}
          onChange={v.setPage}
        />
      ) : null}
    </section>
  );
}
