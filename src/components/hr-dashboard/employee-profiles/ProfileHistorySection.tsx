import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { EmployeeProfileChangeHistoryItem } from "@/lib/api/employees";
import {
  profileHistoryFieldLabel,
  profileHistoryValueText,
} from "@/lib/profileHistory/helpers";
import { formatDate } from "@/utils";

interface ProfileHistorySectionProps {
  isLoading: boolean;
  error: string | null;
  history: EmployeeProfileChangeHistoryItem[];
  currency?: string;
}

export function ProfileHistorySection({
  isLoading,
  error,
  history,
  currency = "USD",
}: ProfileHistorySectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
          Change History
        </h3>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          SECTION 06
        </span>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading change history...
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-zinc-500">No tracked profile changes yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>Changed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={String(entry.id)}>
                  <TableCell>{formatDate(entry.changed_at)}</TableCell>
                  <TableCell>{profileHistoryFieldLabel(entry.field)}</TableCell>
                  <TableCell className="text-zinc-600">
                    {profileHistoryValueText(
                      entry.field,
                      entry.old_value,
                      currency
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900">
                    {profileHistoryValueText(
                      entry.field,
                      entry.new_value,
                      currency
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {entry.changed_by_name ||
                      entry.changed_by_email ||
                      "System"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
