import { Loader2 } from "lucide-react";
import type { EmployeeProfileChangeHistoryItem } from "@/lib/api/employees";
import {
  profileHistoryFieldLabel,
  profileHistoryValueText,
} from "@/lib/profileHistory/helpers";
import { formatDate } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ProfileSection } from "./atoms";

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
    <ProfileSection id="history" kicker="Audit" title="Change history">
      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-zinc-500"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading change history…
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : history.length === 0 ? (
        <p className="text-sm text-zinc-500">No tracked profile changes yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Old value</TableHead>
                <TableHead>New value</TableHead>
                <TableHead>Changed by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={String(entry.id)}>
                  <TableCell className="ep-mono text-xs text-zinc-500">
                    {formatDate(entry.changed_at)}
                  </TableCell>
                  <TableCell>{profileHistoryFieldLabel(entry.field)}</TableCell>
                  <TableCell className="text-zinc-500">
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
                  <TableCell className="text-zinc-500">
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
    </ProfileSection>
  );
}
