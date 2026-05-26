import type { ReactNode } from "react";
import { ChevronRight, Plus, Download } from "lucide-react";
import { Button } from "../ui/button";
import { CountBadge } from "./atoms";

interface EmployeesListHeaderProps {
  count: number;
  subtitle?: string;
  canAdd?: boolean;
  canExport?: boolean;
  onAdd?: () => void;
  onExport?: () => void;
  extra?: ReactNode;
}

/** Top-of-page header — breadcrumb, title+count, subtitle, primary CTAs. */
export function EmployeesListHeader({
  count,
  subtitle = "All people across Bloomteq",
  canAdd = true,
  canExport = true,
  onAdd,
  onExport,
  extra,
}: EmployeesListHeaderProps) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-6">
      <div>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-zinc-500"
        >
          <span>HR</span>
          <ChevronRight size={12} aria-hidden />
          <span className="font-medium text-zinc-900">Employees</span>
        </nav>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="m-0 text-[28px] leading-tight font-bold tracking-tight text-zinc-900">
            Employees
          </h1>
          <CountBadge count={count} label={`${count} employees total`} />
        </div>
        {subtitle ? (
          <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        {canExport ? (
          <Button variant="outline" onClick={onExport} className="gap-1.5">
            <Download size={14} aria-hidden />
            Export
          </Button>
        ) : null}
        {canAdd ? (
          <Button onClick={onAdd} className="gap-1.5">
            <Plus size={14} aria-hidden />
            Add employee
          </Button>
        ) : null}
      </div>
    </header>
  );
}
