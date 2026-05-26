"use client";

import {
  Activity,
  Download,
  FileText,
  Image as ImageIcon,
  Layers,
  Network,
  Settings,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { QuickActionButton } from "../QuickActionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import type { OrgDepartment } from "./types";

interface Props {
  departments: OrgDepartment[];
  activeDepts: string[];
  onLegendClick: (id: string) => void;
  onAddEmployee: () => void;
  onManageDepartments?: () => void;
  canManageDepartments?: boolean;
  onExport: (kind: "png" | "pdf") => void;
  onChartSettings: () => void;
  stats: {
    avgTeamSize: string;
    mgmtRatio: string;
    span: string;
    remote: string;
    onLeave: string;
  };
}

export function OrgChartSidebar({
  departments,
  activeDepts,
  onLegendClick,
  onAddEmployee,
  onManageDepartments,
  canManageDepartments = false,
  onExport,
  onChartSettings,
  stats,
}: Props) {
  const visibleDepts = departments.filter((d) => d.id !== "exec");

  return (
    <aside className="flex flex-col gap-3">
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-900 dark:text-gray-100">
            Quick actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pb-4">
          <QuickActionButton
            label="Add employee"
            icon={UserPlus}
            onClick={onAddEmployee}
            variant="primary"
          />
          {canManageDepartments && onManageDepartments && (
            <QuickActionButton
              label="Manage departments"
              icon={Network}
              onClick={onManageDepartments}
            />
          )}
          {/* Export uses DropdownMenu for format picker — keep visual parity
              with the rest of QuickActions via the outline button. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                style={{ color: "#111827" }}
              >
                <Download className="h-4 w-4" />
                Export org chart
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onExport("png")}
                className="gap-2"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExport("pdf")}
                className="gap-2"
              >
                <FileText className="h-3.5 w-3.5" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <QuickActionButton
            label="Chart settings"
            icon={Settings}
            onClick={onChartSettings}
          />
        </CardContent>
      </Card>

      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-gray-100">
            <Layers className="h-3.5 w-3.5" />
            Departments
            <span className="ml-auto text-[10px] font-normal lowercase text-gray-500">
              click to filter
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-px pb-4">
          {visibleDepts.map((d) => {
            const active = activeDepts.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onLegendClick(d.id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  active
                    ? "bg-white shadow-[inset_0_0_0_1px_#171717] dark:bg-gray-900"
                    : ""
                }`}
              >
                <span
                  className="h-4 w-1 shrink-0 rounded"
                  style={{ background: d.color }}
                />
                <span className="flex-1 text-xs font-medium text-gray-900 dark:text-gray-100">
                  {d.name}
                </span>
                <span className="font-mono text-[11px] font-medium text-gray-500">
                  {d.count}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-gray-100">
            <Activity className="h-3.5 w-3.5" />
            Quick stats
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pb-4">
          {[
            ["Avg team size", stats.avgTeamSize],
            ["Management ratio", stats.mgmtRatio],
            ["Span of control", stats.span],
            ["Remote workers", stats.remote],
            ["On leave", stats.onLeave],
          ].map(([label, value], i, arr) => (
            <div
              key={label}
              className={`flex items-center justify-between py-1 ${
                i < arr.length - 1
                  ? "border-b border-dashed border-gray-200 dark:border-gray-700"
                  : ""
              }`}
            >
              <dt className="text-xs font-medium text-gray-500">{label}</dt>
              <dd className="font-mono text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                {value}
              </dd>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
