import type { CompensationEmployee } from "@/lib/api/compensation";

const HEADERS = [
  "Employee",
  "Title",
  "Department",
  "Base salary (BAM)",
  "Bonus %",
  "Last review",
  "Next review",
  "Status",
] as const;

function escapeCell(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRow(employee: CompensationEmployee): string {
  return [
    employee.name,
    employee.title,
    employee.dept,
    employee.salary,
    `${employee.bonus}%`,
    employee.last || "",
    employee.next || "",
    employee.status === "OnLeave" ? "On Leave" : employee.status,
  ]
    .map(escapeCell)
    .join(",");
}

export function exportCompensationCsv(rows: CompensationEmployee[]): void {
  const csv = [HEADERS.join(","), ...rows.map(toRow)].join("\n");
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bloomhub-compensation-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
