"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DatePicker } from "./DatePicker";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  Plus,
  Edit,
  AlertCircle,
  Umbrella,
  Heart,
  Home,
  Baby,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Users,
  Inbox,
  Clock,
  LayoutGrid,
  SlidersHorizontal,
  Sun,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/utils";
import { format } from "date-fns";
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  LeaveStatus,
  TempoSyncStatus,
  TeamCalendarEvent,
  CreateLeaveRequestPayload,
  VacationCapabilities,
  VacationTeamMember,
} from "@/types/vacations";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_BADGE_COLORS,
  LEAVE_TYPE_BADGE_COLORS,
  ALL_LEAVE_TYPES,
  DEFAULT_VACATION_CAPABILITIES,
} from "@/types/vacations";
import {
  fetchLeaveRequests,
  fetchLeaveBalances,
  fetchTeamCalendar,
  fetchVacationCapabilities,
  fetchVacationTeamMembers,
  createLeaveRequest,
  approveLeaveRequest,
  hrApproveLeaveRequest,
  rejectLeaveRequest,
  updateLeaveBalance,
} from "@/lib/api/vacations";

// Extend session type to include accessToken
interface ExtendedSession {
  accessToken?: string;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const getLeaveTypeIcon = (type: LeaveType) => {
  const iconProps = "h-4 w-4";
  switch (type) {
    case "vacation":
      return <Umbrella className={iconProps} />;
    case "sick":
      return <Heart className={iconProps} />;
    case "wfh":
      return <Home className={iconProps} />;
    case "personal":
      return <User className={iconProps} />;
    case "maternity":
    case "paternity":
      return <Baby className={iconProps} />;
    default:
      return <CalendarIcon className={iconProps} />;
  }
};

const LOW_BALANCE_THRESHOLD_DAYS = 2;

const getBalanceUsagePercent = (balance: LeaveBalance): number => {
  if (balance.allocated <= 0) return 0;
  return Math.min(100, Math.round((balance.used / balance.allocated) * 100));
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string): Date | undefined => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const isLowBalance = (balance: LeaveBalance): boolean =>
  balance.remaining <= LOW_BALANCE_THRESHOLD_DAYS;

const getEmployeeInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

const TEMPO_SYNC_STATUS_LABELS: Record<TempoSyncStatus, string> = {
  synced: "Synced",
  failed: "Failed",
  pending: "Pending",
  skipped: "Skipped",
  deleted: "Deleted",
  not_started: "Not started",
};

const TEMPO_SYNC_STATUS_CLASSES: Record<TempoSyncStatus, string> = {
  synced: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  skipped: "bg-gray-100 text-gray-700 border-gray-200",
  deleted: "bg-gray-100 text-gray-700 border-gray-200",
  not_started: "bg-gray-50 text-gray-500 border-gray-200",
};

function TempoSyncBadge({ status }: { status?: TempoSyncStatus | null }) {
  if (!status) {
    return (
      <Badge className="border-gray-200 bg-gray-50 text-gray-500">
        Not started
      </Badge>
    );
  }

  return (
    <Badge className={TEMPO_SYNC_STATUS_CLASSES[status]}>
      {TEMPO_SYNC_STATUS_LABELS[status]}
    </Badge>
  );
}

// Vibrant per-type hex used by the big-number balance cards and the who's-out
// timeline bars. Purely presentational — mirrors the redesign palette.
const LEAVE_TYPE_HEX: Record<LeaveType, string> = {
  vacation: "#2563eb",
  sick: "#e11d48",
  wfh: "#0d9488",
  personal: "#7c3aed",
  maternity: "#db2777",
  paternity: "#4f46e5",
  bereavement: "#475569",
  unpaid: "#d97706",
};

const AVATAR_PALETTE = [
  "#2563eb",
  "#0d9488",
  "#7c3aed",
  "#db2777",
  "#d97706",
  "#0ea5e9",
  "#16a34a",
  "#e11d48",
  "#4f46e5",
  "#0891b2",
  "#9333ea",
  "#ca8a04",
];

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

function LeaveTypeChip({ type }: { type: LeaveType }) {
  return (
    <Badge className={LEAVE_TYPE_BADGE_COLORS[type]}>
      {LEAVE_TYPE_LABELS[type]}
    </Badge>
  );
}

const TIMELINE_DOW = ["S", "M", "T", "W", "T", "F", "S"];

interface TimelineBar extends TeamCalendarEvent {
  clampStart: number;
  clampEnd: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}
interface TimelineRow {
  employeeId: string;
  employeeName: string;
  bars: TimelineBar[];
}

/**
 * Horizontal "who's out" Gantt of the whole company for the selected month.
 * Presentation only — consumes the same `teamEvents` the module already loads.
 */
function TeamTimeline({
  teamEvents,
  calendarMonth,
  setCalendarMonth,
}: {
  teamEvents: TeamCalendarEvent[];
  calendarMonth: Date;
  setCalendarMonth: (date: Date) => void;
}) {
  const [search, setSearch] = useState("");

  const year = calendarMonth.getFullYear();
  const monthIndex = calendarMonth.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const isThisMonth =
    today.getFullYear() === year && today.getMonth() === monthIndex;
  const todayDay = today.getDate();

  const dayCols = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dow = new Date(year, monthIndex, d).getDay();
    return {
      d,
      dow,
      weekend: dow === 0 || dow === 6,
      today: isThisMonth && d === todayDay,
    };
  });

  const rows = useMemo<TimelineRow[]>(() => {
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex, daysInMonth);
    const byEmployee = new Map<string, TimelineRow>();

    teamEvents.forEach((event) => {
      const start = parseLocalDate(event.startDate);
      const end = parseLocalDate(event.endDate);
      if (!start || !end) return;
      if (end < monthStart || start > monthEnd) return;

      const clampStart = start < monthStart ? 1 : start.getDate();
      const clampEnd = end > monthEnd ? daysInMonth : end.getDate();

      const group = byEmployee.get(event.employeeId) ?? {
        employeeId: event.employeeId,
        employeeName: event.employeeName?.trim() || "Employee",
        bars: [],
      };
      group.bars.push({
        ...event,
        clampStart,
        clampEnd,
        continuesBefore: start < monthStart,
        continuesAfter: end > monthEnd,
      });
      byEmployee.set(event.employeeId, group);
    });

    let list = Array.from(byEmployee.values());
    const normalized = search.trim().toLowerCase();
    if (normalized) {
      list = list.filter((row) =>
        row.employeeName.toLowerCase().includes(normalized)
      );
    }
    list.forEach((row) => row.bars.sort((a, b) => a.clampStart - b.clampStart));
    list.sort(
      (a, b) =>
        Math.min(...a.bars.map((x) => x.clampStart)) -
          Math.min(...b.bars.map((x) => x.clampStart)) ||
        a.employeeName.localeCompare(b.employeeName)
    );
    return list;
  }, [teamEvents, year, monthIndex, daysInMonth, search]);

  const typesPresent = useMemo(() => {
    const set = new Set<LeaveType>();
    rows.forEach((row) => row.bars.forEach((bar) => set.add(bar.leaveType)));
    return Array.from(set);
  }, [rows]);

  const totalOut = rows.length;
  const totalDaysOut = rows.reduce(
    (sum, row) =>
      sum +
      row.bars.reduce((m, bar) => m + (bar.clampEnd - bar.clampStart + 1), 0),
    0
  );

  const shiftMonth = (offset: number) =>
    setCalendarMonth(new Date(year, monthIndex + offset, 1));

  return (
    <Card className="overflow-hidden border-gray-200">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-semibold text-gray-900">
            {format(calendarMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 text-xs"
            onClick={() => setCalendarMonth(new Date())}
          >
            Today
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 pl-9"
          />
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>
            <b className="font-semibold text-gray-900 tabular-nums">
              {totalOut}
            </b>{" "}
            out ·{" "}
            <b className="font-semibold text-gray-900 tabular-nums">
              {totalDaysOut}
            </b>{" "}
            days off
          </span>
        </div>
      </div>

      {/* Legend */}
      {typesPresent.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
          {typesPresent.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: LEAVE_TYPE_HEX[type] }}
              />
              {LEAVE_TYPE_LABELS[type]}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                background: "#94a3b8",
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,.5) 0 3px, transparent 3px 6px)",
              }}
            />
            Pending approval
          </span>
        </div>
      )}

      {/* Grid */}
      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Sun className="mx-auto mb-2 h-6 w-6 text-gray-400" />
          <div className="font-medium text-gray-700">Nobody scheduled off</div>
          <div className="mt-0.5 text-sm text-gray-500">
            No approved or pending leave overlaps{" "}
            {format(calendarMonth, "MMMM yyyy")}.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid w-full min-w-[860px]"
            style={{
              gridTemplateColumns: "216px minmax(0, 1fr)",
            }}
          >
            {/* Header row */}
            <div className="sticky left-0 z-30 flex h-12 items-center border-b border-r border-gray-200 bg-gray-50 px-4 text-xs font-semibold text-gray-500">
              Employee
            </div>
            <div
              className="grid border-b border-gray-200 bg-gray-50"
              style={{
                gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))`,
              }}
            >
              {dayCols.map((col) => (
                <div
                  key={col.d}
                  className={`border-r border-gray-100 py-1.5 text-center ${
                    col.weekend ? "bg-blue-100/70" : ""
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase tracking-wide ${
                      col.today
                        ? "font-bold text-blue-600"
                        : col.weekend
                          ? "font-semibold text-blue-500"
                          : "text-gray-400"
                    }`}
                  >
                    {TIMELINE_DOW[col.dow]}
                  </div>
                  {col.today ? (
                    <div className="mx-auto mt-0.5 grid h-[22px] w-[22px] place-items-center rounded-md bg-blue-600 text-[13px] font-semibold text-white">
                      {col.d}
                    </div>
                  ) : (
                    <div
                      className={`text-[13px] font-semibold ${
                        col.weekend ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {col.d}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Employee rows */}
            {rows.map((row) => (
              <div key={row.employeeId} className="contents">
                <div className="sticky left-0 z-20 flex h-[46px] items-center gap-2.5 border-b border-r border-gray-100 bg-white px-4">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback
                      className="text-[11px] font-semibold text-white"
                      style={{ background: getAvatarColor(row.employeeName) }}
                    >
                      {getEmployeeInitials(row.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-[13px] font-semibold text-gray-900">
                    {row.employeeName}
                  </span>
                </div>
                <div
                  className="relative grid h-[46px] border-b border-gray-100"
                  style={{
                    gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))`,
                  }}
                >
                  {dayCols.map((col) => (
                    <div
                      key={col.d}
                      className={`border-r border-gray-100 ${
                        col.today
                          ? "bg-blue-50"
                          : col.weekend
                            ? "bg-blue-100/50"
                            : ""
                      }`}
                    />
                  ))}
                  {row.bars.map((bar, i) => {
                    const span = bar.clampEnd - bar.clampStart + 1;
                    const leftPct = ((bar.clampStart - 1) / daysInMonth) * 100;
                    const widthPct = (span / daysInMonth) * 100;
                    const isPending =
                      bar.status === "pending" ||
                      bar.status === "lead_approved";
                    const showLabel = span > 1;
                    return (
                      <div
                        key={i}
                        className="absolute top-[9px] flex h-7 items-center overflow-hidden whitespace-nowrap px-2 text-xs font-semibold text-white shadow-sm"
                        style={{
                          left: `calc(${leftPct}% + 3px)`,
                          width: `calc(${widthPct}% - 6px)`,
                          background: LEAVE_TYPE_HEX[bar.leaveType],
                          borderRadius: bar.continuesBefore
                            ? "0 8px 8px 0"
                            : "8px",
                          backgroundImage: isPending
                            ? "repeating-linear-gradient(45deg, rgba(255,255,255,.16) 0 6px, transparent 6px 12px)"
                            : undefined,
                        }}
                        title={`${row.employeeName} · ${LEAVE_TYPE_LABELS[bar.leaveType]} · ${bar.startDate} → ${bar.endDate}${
                          bar.status !== "approved"
                            ? ` (${bar.status.replace("_", " ")})`
                            : ""
                        }`}
                      >
                        {showLabel && (
                          <span className="overflow-hidden text-ellipsis">
                            {LEAVE_TYPE_LABELS[bar.leaveType]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

interface VacationsModuleProps {
  addNotification?: (
    module: "vacations",
    type: "info" | "warning" | "success" | "alert",
    title: string,
    message: string
  ) => void;
}

interface EmployeeLeaveBalanceGroup {
  employeeId: string;
  employeeName: string;
  balances: LeaveBalance[];
}

export function VacationsModule({ addNotification }: VacationsModuleProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState("request");

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestFormError, setRequestFormError] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Capabilities are server-derived from the user's permission bitmap.
  const [capabilities, setCapabilities] = useState<VacationCapabilities>(
    DEFAULT_VACATION_CAPABILITIES
  );
  const canApproveRequests = capabilities.canApproveRequests;
  const canHrApprove = capabilities.canHrApprove;
  const canAdjustBalances = capabilities.canAdjustBalances;
  const canConfigureLeaveTypes = capabilities.canConfigureLeaveTypes;
  const showApprovalsTab = canApproveRequests || canHrApprove;

  // Data states - initialize as empty, will be populated from API
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamCalendarEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<VacationTeamMember[]>([]);
  const [selectedPolicyEmployeeId, setSelectedPolicyEmployeeId] = useState<
    string | null
  >(null);
  const [policyEmployeeSearch, setPolicyEmployeeSearch] = useState("");
  const [policyLeaveTypeFilter, setPolicyLeaveTypeFilter] = useState<
    LeaveType | "all"
  >("all");
  const [policyBalanceFilter, setPolicyBalanceFilter] = useState<"all" | "low">(
    "all"
  );

  const [selectedStartDate, setSelectedStartDate] = useState<Date>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [reason, setReason] = useState("");
  const [coveringEmployee, setCoveringEmployee] = useState("");

  const [adminBalanceForm, setAdminBalanceForm] = useState({
    leaveType: "",
    newBalance: "",
    reason: "",
  });

  type CommentDialogKind = "lead" | "hr" | "reject";
  interface CommentDialogState {
    open: boolean;
    kind: CommentDialogKind;
    requestId: string;
    employeeName: string;
    comment: string;
    isSubmitting: boolean;
  }
  const [commentDialog, setCommentDialog] = useState<CommentDialogState>({
    open: false,
    kind: "lead",
    requestId: "",
    employeeName: "",
    comment: "",
    isSubmitting: false,
  });

  // Team calendar month navigation state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Get current user's employee ID from session
  const currentUserEmployeeId = (session as ExtendedSession)?.user?.id
    ? String((session as ExtendedSession)?.user?.id)
    : null;

  // The "My Leave Policies" card always shows the current user's balances.
  // The admin "Leave Policies" tab shows all balances (gated by capability).
  const myBalances = useMemo(
    () => leaveBalances.filter((b) => b.employeeId === currentUserEmployeeId),
    [currentUserEmployeeId, leaveBalances]
  );
  // Show every allocated leave type the user has (ordered), so the balance
  // strip stays full even when only one type has been used.
  const myVisibleBalances = useMemo(
    () =>
      myBalances
        .filter((b) => b.allocated > 0)
        .sort(
          (a, b) =>
            ALL_LEAVE_TYPES.indexOf(a.leaveType) -
            ALL_LEAVE_TYPES.indexOf(b.leaveType)
        ),
    [myBalances]
  );
  const displayedBalances = canConfigureLeaveTypes ? leaveBalances : myBalances;
  const groupedDisplayedBalances = useMemo(() => {
    return Array.from(
      displayedBalances
        .reduce((groups, balance) => {
          const employeeGroup = groups.get(balance.employeeId) ?? {
            employeeId: balance.employeeId,
            employeeName:
              balance.employeeName?.trim() || `Employee ${balance.employeeId}`,
            balances: [] as LeaveBalance[],
          };

          employeeGroup.balances.push(balance);
          groups.set(balance.employeeId, employeeGroup);
          return groups;
        }, new Map<string, EmployeeLeaveBalanceGroup>())
        .values()
    ).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [displayedBalances]);
  const selectedPolicyEmployee = useMemo(
    () =>
      groupedDisplayedBalances.find(
        (group) => group.employeeId === selectedPolicyEmployeeId
      ) ?? null,
    [groupedDisplayedBalances, selectedPolicyEmployeeId]
  );
  const filteredPolicyEmployeeGroups = useMemo(() => {
    const normalizedSearch = policyEmployeeSearch.trim().toLowerCase();

    return groupedDisplayedBalances.filter((group) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        group.employeeName.toLowerCase().includes(normalizedSearch);
      const matchesLeaveType =
        policyLeaveTypeFilter === "all" ||
        group.balances.some(
          (balance) => balance.leaveType === policyLeaveTypeFilter
        );
      const matchesBalanceFilter =
        policyBalanceFilter === "all" ||
        group.balances.some((balance) => isLowBalance(balance));

      return matchesSearch && matchesLeaveType && matchesBalanceFilter;
    });
  }, [
    groupedDisplayedBalances,
    policyBalanceFilter,
    policyEmployeeSearch,
    policyLeaveTypeFilter,
  ]);

  // Get access token from session
  const getAccessToken = useCallback((): string | null => {
    const extSession = session as ExtendedSession;
    if (extSession?.accessToken) {
      return extSession.accessToken;
    }
    // Fallback: check localStorage
    if (typeof window !== "undefined") {
      const tokenKeys = ["access", "accessToken", "token", "authToken", "jwt"];
      for (const key of tokenKeys) {
        const token = window.localStorage.getItem(key);
        if (token) return token;
      }
    }
    return null;
  }, [session]);

  // Fetch all data from API
  const loadData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Not authenticated. Please log in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        requestsData,
        balancesData,
        calendarData,
        capabilitiesData,
        teamMembersData,
      ] = await Promise.all([
        fetchLeaveRequests(token),
        fetchLeaveBalances(token),
        fetchTeamCalendar(token),
        fetchVacationCapabilities(token),
        fetchVacationTeamMembers(token),
      ]);

      setLeaveRequests(requestsData);
      setLeaveBalances(balancesData);
      setTeamEvents(calendarData);
      setCapabilities(capabilitiesData);
      setTeamMembers(teamMembersData);
    } catch (err) {
      console.error("Failed to load vacation data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  // Load data on mount and when session changes
  useEffect(() => {
    if (sessionStatus === "loading") return;
    loadData();
  }, [sessionStatus, loadData]);

  useEffect(() => {
    if (activeTab === "policies" && !canConfigureLeaveTypes) {
      setActiveTab("request");
    }
    if (activeTab === "admin" && !canAdjustBalances) {
      setActiveTab("request");
    }
    if (activeTab === "approvals" && !showApprovalsTab) {
      setActiveTab("request");
    }
  }, [activeTab, canAdjustBalances, canConfigureLeaveTypes, showApprovalsTab]);

  const calculateDays = (start?: Date, end?: Date): number => {
    if (!start || !end) return 0;
    return (
      Math.ceil(
        Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  const handleSubmitRequest = async () => {
    if (!leaveType || !selectedStartDate || !selectedEndDate || !reason) {
      setRequestFormError("Please fill in all required fields.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setRequestFormError("Not authenticated. Please log in.");
      return;
    }

    setIsSubmitting(true);
    setRequestFormError(null);

    try {
      const payload: CreateLeaveRequestPayload = {
        leaveType: leaveType as LeaveType,
        startDate: formatLocalDate(selectedStartDate),
        endDate: formatLocalDate(selectedEndDate),
        reason,
        coveringEmployeeId: coveringEmployee || undefined,
      };

      const newRequest = await createLeaveRequest(payload, token);
      setLeaveRequests((prev) => [newRequest, ...prev]);

      // Reset form
      setLeaveType("");
      setSelectedStartDate(undefined);
      setSelectedEndDate(undefined);
      setReason("");
      setCoveringEmployee("");

      // Send notification
      if (addNotification) {
        addNotification(
          "vacations",
          "success",
          "Leave Request Submitted",
          `Your ${leaveType} request has been submitted successfully.`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit request";
      setRequestFormError(message);
      if (addNotification) {
        addNotification("vacations", "alert", "Request Failed", message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opens the request-detail dialog in review mode. The Approve / Decline
  // actions live inside that dialog (see runDecision).
  const openReviewDialog = (id: string) => {
    const request = leaveRequests.find((r) => r.id === id);
    if (!request) return;
    setAdminActionError(null);
    setCommentDialog({
      open: true,
      // approve path resolves to HR when the request already cleared the lead.
      kind: request.status === "lead_approved" ? "hr" : "lead",
      requestId: id,
      employeeName: request.employeeName,
      comment: "",
      isSubmitting: false,
    });
  };

  const closeCommentDialog = () => {
    setCommentDialog((prev) => ({ ...prev, open: false }));
  };

  const runDecision = async (kind: CommentDialogKind) => {
    const { requestId, comment, employeeName } = commentDialog;
    const trimmed = comment.trim();
    if (kind === "reject" && !trimmed) {
      setAdminActionError("A reason is required to decline the request.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setAdminActionError("Not authenticated. Please log in.");
      return;
    }

    setCommentDialog((prev) => ({ ...prev, isSubmitting: true }));
    setAdminActionError(null);

    try {
      let updatedRequest;
      if (kind === "lead") {
        updatedRequest = await approveLeaveRequest(requestId, trimmed, token);
      } else if (kind === "hr") {
        updatedRequest = await hrApproveLeaveRequest(requestId, trimmed, token);
      } else {
        updatedRequest = await rejectLeaveRequest(requestId, trimmed, token);
      }

      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === requestId ? updatedRequest : r))
      );

      if (kind === "hr") {
        if (!teamEvents.find((e) => e.id === requestId)) {
          setTeamEvents((prev) => [
            ...prev,
            {
              id: requestId,
              employeeId: updatedRequest.employeeId,
              employeeName: updatedRequest.employeeName,
              leaveType: updatedRequest.leaveType,
              startDate: updatedRequest.startDate,
              endDate: updatedRequest.endDate,
              status: "approved",
            },
          ]);
        }
        const balancesData = await fetchLeaveBalances(token);
        setLeaveBalances(balancesData);
      }

      if (addNotification) {
        if (kind === "lead") {
          addNotification(
            "vacations",
            "success",
            "Request Lead-Approved",
            `Leave request for ${employeeName} has been approved by lead and is pending HR review.`
          );
        } else if (kind === "hr") {
          addNotification(
            "vacations",
            "success",
            "Request Fully Approved",
            `Leave request for ${employeeName} has been fully approved.`
          );
        } else {
          addNotification(
            "vacations",
            "success",
            "Request Rejected",
            `Leave request for ${employeeName} has been rejected.`
          );
        }
      }

      setCommentDialog((prev) => ({
        ...prev,
        open: false,
        isSubmitting: false,
      }));
    } catch (err) {
      const fallback =
        kind === "reject"
          ? "Failed to reject request"
          : kind === "hr"
            ? "Failed to HR-approve request"
            : "Failed to approve request";
      const message = err instanceof Error ? err.message : fallback;
      setAdminActionError(message);
      if (addNotification) {
        const title =
          kind === "reject"
            ? "Rejection Failed"
            : kind === "hr"
              ? "HR Approval Failed"
              : "Approval Failed";
        addNotification("vacations", "alert", title, message);
      }
      setCommentDialog((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleUpdateBalance = async () => {
    if (
      !adminBalanceForm.leaveType ||
      !adminBalanceForm.newBalance ||
      !adminBalanceForm.reason
    ) {
      setAdminActionError("Please fill in all fields.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setAdminActionError("Not authenticated. Please log in.");
      return;
    }

    // Find the balance ID for the selected leave type (for current user)
    const balanceToUpdate = leaveBalances.find(
      (b) =>
        b.leaveType === adminBalanceForm.leaveType &&
        b.employeeId === currentUserEmployeeId
    );

    if (!balanceToUpdate) {
      setAdminActionError(
        `Balance for ${adminBalanceForm.leaveType} not found.`
      );
      return;
    }

    try {
      setAdminActionError(null);
      const newAllocated = parseInt(adminBalanceForm.newBalance);
      const updatedBalance = await updateLeaveBalance(
        balanceToUpdate.id,
        {
          allocated: newAllocated,
          reason: adminBalanceForm.reason,
        },
        token
      );

      setLeaveBalances((prev) =>
        prev.map((b) => (b.id === balanceToUpdate.id ? updatedBalance : b))
      );

      setAdminBalanceForm({ leaveType: "", newBalance: "", reason: "" });

      // Send success notification
      if (addNotification) {
        addNotification(
          "vacations",
          "success",
          "Balance Updated",
          `Leave balance for ${adminBalanceForm.leaveType} has been updated to ${newAllocated} days.`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update balance";
      setAdminActionError(message);
      if (addNotification) {
        addNotification("vacations", "alert", "Balance Update Failed", message);
      }
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    if (!status) {
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
    return (
      <Badge
        className={
          LEAVE_STATUS_BADGE_COLORS[status] ?? "bg-gray-100 text-gray-800"
        }
      >
        {LEAVE_STATUS_LABELS[status] ?? status}
      </Badge>
    );
  };

  const pendingApprovalRequests = leaveRequests.filter((r) => {
    if (canApproveRequests && r.status === "pending") return true;
    if (canHrApprove && r.status === "lead_approved") return true;
    return false;
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading vacation data...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && leaveBalances.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Leave Management
          </h1>
          <p className="text-gray-600">
            Request time off, track balances, and see who&apos;s away across the
            company.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setActiveTab("calendar")}>
            <CalendarIcon className="h-4 w-4" />
            Who&apos;s out
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setActiveTab("request")}
          >
            <Plus className="h-4 w-4" />
            Request leave
          </Button>
        </div>
      </div>

      {/* Tabs — segmented control */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="h-auto w-fit justify-start gap-1 rounded-xl border border-gray-200 bg-white p-1.5">
          <TabsTrigger
            value="request"
            className="gap-2 rounded-lg px-5 py-2.5 text-[15px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 data-[state=active]:border-transparent data-[state=active]:bg-[#171717] data-[state=active]:text-white data-[state=active]:hover:bg-[#171717] data-[state=active]:shadow-none"
          >
            <Plus className="h-4 w-4" />
            Request leave
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="gap-2 rounded-lg px-5 py-2.5 text-[15px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 data-[state=active]:border-transparent data-[state=active]:bg-[#171717] data-[state=active]:text-white data-[state=active]:hover:bg-[#171717] data-[state=active]:shadow-none"
          >
            <CalendarIcon className="h-4 w-4" />
            Team calendar
          </TabsTrigger>
          {showApprovalsTab && (
            <TabsTrigger
              value="approvals"
              className="gap-2 rounded-lg px-5 py-2.5 text-[15px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 data-[state=active]:border-transparent data-[state=active]:bg-[#171717] data-[state=active]:text-white data-[state=active]:hover:bg-[#171717] data-[state=active]:shadow-none"
            >
              <Inbox className="h-4 w-4" />
              Approvals
              {pendingApprovalRequests.length > 0 && (
                <span className="ml-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-700">
                  {pendingApprovalRequests.length}
                </span>
              )}
            </TabsTrigger>
          )}
          {canConfigureLeaveTypes && (
            <TabsTrigger
              value="policies"
              className="gap-2 rounded-lg px-5 py-2.5 text-[15px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 data-[state=active]:border-transparent data-[state=active]:bg-[#171717] data-[state=active]:text-white data-[state=active]:hover:bg-[#171717] data-[state=active]:shadow-none"
            >
              <LayoutGrid className="h-4 w-4" />
              Leave policies
            </TabsTrigger>
          )}
          {canAdjustBalances && (
            <TabsTrigger
              value="admin"
              className="gap-2 rounded-lg px-5 py-2.5 text-[15px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 data-[state=active]:border-transparent data-[state=active]:bg-[#171717] data-[state=active]:text-white data-[state=active]:hover:bg-[#171717] data-[state=active]:shadow-none"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Admin panel
            </TabsTrigger>
          )}
        </TabsList>

        {/* Request leave */}
        <TabsContent value="request" className="space-y-6">
          {/* My balances — compact strip (request tab only) */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                My balances
              </span>
              <span className="text-xs text-gray-400">· Resets Jan 1</span>
            </div>
            {myVisibleBalances.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="py-6">
                  <p className="text-sm text-gray-500">
                    No leave types currently in use.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-2">
                {myVisibleBalances.map((balance) => {
                  const hex = LEAVE_TYPE_HEX[balance.leaveType];
                  const pct = getBalanceUsagePercent(balance);
                  const low = isLowBalance(balance);
                  return (
                    <div
                      key={balance.id}
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-2.5"
                      title={`${balance.used} used · ${balance.carryOver} carried`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="grid h-5 w-5 flex-none place-items-center rounded-md [&_svg]:h-3 [&_svg]:w-3"
                          style={{ background: `${hex}1f`, color: hex }}
                        >
                          {getLeaveTypeIcon(balance.leaveType)}
                        </span>
                        <span className="truncate text-sm font-medium text-gray-600">
                          {LEAVE_TYPE_LABELS[balance.leaveType]}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span
                          className={`text-xl font-bold leading-none tabular-nums ${
                            low ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {balance.remaining}
                        </span>
                        <span className="text-[11px] text-gray-400 tabular-nums">
                          / {balance.allocated}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: hex }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                  <CardTitle className="text-lg font-semibold text-gray-950">
                    Submit a leave request
                  </CardTitle>
                  <span className="text-xs font-medium text-gray-600">
                    Routed to your team lead, then HR
                  </span>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Leave Type *</Label>
                      <Select
                        value={leaveType}
                        onValueChange={(v) => setLeaveType(v as LeaveType)}
                      >
                        <SelectTrigger className="border-gray-300 bg-white shadow-sm">
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_LEAVE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {LEAVE_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Covering Employee</Label>
                      <Select
                        value={coveringEmployee}
                        onValueChange={setCoveringEmployee}
                        disabled={teamMembers.length === 0}
                      >
                        <SelectTrigger className="border-gray-300 bg-white shadow-sm">
                          <SelectValue
                            placeholder={
                              teamMembers.length === 0
                                ? "No teammates available"
                                : "Select covering employee"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <div className="[&_button]:border-gray-300 [&_button]:shadow-sm">
                        <DatePicker
                          key={`start-${selectedStartDate ? formatLocalDate(selectedStartDate) : "empty"}`}
                          mode="single"
                          value={
                            selectedStartDate
                              ? formatLocalDate(selectedStartDate)
                              : ""
                          }
                          onChange={(date) =>
                            setSelectedStartDate(parseLocalDate(date))
                          }
                          placeholder="Pick a date"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <div className="[&_button]:border-gray-300 [&_button]:shadow-sm">
                        <DatePicker
                          key={`end-${selectedEndDate ? formatLocalDate(selectedEndDate) : "empty"}`}
                          mode="single"
                          value={
                            selectedEndDate
                              ? formatLocalDate(selectedEndDate)
                              : ""
                          }
                          onChange={(date) =>
                            setSelectedEndDate(parseLocalDate(date))
                          }
                          placeholder="Pick a date"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="w-36 space-y-2">
                      <Label>Total Days</Label>
                      <Input
                        value={calculateDays(
                          selectedStartDate,
                          selectedEndDate
                        )}
                        readOnly
                        className="border-gray-300 bg-gray-50 text-lg font-semibold tabular-nums shadow-sm"
                      />
                    </div>
                    <p className="flex-1 pb-2 text-xs text-gray-500">
                      Weekends and public holidays are handled by HR on
                      approval.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Leave *</Label>
                    <Textarea
                      placeholder="A short note for your approver..."
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="border-gray-300 bg-white shadow-sm placeholder:text-gray-500"
                    />
                  </div>

                  {requestFormError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Unable to submit request</AlertTitle>
                      <AlertDescription>{requestFormError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSubmitRequest}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-950">
                    This year
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {
                        label: "Total requests",
                        value: leaveRequests.length,
                        color: "text-gray-900",
                      },
                      {
                        label: "Pending",
                        value: leaveRequests.filter(
                          (r) => r.status === "pending"
                        ).length,
                        color: "text-amber-600",
                      },
                      {
                        label: "Lead approved",
                        value: leaveRequests.filter(
                          (r) => r.status === "lead_approved"
                        ).length,
                        color: "text-blue-600",
                      },
                      {
                        label: "Approved",
                        value: leaveRequests.filter(
                          (r) => r.status === "approved"
                        ).length,
                        color: "text-green-600",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div
                          className={`text-2xl font-extrabold tabular-nums ${stat.color}`}
                        >
                          {stat.value}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-950">
                    Recent requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {leaveRequests.slice(0, 5).length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No leave requests yet.
                    </p>
                  ) : (
                    leaveRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="space-y-2.5 rounded-xl border border-gray-200 p-3 transition-colors hover:border-gray-300"
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback
                              className="text-[11px] font-semibold text-white"
                              style={{
                                background: getAvatarColor(
                                  request.employeeName
                                ),
                              }}
                            >
                              {getEmployeeInitials(request.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {request.employeeName}
                            </p>
                            <p className="text-xs text-gray-500 tabular-nums">
                              {formatDate(request.startDate)} to{" "}
                              {formatDate(request.endDate)} · {request.days}{" "}
                              {request.days === 1 ? "day" : "days"}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <LeaveTypeChip type={request.leaveType} />
                          <TempoSyncBadge status={request.tempo_sync_status} />
                          <span className="text-[11px] text-gray-400 tabular-nums">
                            {request.tempo_synced_days ?? 0} synced ·{" "}
                            {request.tempo_failed_days ?? 0} failed
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Team calendar — who's-out timeline */}
        <TabsContent value="calendar" className="space-y-6">
          <TeamTimeline
            teamEvents={teamEvents}
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
          />
        </TabsContent>

        {/* Pending approvals — own tab */}
        {showApprovalsTab && (
          <TabsContent value="approvals" className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 bg-gradient-to-b from-blue-50/60 to-transparent">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700">
                  <Inbox className="h-[18px] w-[18px]" />
                </span>
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-950">
                    Pending approvals
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {pendingApprovalRequests.length
                      ? `${pendingApprovalRequests.length} request${
                          pendingApprovalRequests.length > 1 ? "s" : ""
                        } awaiting your decision`
                      : "You're all caught up"}
                  </p>
                </div>
                {pendingApprovalRequests.length > 0 && (
                  <Badge className="border-amber-200 bg-amber-100 text-amber-700">
                    <Clock className="h-3 w-3" />
                    {pendingApprovalRequests.length} waiting
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {adminActionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Action failed</AlertTitle>
                    <AlertDescription>{adminActionError}</AlertDescription>
                  </Alert>
                )}

                {pendingApprovalRequests.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-600" />
                    <p className="text-sm text-gray-500">
                      No requests pending your approval.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead className="text-center">Review</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApprovalRequests.map((request) => {
                          const hrStage = request.status === "lead_approved";
                          return (
                            <TableRow key={request.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback
                                      className="text-xs font-semibold text-white"
                                      style={{
                                        background: getAvatarColor(
                                          request.employeeName
                                        ),
                                      }}
                                    >
                                      {getEmployeeInitials(
                                        request.employeeName
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="whitespace-nowrap font-medium">
                                    {request.employeeName}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <LeaveTypeChip type={request.leaveType} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm tabular-nums">
                                {formatDate(request.startDate)} to{" "}
                                {formatDate(request.endDate)}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {request.days}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <p className="whitespace-normal break-words text-sm text-gray-700">
                                  {request.reason?.trim() ||
                                    "No reason provided"}
                                </p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <span
                                    className={`grid h-[18px] w-[18px] place-items-center rounded-full text-[10px] font-bold ${
                                      hrStage
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-600 text-white"
                                    }`}
                                  >
                                    {hrStage ? (
                                      <Check className="h-2.5 w-2.5" />
                                    ) : (
                                      "1"
                                    )}
                                  </span>
                                  <span className="h-0.5 w-3.5 bg-gray-200" />
                                  <span
                                    className={`grid h-[18px] w-[18px] place-items-center rounded-full text-[10px] font-bold ${
                                      hrStage
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    2
                                  </span>
                                  <span className="ml-1">
                                    {hrStage ? "HR" : "Lead"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  onClick={() => openReviewDialog(request.id)}
                                  className="h-11 w-full gap-2 text-[15px] font-semibold"
                                >
                                  <Eye className="h-[18px] w-[18px]" />
                                  View details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Leave policies */}
        {canConfigureLeaveTypes && (
          <TabsContent value="policies" className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold text-gray-950">
                  Employee leave policies
                </CardTitle>
                <span className="text-sm text-gray-500 tabular-nums">
                  {groupedDisplayedBalances.length} employees
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px]">
                  <div className="space-y-2">
                    <Label htmlFor="policy-employee-search">
                      Search employees
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="policy-employee-search"
                        placeholder="Search by name"
                        value={policyEmployeeSearch}
                        onChange={(event) =>
                          setPolicyEmployeeSearch(event.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Leave type</Label>
                    <Select
                      value={policyLeaveTypeFilter}
                      onValueChange={(value) =>
                        setPolicyLeaveTypeFilter(value as LeaveType | "all")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All leave types</SelectItem>
                        {ALL_LEAVE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {LEAVE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Balance</Label>
                    <Select
                      value={policyBalanceFilter}
                      onValueChange={(value) =>
                        setPolicyBalanceFilter(value as "all" | "low")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All balances</SelectItem>
                        <SelectItem value="low">Low balances</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {filteredPolicyEmployeeGroups.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                      No employees match the selected filters.
                    </div>
                  ) : (
                    filteredPolicyEmployeeGroups.map((group) => {
                      const totalRemaining = group.balances.reduce(
                        (sum, balance) => sum + balance.remaining,
                        0
                      );
                      const totalAllocated = group.balances.reduce(
                        (sum, balance) => sum + balance.allocated,
                        0
                      );
                      const lowBalanceCount = group.balances.filter((balance) =>
                        isLowBalance(balance)
                      ).length;
                      const employeeAvatar = group.balances.find(
                        (b) => b.employeeAvatar
                      )?.employeeAvatar;

                      return (
                        <div
                          key={group.employeeId}
                          className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={employeeAvatar}
                                alt={group.employeeName}
                              />
                              <AvatarFallback
                                className="text-xs font-semibold text-white"
                                style={{
                                  background: getAvatarColor(
                                    group.employeeName
                                  ),
                                }}
                              >
                                {getEmployeeInitials(group.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h2 className="font-medium text-gray-900">
                                {group.employeeName}
                              </h2>
                              <p className="text-sm text-gray-500 tabular-nums">
                                {group.balances.length} leave types ·{" "}
                                {totalRemaining}/{totalAllocated} days remaining
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Usage fingerprint */}
                            <div className="hidden items-center gap-1 sm:flex">
                              {(
                                [
                                  "vacation",
                                  "sick",
                                  "wfh",
                                  "personal",
                                ] as LeaveType[]
                              ).map((type) => {
                                const balance = group.balances.find(
                                  (b) => b.leaveType === type
                                );
                                if (!balance) {
                                  return (
                                    <div
                                      key={type}
                                      className="h-1.5 w-6 rounded-full bg-gray-200"
                                    />
                                  );
                                }
                                const ratio = balance.allocated
                                  ? balance.remaining / balance.allocated
                                  : 0;
                                return (
                                  <div
                                    key={type}
                                    title={`${LEAVE_TYPE_LABELS[type]}: ${balance.remaining}/${balance.allocated}`}
                                    className="h-1.5 w-6 rounded-full"
                                    style={{
                                      background: `color-mix(in srgb, ${LEAVE_TYPE_HEX[type]} ${Math.max(
                                        18,
                                        ratio * 100
                                      )}%, #e5e7eb)`,
                                    }}
                                  />
                                );
                              })}
                            </div>
                            {lowBalanceCount > 0 && (
                              <Badge className="border-red-200 bg-red-100 text-red-800">
                                {lowBalanceCount} low
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedPolicyEmployeeId(group.employeeId)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View details
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={selectedPolicyEmployee !== null}
              onOpenChange={(open) => {
                if (!open) setSelectedPolicyEmployeeId(null);
              }}
            >
              <DialogContent className="grid-rows-[auto_minmax(0,1fr)] max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedPolicyEmployee?.employeeName ?? "Leave policies"}
                  </DialogTitle>
                  <DialogDescription>
                    Allocations, usage, and remaining days by leave type.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid min-h-0 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {selectedPolicyEmployee?.balances.map((balance) => {
                    const hex = LEAVE_TYPE_HEX[balance.leaveType];
                    const low = isLowBalance(balance);
                    return (
                      <div
                        key={balance.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="grid h-6 w-6 flex-none place-items-center rounded-md"
                              style={{ background: `${hex}24`, color: hex }}
                            >
                              {getLeaveTypeIcon(balance.leaveType)}
                            </span>
                            <h3 className="truncate text-sm font-semibold text-gray-900">
                              {LEAVE_TYPE_LABELS[balance.leaveType]}
                            </h3>
                          </div>
                          <span
                            className={`flex-none text-sm font-bold tabular-nums ${
                              low ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {balance.remaining} left
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center gap-4 text-xs tabular-nums">
                          <span className="text-gray-500">
                            Allocated{" "}
                            <b className="font-semibold text-gray-900">
                              {balance.allocated}d
                            </b>
                          </span>
                          <span className="text-gray-500">
                            Used{" "}
                            <b className="font-semibold text-gray-900">
                              {balance.used}d
                            </b>
                          </span>
                          <span className="text-gray-500">
                            Carryover{" "}
                            <b className="font-semibold text-gray-900">
                              {balance.carryOver}d
                            </b>
                          </span>
                        </div>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${getBalanceUsagePercent(balance)}%`,
                              background: hex,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}

        {/* Admin panel */}
        {canAdjustBalances && (
          <TabsContent value="admin" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-950">
                    Adjust leave balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adminActionError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Action failed</AlertTitle>
                      <AlertDescription>{adminActionError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Leave Type *</Label>
                    <Select
                      value={adminBalanceForm.leaveType}
                      onValueChange={(v) =>
                        setAdminBalanceForm({
                          ...adminBalanceForm,
                          leaveType: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_LEAVE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {LEAVE_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>New Allocation (days) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 25"
                      value={adminBalanceForm.newBalance}
                      onChange={(e) =>
                        setAdminBalanceForm({
                          ...adminBalanceForm,
                          newBalance: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Change *</Label>
                    <Textarea
                      placeholder="Annual policy update, special allocation, correction..."
                      rows={3}
                      value={adminBalanceForm.reason}
                      onChange={(e) =>
                        setAdminBalanceForm({
                          ...adminBalanceForm,
                          reason: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Button
                    onClick={handleUpdateBalance}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                    Update Balance
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-950">
                    Current leave allocations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {leaveBalances
                      .filter((b) => b.employeeId === currentUserEmployeeId)
                      .map((balance) => {
                        const hex = LEAVE_TYPE_HEX[balance.leaveType];
                        return (
                          <div
                            key={balance.id}
                            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5"
                          >
                            <span
                              className="grid h-7 w-7 place-items-center rounded-lg"
                              style={{ background: `${hex}1f`, color: hex }}
                            >
                              {getLeaveTypeIcon(balance.leaveType)}
                            </span>
                            <span className="text-sm font-medium">
                              {LEAVE_TYPE_LABELS[balance.leaveType]}
                            </span>
                            <span className="ml-auto text-sm text-gray-500 tabular-nums">
                              {balance.remaining} left of
                            </span>
                            <span className="text-sm font-semibold tabular-nums">
                              {balance.allocated}d
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-950">
                  Recent balance adjustments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>Balance adjustment history will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Request review dialog — approve or decline */}
      <Dialog
        open={commentDialog.open}
        onOpenChange={(open) => {
          if (!open && !commentDialog.isSubmitting) closeCommentDialog();
        }}
      >
        <DialogContent className="min-h-0 max-w-lg gap-4 p-6">
          <DialogHeader className="gap-1">
            <DialogTitle>Review leave request</DialogTitle>
            <DialogDescription>
              Review the details below, then approve or decline this request.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const dialogRequest = leaveRequests.find(
              (r) => r.id === commentDialog.requestId
            );
            if (!dialogRequest) return null;
            const hrStage = dialogRequest.status === "lead_approved";
            return (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                {/* Who + type */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback
                      className="text-xs font-semibold text-white"
                      style={{
                        background: getAvatarColor(dialogRequest.employeeName),
                      }}
                    >
                      {getEmployeeInitials(dialogRequest.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">
                      {dialogRequest.employeeName}
                    </p>
                    <p className="text-xs text-gray-500 tabular-nums">
                      {formatDate(dialogRequest.startDate)} to{" "}
                      {formatDate(dialogRequest.endDate)} · {dialogRequest.days}{" "}
                      {dialogRequest.days === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <LeaveTypeChip type={dialogRequest.leaveType} />
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-200 pt-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Dates</p>
                    <p className="font-medium text-gray-900 tabular-nums">
                      {formatDate(dialogRequest.startDate)} –{" "}
                      {formatDate(dialogRequest.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Working days</p>
                    <p className="font-medium text-gray-900 tabular-nums">
                      {dialogRequest.days}{" "}
                      {dialogRequest.days === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="font-medium text-gray-900 tabular-nums">
                      {dialogRequest.submittedDate
                        ? formatDate(dialogRequest.submittedDate)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Covering colleague</p>
                    <p className="font-medium text-gray-900">
                      {dialogRequest.coveringEmployeeName?.trim() || "—"}
                    </p>
                  </div>
                </div>

                {/* Approval stage */}
                <div className="flex items-center gap-2 border-t border-gray-200 pt-3">
                  <span className="text-xs text-gray-500">Stage</span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className={`grid h-[18px] w-[18px] place-items-center rounded-full text-[10px] font-bold ${
                        hrStage
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {hrStage ? <Check className="h-2.5 w-2.5" /> : "1"}
                    </span>
                    <span className="text-gray-700">Lead</span>
                    <span className="h-0.5 w-4 bg-gray-200" />
                    <span
                      className={`grid h-[18px] w-[18px] place-items-center rounded-full text-[10px] font-bold ${
                        hrStage
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      2
                    </span>
                    <span className={hrStage ? "text-gray-700" : ""}>HR</span>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge(dialogRequest.status)}
                  </div>
                </div>

                {/* Reason */}
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500">Reason</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700">
                    {dialogRequest.reason?.trim() || "No reason provided"}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="space-y-1.5">
            <Label htmlFor="vacation-comment">Comment</Label>
            <Textarea
              id="vacation-comment"
              rows={3}
              placeholder="Add an optional comment (required when declining)..."
              value={commentDialog.comment}
              onChange={(e) =>
                setCommentDialog((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              disabled={commentDialog.isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={closeCommentDialog}
              disabled={commentDialog.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => runDecision("reject")}
              disabled={commentDialog.isSubmitting}
            >
              <X className="h-4 w-4" />
              {commentDialog.isSubmitting ? "Processing..." : "Decline"}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => runDecision(commentDialog.kind)}
              disabled={commentDialog.isSubmitting}
            >
              <Check className="h-4 w-4" />
              {commentDialog.isSubmitting
                ? "Processing..."
                : commentDialog.kind === "hr"
                  ? "Approve request"
                  : "Approve & send to HR"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
