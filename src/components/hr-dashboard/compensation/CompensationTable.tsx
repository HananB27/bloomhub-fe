"use client";

import type {
  CompensationEmployee,
  CompensationStatus,
} from "@/lib/api/compensation";
import { AVATAR_PALETTE, getInitials } from "./avatarPalette";

export type SortKey =
  | "name"
  | "dept"
  | "salary"
  | "bonus"
  | "last"
  | "next"
  | "status";
export type SortDir = "asc" | "desc";

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface CompensationTableProps {
  rows: CompensationEmployee[];
  sort: SortState;
  onSort: (next: SortState) => void;
  onOpenEmployee?: (employeeId: number) => void;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Employee" },
  { key: "dept", label: "Department" },
  { key: "salary", label: "Base salary" },
  { key: "bonus", label: "Bonus %" },
  { key: "last", label: "Last review" },
  { key: "next", label: "Next review" },
  { key: "status", label: "Status" },
];

const STATUS_STYLES: Record<
  CompensationStatus,
  { bg: string; fg: string; dot: string; label: string }
> = {
  Active: {
    bg: "bg-[#f0fdf4]",
    fg: "text-[#16a34a]",
    dot: "bg-[#16a34a]",
    label: "Active",
  },
  OnLeave: {
    bg: "bg-[#fef2f2]",
    fg: "text-[#dc2626]",
    dot: "bg-[#dc2626]",
    label: "On Leave",
  },
  PTO: {
    bg: "bg-[#fffbeb]",
    fg: "text-[#b45309]",
    dot: "bg-[#d97706]",
    label: "PTO",
  },
};

function fmtBam(n: number): string {
  return `BAM ${n.toLocaleString("en-US")}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: key === "salary" || key === "bonus" ? "desc" : "asc" };
}

export function CompensationTable({
  rows,
  sort,
  onSort,
  onOpenEmployee,
}: CompensationTableProps) {
  return (
    <div
      className="comp-rise overflow-hidden rounded-b-xl border border-[#e5e7eb] bg-white"
      style={{ animationDelay: "420ms" }}
    >
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const active = sort.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`sticky top-0 z-[2] cursor-pointer select-none whitespace-nowrap border-b border-[#e5e7eb] bg-[#fafaf9] px-3.5 py-[11px] text-left text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                      active
                        ? "text-[#171717]"
                        : "text-[#6b7280] hover:text-[#171717]"
                    }`}
                    onClick={() => onSort(nextSort(sort, col.key))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSort(nextSort(sort, col.key));
                      }
                    }}
                    tabIndex={0}
                    aria-sort={
                      active
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    {col.label}
                    <span
                      className={`ml-1 inline-flex align-middle transition-transform ${
                        active ? "opacity-100" : "opacity-50 text-[#6b7280]"
                      } ${active && sort.dir === "asc" ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="currentColor"
                      >
                        <path d="M5 7L1.5 3h7z" />
                      </svg>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-9 py-9 text-center text-[13px] text-[#6b7280]"
                >
                  No employees match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const avatar = AVATAR_PALETTE[row.color] ?? AVATAR_PALETTE.gray;
                const status = STATUS_STYLES[row.status];
                return (
                  <tr key={row.id} className="hover:bg-[#fafaf9]">
                    <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] align-middle text-[13px]">
                      <button
                        type="button"
                        onClick={() => onOpenEmployee?.(row.id)}
                        disabled={!onOpenEmployee}
                        className="flex w-full items-center gap-2.5 text-left transition-colors enabled:hover:text-[#2563eb] disabled:cursor-default"
                      >
                        <div
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11.5px] font-semibold"
                          style={{ background: avatar.bg, color: avatar.fg }}
                          aria-hidden
                        >
                          {getInitials(row.name)}
                        </div>
                        <div className="min-w-0 leading-[1.2]">
                          <div className="truncate text-[13px] font-semibold text-[#171717]">
                            {row.name}
                          </div>
                          <div className="truncate text-[11px] text-[#6b7280]">
                            {row.title}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] align-middle text-[13px] text-[#6b7280]">
                      {row.dept}
                    </td>
                    <td className="comp-mono border-b border-[#e5e7eb] px-3.5 py-[11px] align-middle text-[13px] font-medium text-[#171717]">
                      {fmtBam(row.salary)}
                    </td>
                    <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] align-middle text-[13px]">
                      <span className="comp-mono inline-block rounded bg-[#f3f4f6] px-1.5 py-px text-[11.5px] font-medium text-[#171717]">
                        {row.bonus}%
                      </span>
                    </td>
                    <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] align-middle text-[13px] text-[#6b7280]">
                      {fmtDate(row.last)}
                    </td>
                    <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] align-middle text-[13px] text-[#6b7280]">
                      {fmtDate(row.next)}
                    </td>
                    <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] align-middle text-[13px]">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium ${status.bg} ${status.fg}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          aria-hidden
                        />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
