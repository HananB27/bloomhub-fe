import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { QuickActionButton } from "./QuickActionButton";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Checkbox } from "./ui/checkbox";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { DatePicker } from "./DatePicker";
import {
  Package,
  Plus,
  Filter,
  Download,
  Search,
  User,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  XCircle,
  Laptop,
  Smartphone,
  Monitor,
  Headphones,
  Camera,
  Car,
  Wrench,
  Archive,
  RefreshCw,
  MapPin,
  Hash,
  Activity,
  TrendingUp,
  AlertTriangle,
  FileText,
  QrCode,
  Settings,
  History,
  CalendarDays,
  Building,
  UserCheck,
  Package2,
  List,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Tag,
  CircleDot,
  Clock,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/utils";
import { ApiError } from "@/utils/api";
import {
  approveAssetReturn,
  assignAssetToEmployee,
  cancelScheduledMaintenance,
  completeScheduledMaintenance,
  createAsset,
  createReplacementLog,
  createScheduledMaintenance,
  deleteAssetById,
  downloadAssetQrCode,
  exportAssetsCsv,
  getAssetCapabilities,
  getAssetFrontendUrl,
  listAssets,
  listAssignments,
  listAssignableUsers,
  listPendingReturnRequests,
  listReplacementLogs,
  listScheduledMaintenance,
  rejectAssetReturn,
  requestAssetReturn,
  updateAsset,
  updateReplacementLog,
  type AssetApiItem,
  type AssetAssignmentApiItem,
  type AssetCapabilities,
  type AssetItemCapabilities,
  type PendingReturnRequestApiItem,
  type AssetReplacementLogApiItem,
  type ScheduledMaintenanceApiItem,
  type ScheduledMaintenanceStatus,
  type ScheduledMaintenanceType,
} from "@/lib/api/assets";
import type { LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react";

type AssetStatus =
  | "active"
  | "returned"
  | "lost"
  | "damaged"
  | "maintenance"
  | "retired";
type AssetCategory =
  | "laptops"
  | "phones"
  | "monitors"
  | "headphones"
  | "cameras"
  | "vehicles"
  | "furniture"
  | "other";
type AssetCondition =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "damaged"
  | "unknown";

type ReplacementSnapshotValue = string | null | undefined;
type MaintenanceQueueTab =
  | "scheduled"
  | "due_today"
  | "overdue"
  | "completed"
  | "cancelled";

interface Asset {
  id: number;
  name: string;
  category: AssetCategory;
  serialNumber: string;
  assetTag: string;
  brand: string;
  model: string;
  description: string;
  image: string;
  purchaseDate: string;
  purchasePrice: number;
  warranty: string;
  status: AssetStatus;
  condition: AssetCondition;
  location: string;
  assignedTo?: string;
  assignedEmployeeName?: string;
  assignedDate?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  specifications: { [key: string]: string };
  qrCodePayload?: string;
  qrCodeUrl?: string;
  isAvailable?: boolean;
  capabilities?: AssetItemCapabilities;
}

interface Assignment {
  id: number;
  assetId: number;
  assetName?: string;
  assetTag?: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  employeeUsername?: string;
  assignedDate: string;
  returnedDate?: string;
  assignedBy: string;
  notes: string;
  condition: AssetCondition;
  isActive: boolean;
  returnRequestStatus: "none" | "pending" | "approved" | "rejected";
  returnRequestedAt?: string;
  returnReviewedAt?: string;
  returnRejectionReason?: string;
}

interface PendingReturnRequest {
  id: string;
  assignmentId: number;
  employeeName: string;
  assetName: string;
  assetTag?: string;
  requestedAt?: string;
  notes?: string;
  checklist: ReturnChecklistItem[];
}

interface ReturnChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
  notes?: string;
}

interface AssignableUser {
  id: string;
  name: string;
}

const ASSET_STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "retired", label: "Retired" },
];

const MAINTENANCE_ASSET_STATUS_OPTIONS: {
  value: "active" | "lost" | "returned" | "damaged" | "retired";
  label: string;
}[] = [
  { value: "active", label: "Active" },
  { value: "lost", label: "Lost" },
  { value: "returned", label: "Returned" },
  { value: "damaged", label: "Damaged" },
  { value: "retired", label: "Retired" },
];

const ASSET_CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "damaged", label: "Damaged" },
  { value: "unknown", label: "Unknown" },
];

const MAINTENANCE_TYPE_OPTIONS: {
  value: ScheduledMaintenanceType;
  label: string;
}[] = [
  { value: "preventive", label: "Preventive" },
  { value: "repair", label: "Repair" },
  { value: "inspection", label: "Inspection" },
  { value: "warranty", label: "Warranty" },
  { value: "replacement", label: "Replacement" },
  { value: "other", label: "Other" },
];

const MAINTENANCE_QUEUE_TABS: { value: MaintenanceQueueTab; label: string }[] =
  [
    { value: "scheduled", label: "Scheduled" },
    { value: "due_today", label: "Due Today" },
    { value: "overdue", label: "Overdue" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

const EMPTY_ASSET_CAPABILITIES: Required<
  NonNullable<AssetCapabilities["capabilities"]>
> = {
  can_view_any_assets: false,
  can_create_assets: false,
  can_update_assets: false,
  can_delete_assets: false,
  can_assign_assets: false,
  can_request_return: false,
  can_process_return: false,
  can_export_inventory: false,
  can_view_asset_history: false,
  can_update_asset_condition: false,
  can_generate_qr_codes: false,
  can_log_asset_replacement: false,
};

function toAssetCapabilities(value?: AssetCapabilities | null) {
  return {
    ...EMPTY_ASSET_CAPABILITIES,
    ...(value?.capabilities || {}),
  };
}

function getAssetCapability(
  asset: Asset | null | undefined,
  key: keyof AssetItemCapabilities
): boolean | undefined {
  const value = asset?.capabilities?.[key];
  return typeof value === "boolean" ? value : undefined;
}

function toAssetCategory(value?: string): AssetCategory {
  const allowed: AssetCategory[] = [
    "laptops",
    "phones",
    "monitors",
    "headphones",
    "cameras",
    "vehicles",
    "furniture",
    "other",
  ];

  if (!value) return "other";

  const normalized = value.trim().toLowerCase();
  const normalizedKey = normalized.replace(/[\s-]+/g, "_");
  const aliasMap: Record<string, AssetCategory> = {
    laptop: "laptops",
    phone: "phones",
    monitor: "monitors",
    headphone: "headphones",
    camera: "cameras",
    vehicle: "vehicles",
    other: "other",
    others: "other",
    misc: "other",
  };

  if (aliasMap[normalizedKey]) {
    return aliasMap[normalizedKey];
  }

  return allowed.includes(normalized as AssetCategory)
    ? (normalized as AssetCategory)
    : "other";
}

function toAssetStatus(value?: string): AssetStatus {
  const allowed: AssetStatus[] = [
    "active",
    "lost",
    "damaged",
    "maintenance",
    "retired",
  ];

  if (!value) return "active";

  const normalized = value.trim().toLowerCase();
  if (normalized === "available") return "active";

  return allowed.includes(normalized as AssetStatus)
    ? (normalized as AssetStatus)
    : "active";
}

function toApiAssetStatus(value: AssetStatus): AssetStatus {
  return value;
}

function normalizeAssetStatusForApi(
  value?: string | null
): "active" | "lost" | "returned" | "damaged" | "retired" | undefined {
  if (!value || value === "none" || value === "not_recorded") return undefined;
  if (value === "available") return "active";
  if (
    value === "active" ||
    value === "lost" ||
    value === "returned" ||
    value === "damaged" ||
    value === "retired"
  ) {
    return value;
  }

  return undefined;
}

function toApiAssetCondition(
  value: AssetCondition
): "excellent" | "good" | "fair" | "poor" | "damaged" {
  if (
    value === "excellent" ||
    value === "good" ||
    value === "fair" ||
    value === "poor" ||
    value === "damaged"
  ) {
    return value;
  }

  return "good";
}

function toPersonName(
  value?: {
    full_name?: string | null;
    user?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      username?: string;
    };
  } | null
): string {
  const fullName = value?.full_name?.trim();
  if (fullName) {
    return fullName;
  }

  const first = value?.user?.first_name?.trim() || "";
  const last = value?.user?.last_name?.trim() || "";
  const combined = `${first} ${last}`.trim();
  if (combined) {
    return combined;
  }

  return value?.user?.email || value?.user?.username || "Unknown";
}

function toKnownPersonName(
  value?: Parameters<typeof toPersonName>[0] | null
): string {
  const name = toPersonName(value);
  return name === "Unknown" ? "" : name;
}

function formatReplacementLogDate(date: string): string {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!dateOnlyMatch) {
    return formatDate(date);
  }

  const [, year, month, day] = dateOnlyMatch;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSnapshotValue(value: ReplacementSnapshotValue): string {
  if (typeof value !== "string" || !value.trim()) {
    return "Not recorded";
  }

  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAssetQrDownloadFilename(asset: Pick<Asset, "id" | "name">): string {
  const safeName =
    asset.name
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "Asset";

  return `${safeName}-${asset.id}-qr.png`;
}

function formatAssetDetailValue(value?: string | number | null): string {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "Not recorded";
  }

  return value && String(value).trim() ? String(value) : "Not recorded";
}

function formatMaintenanceType(value: ScheduledMaintenanceType): string {
  return (
    MAINTENANCE_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
    formatSnapshotValue(value)
  );
}

function formatDueState(value: ScheduledMaintenanceApiItem["due_state"]) {
  if (!value) {
    return "Not recorded";
  }

  return formatSnapshotValue(value);
}

function formatMaintenanceStatus(value: ScheduledMaintenanceStatus): string {
  return formatSnapshotValue(value);
}

function getMaintenanceStatusBadgeClass(value: ScheduledMaintenanceStatus) {
  switch (value) {
    case "scheduled":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "cancelled":
      return "border-gray-300 bg-gray-100 text-gray-800";
    default:
      return "border-gray-300 bg-gray-100 text-gray-800";
  }
}

function getMaintenanceDueBadgeClass(
  value: ScheduledMaintenanceApiItem["due_state"]
) {
  switch (value) {
    case "overdue":
      return "border-red-200 bg-red-50 text-red-800";
    case "due_today":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "upcoming":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    default:
      return "border-gray-300 bg-gray-100 text-gray-800";
  }
}

function getTodayDateValue(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function mapReturnChecklistFromApi(value: unknown): ReturnChecklistItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const item = toRecord(entry);
    if (!item) {
      return {
        id: String(index),
        label: String(entry || `Checklist item ${index + 1}`),
        required: false,
        checked: false,
      };
    }

    const label =
      toOptionalString(item.label) ||
      toOptionalString(item.name) ||
      toOptionalString(item.title) ||
      `Checklist item ${index + 1}`;

    return {
      id: String(item.id || index),
      label,
      required: Boolean(item.required),
      checked: Boolean(item.checked),
      notes: toOptionalString(item.notes),
    };
  });
}

function toAssetCondition(value?: string): AssetCondition {
  const allowed: AssetCondition[] = [
    "excellent",
    "good",
    "fair",
    "poor",
    "damaged",
    "unknown",
  ];

  if (!value) return "unknown";

  const normalized = value.trim().toLowerCase();
  return allowed.includes(normalized as AssetCondition)
    ? (normalized as AssetCondition)
    : "unknown";
}

function mapAssetFromApi(item: AssetApiItem): Asset {
  const currentAssignment =
    item.current_assignment && typeof item.current_assignment === "object"
      ? (item.current_assignment as Record<string, unknown>)
      : null;
  const currentAssignmentEmployeeId =
    typeof currentAssignment?.employee_id === "number"
      ? String(currentAssignment.employee_id)
      : typeof currentAssignment?.employee === "number"
        ? String(currentAssignment.employee)
        : undefined;
  const currentAssignmentEmployeeName =
    typeof currentAssignment?.employee_name === "string"
      ? currentAssignment.employee_name
      : undefined;
  const currentAssignmentAssignedDate =
    typeof currentAssignment?.assigned_date === "string"
      ? currentAssignment.assigned_date
      : typeof currentAssignment?.assigned_at === "string"
        ? currentAssignment.assigned_at
        : undefined;
  const fallbackStatus = item.current_assignment
    ? "active"
    : item.is_available
      ? "available"
      : undefined;
  const qrCodePayload = item.qr_code_payload?.startsWith("/")
    ? `${getAssetFrontendUrl(item.id).replace(/\/assets\/\d+$/, "")}${item.qr_code_payload}`
    : item.qr_code_payload || getAssetFrontendUrl(item.id);

  return {
    id: item.id,
    name: item.name,
    category: toAssetCategory(item.category),
    serialNumber: item.serial_number || "",
    assetTag: item.asset_id || item.asset_tag || `AT-${item.id}`,
    brand: item.manufacturer || item.brand || "",
    model: item.model || "",
    description: item.description || "",
    image:
      item.image ||
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
    purchaseDate: item.purchase_date || "",
    purchasePrice: Number(item.purchase_price || 0),
    warranty: item.warranty_until || item.warranty || "",
    status: toAssetStatus(item.status || fallbackStatus),
    condition: toAssetCondition(item.condition),
    location: item.location || "IT Storage Room",
    assignedTo: item.assigned_to || currentAssignmentEmployeeId,
    assignedEmployeeName:
      item.assigned_employee_name || currentAssignmentEmployeeName,
    assignedDate: item.assigned_date || currentAssignmentAssignedDate,
    lastMaintenance: item.last_maintenance,
    nextMaintenance: item.next_maintenance,
    specifications: item.specifications || {},
    qrCodePayload,
    qrCodeUrl: item.qr_code_url || undefined,
    isAvailable: item.is_available,
    capabilities: item.capabilities,
  };
}

function mapAssignmentFromApi(item: AssetAssignmentApiItem): Assignment {
  const assetId = item.asset_id || item.asset || item.asset_details?.id || 0;
  const employeeId =
    item.employee_id ||
    (typeof item.employee === "number" ? String(item.employee) : "") ||
    (typeof item.employee_details?.id === "number"
      ? String(item.employee_details.id)
      : "");
  const assignedDate =
    item.assigned_date ||
    item.assigned_at ||
    new Date().toISOString().split("T")[0];
  const returnedDate = item.returned_date || item.returned_at;

  return {
    id: item.id,
    assetId,
    assetName: item.asset_details?.name?.trim() || undefined,
    assetTag: item.asset_details?.asset_id?.trim() || undefined,
    employeeId,
    employeeName: item.employee_name || toPersonName(item.employee_details),
    employeeEmail: item.employee_details?.user?.email,
    employeeUsername: item.employee_details?.user?.username,
    assignedDate,
    returnedDate,
    assignedBy:
      (typeof item.assigned_by === "string" ? item.assigned_by : undefined) ||
      toPersonName(item.assigned_by_details) ||
      "System",
    notes: item.notes || "",
    condition: toAssetCondition(
      item.return_condition || item.condition || item.asset_details?.condition
    ),
    isActive: item.is_active ?? !returnedDate,
    returnRequestStatus: item.return_request_status || "none",
    returnRequestedAt: item.return_requested_at || undefined,
    returnReviewedAt: item.return_reviewed_at || undefined,
    returnRejectionReason: item.return_rejection_reason || undefined,
  };
}

function applyActiveAssignmentsToAssets(
  assets: Asset[],
  assignments: Assignment[]
): Asset[] {
  const activeAssignmentsByAssetId = new Map<number, Assignment>();

  assignments.forEach((assignment) => {
    if (assignment.isActive) {
      activeAssignmentsByAssetId.set(assignment.assetId, assignment);
    }
  });

  return assets.map((asset) =>
    applyActiveAssignmentToAsset(
      asset,
      activeAssignmentsByAssetId.get(asset.id)
    )
  );
}

function applyActiveAssignmentToAsset(
  asset: Asset,
  activeAssignment?: Assignment
): Asset {
  if (!activeAssignment) {
    return asset;
  }

  return {
    ...asset,
    assignedTo: activeAssignment.employeeId,
    assignedEmployeeName: activeAssignment.employeeName,
    assignedDate: activeAssignment.assignedDate,
    status: asset.status,
  };
}

function mapPendingReturnRequestFromApi(
  item: PendingReturnRequestApiItem
): PendingReturnRequest {
  const assignmentId =
    toOptionalNumber(item.assignment_id) ||
    toOptionalNumber(item.assignment) ||
    toOptionalNumber(toRecord(item.assignment)?.id) ||
    toOptionalNumber(item.assignment_details?.id) ||
    0;
  const requestId = String(item.id || assignmentId);
  const returnRequested = toRecord(item.return_requested);
  const assignmentReturnRequested = toRecord(
    item.assignment_details?.return_requested
  );

  return {
    id: requestId,
    assignmentId,
    employeeName:
      item.employee_name ||
      toKnownPersonName(item.employee) ||
      toKnownPersonName(item.employee_details) ||
      item.assignment_details?.employee_name ||
      toKnownPersonName(item.assignment_details?.employee_details) ||
      "Unknown employee",
    assetName:
      item.asset_name ||
      item.asset?.name ||
      item.asset_details?.name ||
      item.assignment_details?.asset_details?.name ||
      "Unknown asset",
    assetTag:
      item.asset?.asset_id ||
      item.asset?.asset_tag ||
      item.asset_details?.asset_id ||
      item.assignment_details?.asset_details?.asset_id ||
      undefined,
    requestedAt:
      item.return_requested_at ||
      item.requested_at ||
      item.assignment_details?.return_requested_at ||
      undefined,
    notes:
      item.return_description ||
      toOptionalString(returnRequested?.return_description) ||
      toOptionalString(returnRequested?.notes) ||
      item.assignment_details?.return_description ||
      toOptionalString(assignmentReturnRequested?.return_description) ||
      toOptionalString(assignmentReturnRequested?.notes) ||
      item.notes ||
      item.assignment_details?.notes ||
      undefined,
    checklist: mapReturnChecklistFromApi(
      item.return_checklist ||
        returnRequested?.return_checklist ||
        returnRequested?.checklist ||
        item.assignment_details?.return_checklist ||
        assignmentReturnRequested?.return_checklist ||
        assignmentReturnRequested?.checklist
    ),
  };
}

function isAssetAssignable(asset: Asset): boolean {
  if (asset.isAvailable === false) {
    return false;
  }

  if (asset.assignedTo) {
    return false;
  }

  return asset.status !== "damaged";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }

  const details =
    error.details && typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : null;

  if (!details) {
    return {};
  }

  return Object.entries(details).reduce<Record<string, string>>(
    (errors, [field, value]) => {
      if (Array.isArray(value)) {
        const message = value.filter(Boolean).join(" ");
        if (message) {
          errors[field] = message;
        }
      } else if (typeof value === "string" && value.trim()) {
        errors[field] = value;
      }

      return errors;
    },
    {}
  );
}

const ADD_ASSET_LIGHT_FIELD_CLASS =
  "!bg-white !text-gray-900 !border-gray-300 placeholder:!text-gray-500 dark:!bg-white dark:!text-gray-900 dark:!border-gray-300";
const ADD_ASSET_LIGHT_SURFACE_CLASS =
  "!bg-white !text-gray-900 !border-gray-200 dark:!bg-white dark:!text-gray-900 dark:!border-gray-200";
const ADD_ASSET_LIGHT_ITEM_CLASS =
  "!text-gray-900 data-[highlighted]:!bg-gray-100 dark:!text-gray-900 dark:data-[highlighted]:!bg-gray-100";
const ADD_ASSET_LIGHT_LABEL_CLASS = "!text-gray-700 dark:!text-gray-700";
const ASSET_DETAILS_LABEL_CLASS =
  "text-xs font-medium uppercase tracking-wide text-gray-600";
const ASSET_DETAILS_VALUE_CLASS = "mt-1 text-sm font-semibold text-black";
const ASSET_DETAILS_FIELD_LABEL_CLASS = "text-xs font-semibold text-gray-900";
const ASSET_DETAILS_FIELD_VALUE_CLASS =
  "min-h-8 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-normal text-gray-900";
const FORCED_LIGHT_SURFACE_STYLE: CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#111827",
  borderColor: "#e5e7eb",
  opacity: 1,
};

export function AssetsModule() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("assets");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState<
    "total" | "active" | "available" | "maintenance" | "issues"
  >("total");
  const [inventoryView, setInventoryView] = useState<"table" | "grid">("table");
  const [inventorySortKey, setInventorySortKey] = useState<
    | "name"
    | "category"
    | "owner"
    | "location"
    | "value"
    | "condition"
    | "status"
  >("name");
  const [inventorySortDir, setInventorySortDir] = useState<"asc" | "desc">(
    "asc"
  );
  const [assignmentAssetFilter, setAssignmentAssetFilter] = useState("");
  const [assignmentEmployeeFilter, setAssignmentEmployeeFilter] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [isAssignmentDetailsDialogOpen, setIsAssignmentDetailsDialogOpen] =
    useState(false);
  const [isAssignmentFormDialogOpen, setIsAssignmentFormDialogOpen] =
    useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedReturnRequest, setSelectedReturnRequest] =
    useState<PendingReturnRequest | null>(null);
  const [isReturnRequestDetailsOpen, setIsReturnRequestDetailsOpen] =
    useState(false);
  const [returnRejectionReason, setReturnRejectionReason] = useState("");
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [isAssetDetailsDialogOpen, setIsAssetDetailsDialogOpen] =
    useState(false);
  const [isEditAssetDialogOpen, setIsEditAssetDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isExportingAssets, setIsExportingAssets] = useState(false);
  const [downloadingQrCodeAssetId, setDownloadingQrCodeAssetId] = useState<
    number | null
  >(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [qrCodePreviewUrl, setQrCodePreviewUrl] = useState<string | null>(null);
  const [isQrCodePreviewLoading, setIsQrCodePreviewLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [deleteTargetAssetId, setDeleteTargetAssetId] = useState<number | null>(
    null
  );
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Return checklist state
  const [returnChecklist, setReturnChecklist] = useState<ReturnChecklistItem[]>(
    [
      {
        id: "physical",
        label: "Physical condition check",
        required: true,
        checked: false,
      },
      {
        id: "accessories",
        label: "All accessories included",
        required: true,
        checked: false,
      },
      {
        id: "data",
        label: "Data wiped/backed up",
        required: true,
        checked: false,
      },
      {
        id: "charger",
        label: "Original charger included",
        required: false,
        checked: false,
      },
      {
        id: "case",
        label: "Protective case/bag included",
        required: false,
        checked: false,
      },
      {
        id: "software",
        label: "Software licenses deactivated",
        required: true,
        checked: false,
      },
      {
        id: "documentation",
        label: "User manual/documentation",
        required: false,
        checked: false,
      },
    ]
  );

  const [returnNotes, setReturnNotes] = useState("");

  // Add asset form state
  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "" as AssetCategory,
    serialNumber: "",
    assetTag: "",
    brand: "",
    model: "",
    description: "",
    purchaseDate: "",
    purchasePrice: "",
    warranty: "",
    location: "",
    specifications: "",
    condition: "good" as AssetCondition,
    status: "active" as AssetStatus,
  });

  const [editAsset, setEditAsset] = useState({
    name: "",
    category: "" as AssetCategory,
    serialNumber: "",
    assetTag: "",
    brand: "",
    model: "",
    description: "",
    purchaseDate: "",
    purchasePrice: "",
    warranty: "",
    location: "",
    specifications: "",
    condition: "unknown" as AssetCondition,
    status: "active" as AssetStatus,
  });

  const [assignmentForm, setAssignmentForm] = useState({
    assetId: "",
    employeeId: "",
    notes: "",
  });

  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [isLoadingAssignableUsers, setIsLoadingAssignableUsers] =
    useState(false);
  const [replacementLogs, setReplacementLogs] = useState<
    AssetReplacementLogApiItem[]
  >([]);
  const [inventoryReplacementLogs, setInventoryReplacementLogs] = useState<
    AssetReplacementLogApiItem[]
  >([]);
  const [isLoadingReplacementLogs, setIsLoadingReplacementLogs] =
    useState(false);
  const [isReplacementFormOpen, setIsReplacementFormOpen] = useState(false);
  const [isCreatingReplacementLog, setIsCreatingReplacementLog] =
    useState(false);
  const [replacementForm, setReplacementForm] = useState({
    date: "",
    reason: "",
    replacementAssetId: "none",
    cost: "",
    assetStatusBefore: "none",
    assetStatusAfter: "none",
    assetConditionBefore: "none",
    assetConditionAfter: "none",
  });
  const [editingReplacementLogId, setEditingReplacementLogId] = useState<
    number | null
  >(null);
  const [isUpdatingReplacementLog, setIsUpdatingReplacementLog] =
    useState(false);
  const [replacementEditForm, setReplacementEditForm] = useState({
    assetId: "",
    date: "",
    reason: "",
    replacementAssetId: "none",
    cost: "",
    assetStatusBefore: "none",
    assetStatusAfter: "none",
    assetConditionBefore: "none",
    assetConditionAfter: "none",
  });
  const [replacementEditErrors, setReplacementEditErrors] = useState<
    Record<string, string>
  >({});
  const [scheduledMaintenance, setScheduledMaintenance] = useState<
    ScheduledMaintenanceApiItem[]
  >([]);
  const [
    selectedAssetScheduledMaintenance,
    setSelectedAssetScheduledMaintenance,
  ] = useState<ScheduledMaintenanceApiItem[]>([]);
  const [isLoadingScheduledMaintenance, setIsLoadingScheduledMaintenance] =
    useState(false);
  const [maintenanceQueueTab, setMaintenanceQueueTab] =
    useState<MaintenanceQueueTab>("scheduled");
  const [maintenanceQueueSearchTerm, setMaintenanceQueueSearchTerm] =
    useState("");
  const [maintenanceQueueTypeFilter, setMaintenanceQueueTypeFilter] = useState<
    ScheduledMaintenanceType | "all"
  >("all");
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    assetId: "",
    dueDate: "",
    reason: "",
    maintenanceType: "preventive" as ScheduledMaintenanceType,
    ownerId: "none",
    estimatedCost: "",
    vendor: "",
  });
  const [isSubmittingMaintenance, setIsSubmittingMaintenance] = useState(false);
  const [maintenanceActionTarget, setMaintenanceActionTarget] =
    useState<ScheduledMaintenanceApiItem | null>(null);
  const [maintenanceCompletionForm, setMaintenanceCompletionForm] = useState({
    date: getTodayDateValue(),
    reason: "",
    cost: "",
    replacementAssetId: "none",
    assetStatusBefore: "none",
    assetStatusAfter: "none",
    assetConditionBefore: "none",
    assetConditionAfter: "none",
  });
  const [isCompletingMaintenance, setIsCompletingMaintenance] = useState(false);
  const [maintenanceCancelTarget, setMaintenanceCancelTarget] =
    useState<ScheduledMaintenanceApiItem | null>(null);
  const [maintenanceCancelReason, setMaintenanceCancelReason] = useState("");
  const [isCancellingMaintenance, setIsCancellingMaintenance] = useState(false);

  const [assets, setAssets] = useState<Asset[]>([]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingReturnRequests, setPendingReturnRequests] = useState<
    PendingReturnRequest[]
  >([]);
  const [assetCapabilities, setAssetCapabilities] =
    useState<AssetCapabilities | null>(null);
  const isAssetsMountedRef = useRef(true);

  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  const sessionUser = (
    session as {
      user?: {
        employee_id?: string | number | null;
        id?: string | number | null;
        email?: string | null;
        username?: string | null;
      };
    } | null
  )?.user;
  const currentEmployeeId =
    sessionUser?.employee_id !== undefined && sessionUser.employee_id !== null
      ? String(sessionUser.employee_id)
      : undefined;
  const currentUserId =
    sessionUser?.id !== undefined && sessionUser.id !== null
      ? String(sessionUser.id)
      : undefined;
  const currentUserEmail = sessionUser?.email?.trim().toLowerCase();
  const currentUsername = sessionUser?.username?.trim().toLowerCase();
  const globalAssetCapabilities = toAssetCapabilities(assetCapabilities);
  const canViewAnyAssets = globalAssetCapabilities.can_view_any_assets;
  const canCreateAssets = globalAssetCapabilities.can_create_assets;
  const canUpdateAssets = globalAssetCapabilities.can_update_assets;
  const canDeleteAssets = globalAssetCapabilities.can_delete_assets;
  const canProcessReturn = globalAssetCapabilities.can_process_return;
  const canGenerateQr = globalAssetCapabilities.can_generate_qr_codes;
  const canExportInventory = globalAssetCapabilities.can_export_inventory;
  const canAssignAssets = globalAssetCapabilities.can_assign_assets;
  const canUpdateAssetCondition =
    globalAssetCapabilities.can_update_asset_condition;
  const canViewAssetHistory = globalAssetCapabilities.can_view_asset_history;
  const hasViewOwnAssetsPermission = Boolean(
    assetCapabilities?.permissions?.includes("view_own_assets")
  );
  const hasScheduledMaintenanceAccess = Boolean(
    canViewAssetHistory ||
    hasViewOwnAssetsPermission ||
    ["own", "team", "all"].includes(
      String(assetCapabilities?.scope || "").toLowerCase()
    )
  );
  const hasLogReplacementPermission = Boolean(
    assetCapabilities?.permissions?.includes("log_asset_replacement")
  );
  const canManageMaintenance = Boolean(
    globalAssetCapabilities.can_log_asset_replacement ||
    hasLogReplacementPermission
  );
  const canLogReplacement =
    getAssetCapability(selectedAsset, "can_log_replacement") ??
    canManageMaintenance;
  const canConfigureAssetTypes = Boolean(
    canCreateAssets || canUpdateAssets || canDeleteAssets
  );
  const assignableAssets = assets.filter(
    (asset) =>
      isAssetAssignable(asset) &&
      (getAssetCapability(asset, "can_assign") ?? canAssignAssets)
  );
  const selectedAssignmentAsset = selectedAssignment
    ? assets.find((asset) => asset.id === selectedAssignment.assetId) || null
    : null;
  const selectedAssignmentAssetName =
    selectedAssignmentAsset?.name ||
    selectedAssignment?.assetName ||
    (selectedAssignment?.assetId
      ? `Deleted Asset #${selectedAssignment.assetId}`
      : "Deleted Asset");
  const selectedAssignmentAssetTag =
    selectedAssignmentAsset?.assetTag ||
    selectedAssignment?.assetTag ||
    (selectedAssignment?.assetId ? `ID-${selectedAssignment.assetId}` : "N/A");
  const selectedAssignmentDuration =
    selectedAssignment &&
    Math.ceil(
      (new Date(selectedAssignment.returnedDate || new Date()).getTime() -
        new Date(selectedAssignment.assignedDate).getTime()) /
        (1000 * 3600 * 24)
    );
  const replacementAssetOptions = selectedAsset
    ? assets.filter((asset) => asset.id !== selectedAsset.id)
    : [];
  const editReplacementAssetOptions = replacementEditForm.assetId
    ? assets.filter((asset) => String(asset.id) !== replacementEditForm.assetId)
    : assets;
  const maintenanceRelatedAssetOptions = maintenanceActionTarget
    ? assets.filter((asset) => asset.id !== maintenanceActionTarget.asset)
    : assets;
  const visibleScheduledMaintenance = scheduledMaintenance.filter((item) => {
    const normalizedSearchTerm = maintenanceQueueSearchTerm
      .trim()
      .toLowerCase();
    const ownerName = toKnownPersonName(item.owner_details).toLowerCase();
    const creatorName = toKnownPersonName(
      item.created_by_details
    ).toLowerCase();
    const assetName = (item.asset_details?.name || "").toLowerCase();
    const assetTag = (item.asset_details?.asset_tag || "").toLowerCase();
    const assetSerial = (item.asset_details?.serial_number || "").toLowerCase();
    const matchesSearch =
      !normalizedSearchTerm ||
      assetName.includes(normalizedSearchTerm) ||
      assetTag.includes(normalizedSearchTerm) ||
      assetSerial.includes(normalizedSearchTerm) ||
      ownerName.includes(normalizedSearchTerm) ||
      creatorName.includes(normalizedSearchTerm);
    const matchesType =
      maintenanceQueueTypeFilter === "all" ||
      item.maintenance_type === maintenanceQueueTypeFilter;

    if (!matchesSearch || !matchesType) {
      return false;
    }

    if (maintenanceQueueTab === "due_today") {
      return item.status === "scheduled" && item.due_state === "due_today";
    }

    if (maintenanceQueueTab === "overdue") {
      return item.status === "scheduled" && item.due_state === "overdue";
    }

    return item.status === maintenanceQueueTab;
  });

  const loadAssetsAndAssignments = useCallback(async () => {
    setIsLoadingAssets(true);
    setApiError(null);

    let capabilitiesPayload: AssetCapabilities;

    try {
      capabilitiesPayload = await getAssetCapabilities(accessToken);
    } catch (error: unknown) {
      if (!isAssetsMountedRef.current) {
        return;
      }

      setAssetCapabilities(null);
      setAssets([]);
      setAssignments([]);
      setPendingReturnRequests([]);
      setScheduledMaintenance([]);
      setInventoryReplacementLogs([]);
      setApiError(getErrorMessage(error, "Failed to load asset permissions."));
      setIsLoadingAssets(false);
      return;
    }

    if (!isAssetsMountedRef.current) {
      return;
    }

    setAssetCapabilities(capabilitiesPayload);

    const loadedCapabilities = toAssetCapabilities(capabilitiesPayload);
    const normalizedScope = String(
      capabilitiesPayload.scope || ""
    ).toLowerCase();
    const hasScopedViewAccess = ["own", "team", "all"].includes(
      normalizedScope
    );
    if (!loadedCapabilities.can_view_any_assets && !hasScopedViewAccess) {
      setAssets([]);
      setAssignments([]);
      setPendingReturnRequests([]);
      setScheduledMaintenance([]);
      setInventoryReplacementLogs([]);
      setIsLoadingAssets(false);
      return;
    }

    try {
      const [
        assetsPayload,
        assignmentsPayload,
        pendingReturnsPayload,
        scheduledMaintenancePayload,
      ] = await Promise.all([
        listAssets(accessToken),
        listAssignments(accessToken).catch(() => []),
        loadedCapabilities.can_process_return
          ? listPendingReturnRequests(accessToken).catch(() => [])
          : Promise.resolve([]),
        loadedCapabilities.can_view_asset_history ||
        capabilitiesPayload.permissions?.includes("view_own_assets") ||
        hasScopedViewAccess
          ? listScheduledMaintenance(undefined, accessToken).catch(() => [])
          : Promise.resolve([]),
      ]);

      if (!isAssetsMountedRef.current) {
        return;
      }

      const mappedAssignments = assignmentsPayload.map(mapAssignmentFromApi);
      setAssets(
        applyActiveAssignmentsToAssets(
          assetsPayload.map(mapAssetFromApi),
          mappedAssignments
        )
      );
      setAssignments(mappedAssignments);
      setPendingReturnRequests(
        pendingReturnsPayload.map(mapPendingReturnRequestFromApi)
      );
      setScheduledMaintenance(scheduledMaintenancePayload);
    } catch (error: unknown) {
      if (!isAssetsMountedRef.current) {
        return;
      }
      setApiError(getErrorMessage(error, "Failed to load asset inventory."));
    } finally {
      if (isAssetsMountedRef.current) {
        setIsLoadingAssets(false);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    isAssetsMountedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void loadAssetsAndAssignments();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      isAssetsMountedRef.current = false;
    };
  }, [loadAssetsAndAssignments]);

  const loadInventoryReplacementLogs = useCallback(async () => {
    if (!(canViewAssetHistory || canManageMaintenance)) {
      setInventoryReplacementLogs([]);
      return;
    }

    setIsLoadingReplacementLogs(true);
    try {
      const logs = await listReplacementLogs(undefined, accessToken);
      if (isAssetsMountedRef.current) {
        setInventoryReplacementLogs(logs);
      }
    } catch (error: unknown) {
      if (isAssetsMountedRef.current) {
        setApiError(getErrorMessage(error, "Failed to load replacement logs."));
      }
    } finally {
      if (isAssetsMountedRef.current) {
        setIsLoadingReplacementLogs(false);
      }
    }
  }, [accessToken, canManageMaintenance, canViewAssetHistory]);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    setQrCodePreviewUrl(null);
    setQrCodeError(null);

    if (!isAssetDetailsDialogOpen || !selectedAsset?.qrCodeUrl) {
      setIsQrCodePreviewLoading(false);
      return;
    }

    setIsQrCodePreviewLoading(true);

    void downloadAssetQrCode(selectedAsset.id, accessToken)
      .then(({ blob }) => {
        if (isCancelled) {
          return;
        }

        objectUrl = window.URL.createObjectURL(blob);
        setQrCodePreviewUrl(objectUrl);
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setQrCodeError(getErrorMessage(error, "Failed to load QR code."));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsQrCodePreviewLoading(false);
        }
      });

    return () => {
      isCancelled = true;

      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    accessToken,
    isAssetDetailsDialogOpen,
    selectedAsset?.id,
    selectedAsset?.qrCodeUrl,
  ]);

  const categories: {
    value: AssetCategory;
    label: string;
    icon: LucideIcon;
  }[] = [
    { value: "laptops", label: "Laptops", icon: Laptop },
    { value: "phones", label: "Phones", icon: Smartphone },
    { value: "monitors", label: "Monitors", icon: Monitor },
    { value: "headphones", label: "Headphones", icon: Headphones },
    { value: "cameras", label: "Cameras", icon: Camera },
    { value: "vehicles", label: "Vehicles", icon: Car },
    { value: "furniture", label: "Furniture", icon: Building },
    { value: "other", label: "Other", icon: Package2 },
  ];

  const ownerOptions = (() => {
    const seen = new Map<string, string>();
    assets.forEach((asset) => {
      if (asset.assignedTo) {
        seen.set(
          asset.assignedTo,
          asset.assignedEmployeeName || asset.assignedTo
        );
      }
    });
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  const locationOptions = Array.from(
    new Set(assets.map((asset) => asset.location).filter(Boolean))
  ).sort();

  const filteredAssets = assets
    .filter((asset) => {
      const normalizedSearchTerm = searchTerm.toLowerCase();
      const matchesSearch =
        asset.name.toLowerCase().includes(normalizedSearchTerm) ||
        asset.serialNumber.toLowerCase().includes(normalizedSearchTerm) ||
        asset.assetTag.toLowerCase().includes(normalizedSearchTerm) ||
        asset.brand.toLowerCase().includes(normalizedSearchTerm) ||
        asset.model.toLowerCase().includes(normalizedSearchTerm) ||
        (asset.assignedEmployeeName || "")
          .toLowerCase()
          .includes(normalizedSearchTerm) ||
        (asset.assignedTo || "").toLowerCase().includes(normalizedSearchTerm);
      const matchesCategory =
        categoryFilter === "all" || asset.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || asset.status === statusFilter;
      const matchesCondition =
        conditionFilter === "all" || asset.condition === conditionFilter;
      const matchesOwner =
        ownerFilter === "all" ||
        (ownerFilter === "unassigned"
          ? !asset.assignedTo
          : asset.assignedTo === ownerFilter);
      const matchesLocation =
        locationFilter === "all" || asset.location === locationFilter;
      const matchesQuick =
        quickFilter === "total" ||
        (quickFilter === "active" && asset.status === "active") ||
        (quickFilter === "available" && asset.isAvailable) ||
        (quickFilter === "maintenance" && asset.status === "maintenance") ||
        (quickFilter === "issues" &&
          (asset.status === "lost" || asset.status === "damaged"));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesCondition &&
        matchesOwner &&
        matchesLocation &&
        matchesQuick
      );
    })
    .sort((a, b) => {
      const dir = inventorySortDir === "desc" ? -1 : 1;
      const getValue = (asset: Asset): string | number => {
        switch (inventorySortKey) {
          case "value":
            return asset.purchasePrice;
          case "owner":
            return (asset.assignedEmployeeName || "zzz").toLowerCase();
          case "category":
            return asset.category;
          case "status":
            return asset.status;
          case "condition":
            return asset.condition;
          case "location":
            return (asset.location || "").toLowerCase();
          default:
            return asset.name.toLowerCase();
        }
      };
      const x = getValue(a);
      const y = getValue(b);
      if (x < y) return -1 * dir;
      if (x > y) return 1 * dir;
      return 0;
    });

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    conditionFilter !== "all" ||
    ownerFilter !== "all" ||
    locationFilter !== "all" ||
    quickFilter !== "total";

  const clearInventoryFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setConditionFilter("all");
    setOwnerFilter("all");
    setLocationFilter("all");
    setQuickFilter("total");
  };

  const toggleInventorySort = (key: typeof inventorySortKey) => {
    if (inventorySortKey === key) {
      setInventorySortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setInventorySortKey(key);
      setInventorySortDir("asc");
    }
  };

  const renderSortableHead = (
    key: typeof inventorySortKey,
    label: string,
    rightAlign = false
  ) => {
    const isActive = inventorySortKey === key;
    const SortIcon = !isActive
      ? ChevronsUpDown
      : inventorySortDir === "asc"
        ? ArrowUp
        : ArrowDown;
    return (
      <TableHead
        className={`am-sortable ${isActive ? "am-th-active" : ""} ${
          rightAlign ? "text-right" : ""
        }`}
        aria-sort={
          isActive
            ? inventorySortDir === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        onClick={() => toggleInventorySort(key)}
      >
        <span
          className="am-th-inner"
          style={rightAlign ? { flexDirection: "row-reverse" } : undefined}
        >
          {label}
          <SortIcon className="am-sort-ic h-3 w-3" />
        </span>
      </TableHead>
    );
  };

  const ASSET_TAG_PREFIX: Record<AssetCategory, string> = {
    laptops: "LAP",
    phones: "PHN",
    monitors: "MON",
    headphones: "AUD",
    cameras: "CAM",
    vehicles: "VEH",
    furniture: "FUR",
    other: "GEN",
  };

  const computeNextAssetTag = (category: AssetCategory): string => {
    const prefix = ASSET_TAG_PREFIX[category] || "GEN";
    const stem = `BTQ-${prefix}-`;
    const used = assets
      .map((asset) => asset.assetTag)
      .filter((tag) => tag && tag.startsWith(stem))
      .map((tag) => parseInt(tag.split("-")[2] ?? "", 10) || 0);
    const next = (used.length ? Math.max(...used) : 0) + 1;
    return `${stem}${String(next).padStart(3, "0")}`;
  };

  const renderFormSection = (
    SectionIcon: LucideIcon,
    title: string,
    hint?: string
  ) => (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.04em] text-gray-900">
        <SectionIcon className="h-3.5 w-3.5 text-gray-400" />
        {title}
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );

  const getAssignmentAssetName = (assignment: Assignment): string => {
    const asset = assets.find((item) => item.id === assignment.assetId);
    if (asset?.name) {
      return asset.name;
    }
    if (assignment.assetName) {
      return assignment.assetName;
    }
    return assignment.assetId
      ? `Deleted Asset #${assignment.assetId}`
      : "Deleted Asset";
  };

  const getAssignmentAssetTag = (assignment: Assignment): string => {
    const asset = assets.find((item) => item.id === assignment.assetId);
    if (asset?.assetTag) {
      return asset.assetTag;
    }
    if (assignment.assetTag) {
      return assignment.assetTag;
    }
    return assignment.assetId ? `ID-${assignment.assetId}` : "Unknown ID";
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const assetFilter = assignmentAssetFilter.trim().toLowerCase();
    const employeeFilter = assignmentEmployeeFilter.trim().toLowerCase();
    const assignmentAssetName = getAssignmentAssetName(assignment);
    const assignmentAssetTag = getAssignmentAssetTag(assignment);
    const matchesAsset =
      !assetFilter ||
      assignmentAssetName.toLowerCase().includes(assetFilter) ||
      assignmentAssetTag.toLowerCase().includes(assetFilter);
    const matchesEmployee =
      !employeeFilter ||
      assignment.employeeName.toLowerCase().includes(employeeFilter) ||
      assignment.employeeEmail?.toLowerCase().includes(employeeFilter) ||
      assignment.employeeUsername?.toLowerCase().includes(employeeFilter);
    const matchesStatus =
      assignmentStatusFilter === "all" ||
      (assignmentStatusFilter === "active" && assignment.isActive) ||
      (assignmentStatusFilter === "returned" && !assignment.isActive);

    return matchesAsset && matchesEmployee && matchesStatus;
  });

  const hasActiveAssignmentFilters =
    assignmentAssetFilter.trim().length > 0 ||
    assignmentEmployeeFilter.trim().length > 0 ||
    assignmentStatusFilter !== "all";

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "damaged":
        return "bg-amber-100 text-amber-800";
      case "maintenance":
        return "bg-purple-100 text-purple-800";
      case "retired":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: AssetStatus) => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "lost":
        return AlertCircle;
      case "damaged":
        return XCircle;
      case "maintenance":
        return Wrench;
      case "retired":
        return Archive;
      default:
        return Package;
    }
  };

  const getConditionColor = (condition: AssetCondition) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-amber-100 text-amber-800";
      case "poor":
        return "bg-red-100 text-red-800";
      case "damaged":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const getCategoryIcon = (category: AssetCategory) => {
    const categoryData = categories.find((cat) => cat.value === category);
    return categoryData?.icon || Package;
  };

  const getActiveAssignmentForAsset = (assetId: number) =>
    assignments.find(
      (assignment) => assignment.assetId === assetId && assignment.isActive
    );

  const isAssetCurrentlyAssigned = (asset: Asset) =>
    Boolean(getActiveAssignmentForAsset(asset.id));

  const isAssignmentForCurrentUser = (assignment?: Assignment | null) => {
    if (!assignment) {
      return false;
    }

    const employeeId = assignment.employeeId
      ? String(assignment.employeeId)
      : "";
    const employeeEmail = assignment.employeeEmail?.trim().toLowerCase();
    const employeeUsername = assignment.employeeUsername?.trim().toLowerCase();

    return Boolean(
      (currentEmployeeId && employeeId === currentEmployeeId) ||
      (currentUserId && employeeId === currentUserId) ||
      (currentUserEmail && employeeEmail === currentUserEmail) ||
      (currentUsername && employeeUsername === currentUsername)
    );
  };

  const isAssetAssignedToCurrentUser = (asset: Asset) =>
    isAssignmentForCurrentUser(getActiveAssignmentForAsset(asset.id));

  const selectedAssetAssigneeName = (() => {
    if (!selectedAsset) {
      return "Unassigned";
    }

    const fromAssignment = getActiveAssignmentForAsset(
      selectedAsset.id
    )?.employeeName?.trim();
    if (fromAssignment) {
      return fromAssignment;
    }

    const fromAsset = selectedAsset.assignedEmployeeName?.trim();
    return fromAsset || "Unassigned";
  })();

  const canApproveReturnForAsset = (asset: Asset): boolean => {
    if (isAssetAssignedToCurrentUser(asset)) {
      return false;
    }

    const assetCapability = getAssetCapability(asset, "can_process_return");
    if (assetCapability !== undefined) {
      return assetCapability;
    }

    return globalAssetCapabilities.can_process_return;
  };

  const canRequestReturnForAsset = (asset: Asset): boolean => {
    const assetCapability = getAssetCapability(asset, "can_request_return");
    if (assetCapability !== undefined) {
      return assetCapability;
    }

    return Boolean(
      globalAssetCapabilities.can_process_return ||
      (globalAssetCapabilities.can_request_return &&
        isAssetAssignedToCurrentUser(asset))
    );
  };

  const canProcessReturnForAsset = (asset: Asset): boolean => {
    if (!isAssetCurrentlyAssigned(asset)) {
      return false;
    }

    return canApproveReturnForAsset(asset) || canRequestReturnForAsset(asset);
  };

  const getReturnActionErrorMessage = (
    error: unknown,
    fallback: string
  ): string => {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return "You do not have permission to perform this return action.";
      }
      if (error.status === 409) {
        return "This return action is no longer valid for the current assignment status.";
      }
      if (error.status === 400) {
        return "Please review the form details and try again.";
      }
    }

    return getErrorMessage(error, fallback);
  };

  const returnAsset = async () => {
    if (!selectedAsset) return;
    if (!canProcessReturnForAsset(selectedAsset)) {
      setApiError("You can only return assets currently assigned to you.");
      return;
    }

    const allRequiredChecked = returnChecklist
      .filter((item) => item.required)
      .every((item) => item.checked);

    if (!allRequiredChecked) {
      alert(
        "Please complete all required checklist items before returning the asset."
      );
      return;
    }

    const activeAssignment = getActiveAssignmentForAsset(selectedAsset.id);

    if (!activeAssignment) {
      setApiError(
        "This asset is not currently assigned and cannot be returned."
      );
      return;
    }

    try {
      const shouldApproveReturn = canApproveReturnForAsset(selectedAsset);

      if (shouldApproveReturn) {
        await approveAssetReturn(
          activeAssignment.id,
          {
            notes: returnNotes,
            checklist: returnChecklist,
            return_description: returnNotes,
            return_checklist: returnChecklist,
          },
          accessToken
        );
      } else {
        await requestAssetReturn(
          activeAssignment.id,
          {
            notes: returnNotes,
            checklist: returnChecklist,
            return_description: returnNotes,
            return_checklist: returnChecklist,
          },
          accessToken
        );
      }

      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.assetId === selectedAsset.id && assignment.isActive
            ? {
                ...assignment,
                returnedDate: shouldApproveReturn
                  ? new Date().toISOString().split("T")[0]
                  : assignment.returnedDate,
                isActive: shouldApproveReturn ? false : assignment.isActive,
                returnRequestStatus: shouldApproveReturn
                  ? "approved"
                  : "pending",
                returnRequestedAt: shouldApproveReturn
                  ? assignment.returnRequestedAt
                  : new Date().toISOString(),
                notes:
                  assignment.notes +
                  (returnNotes ? ` | Return notes: ${returnNotes}` : ""),
              }
            : assignment
        )
      );

      await loadAssetsAndAssignments();
    } catch (error: unknown) {
      setApiError(
        getReturnActionErrorMessage(error, "Failed to process asset return.")
      );
      return;
    }

    // Reset form and close dialog
    setReturnChecklist((prev) =>
      prev.map((item) => ({ ...item, checked: false, notes: "" }))
    );
    setReturnNotes("");
    setIsReturnDialogOpen(false);
    setSelectedAsset(null);
  };

  const approvePendingReturn = async (assignmentId: number) => {
    if (!assignmentId) {
      setApiError("Unable to approve return request: missing assignment ID.");
      return;
    }

    try {
      await approveAssetReturn(assignmentId, {}, accessToken);
      setIsReturnRequestDetailsOpen(false);
      setSelectedReturnRequest(null);
      setReturnRejectionReason("");
      await loadAssetsAndAssignments();
    } catch (error: unknown) {
      setApiError(
        getReturnActionErrorMessage(error, "Failed to approve return request.")
      );
    }
  };

  const rejectPendingReturn = async (assignmentId: number) => {
    const reason = returnRejectionReason.trim();
    if (!reason) {
      setApiError("Rejection reason is required.");
      return;
    }

    try {
      await rejectAssetReturn(assignmentId, { reason }, accessToken);
      setIsReturnRequestDetailsOpen(false);
      setSelectedReturnRequest(null);
      setReturnRejectionReason("");
      await loadAssetsAndAssignments();
    } catch (error: unknown) {
      setApiError(
        getReturnActionErrorMessage(error, "Failed to reject return request.")
      );
    }
  };

  const addNewAsset = async () => {
    if (!newAsset.name || !newAsset.serialNumber) return;
    if (!canCreateAssets) {
      setApiError("You do not have permission to add new assets.");
      return;
    }

    if (newAsset.specifications) {
      try {
        JSON.parse(newAsset.specifications);
      } catch {
        setApiError("Specifications must be valid JSON.");
        return;
      }
    }

    try {
      const parsedSpecifications = newAsset.specifications.trim()
        ? (JSON.parse(newAsset.specifications) as Record<string, string>)
        : undefined;
      const purchaseDate =
        newAsset.purchaseDate || new Date().toISOString().split("T")[0];
      const normalizedAssetId =
        newAsset.assetTag.trim() ||
        newAsset.serialNumber.trim() ||
        `AST-${Date.now()}`;

      const created = await createAsset(
        {
          asset_id: normalizedAssetId,
          name: newAsset.name,
          category: newAsset.category,
          serial_number: newAsset.serialNumber,
          manufacturer: newAsset.brand || undefined,
          model: newAsset.model || undefined,
          description: newAsset.description || undefined,
          purchase_date: purchaseDate,
          purchase_price: newAsset.purchasePrice
            ? Number(newAsset.purchasePrice)
            : undefined,
          warranty: newAsset.warranty || undefined,
          warranty_until: newAsset.warranty || undefined,
          location: newAsset.location || undefined,
          specifications: parsedSpecifications,
          condition: newAsset.condition,
          status: newAsset.status,
        },
        accessToken
      );

      const mappedCreated = mapAssetFromApi({
        ...created,
        category: created.category || newAsset.category,
      });
      setAssets((prev) => [mappedCreated, ...prev]);
      setApiError(null);
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to create asset."));
      return;
    }

    // Reset form
    setNewAsset({
      name: "",
      category: "" as AssetCategory,
      serialNumber: "",
      assetTag: "",
      brand: "",
      model: "",
      description: "",
      purchaseDate: "",
      purchasePrice: "",
      warranty: "",
      location: "",
      specifications: "",
      condition: "good" as AssetCondition,
      status: "active" as AssetStatus,
    });
    setIsAddAssetDialogOpen(false);
  };

  const deleteAsset = async (assetId: number) => {
    const targetAsset = assets.find((asset) => asset.id === assetId);

    if (
      !(
        targetAsset &&
        (getAssetCapability(targetAsset, "can_delete") ?? canDeleteAssets)
      )
    ) {
      setApiError("You do not have permission to delete assets.");
      return;
    }

    try {
      await deleteAssetById(assetId, accessToken);
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to delete asset."));
      return;
    }

    setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  const updateChecklistItem = (
    itemId: string,
    checked: boolean,
    notes?: string
  ) => {
    setReturnChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked, notes } : item
      )
    );
  };

  const openAssetDetails = async (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetDetailsDialogOpen(true);
    setReplacementLogs([]);
    setSelectedAssetScheduledMaintenance([]);
    setIsReplacementFormOpen(false);
    setReplacementForm({
      date: "",
      reason: "",
      replacementAssetId: "none",
      cost: "",
      assetStatusBefore: "none",
      assetStatusAfter: "none",
      assetConditionBefore: "none",
      assetConditionAfter: "none",
    });
    setEditingReplacementLogId(null);
    setReplacementEditForm({
      assetId: "",
      date: "",
      reason: "",
      replacementAssetId: "none",
      cost: "",
      assetStatusBefore: "none",
      assetStatusAfter: "none",
      assetConditionBefore: "none",
      assetConditionAfter: "none",
    });
    setReplacementEditErrors({});

    const canLoadAssetHistory =
      getAssetCapability(asset, "can_view_history") ?? canViewAssetHistory;
    const canLoadScheduledMaintenance =
      canLoadAssetHistory || hasScheduledMaintenanceAccess;

    if (!canLoadAssetHistory && !canLoadScheduledMaintenance) {
      return;
    }

    setIsLoadingReplacementLogs(canLoadAssetHistory);
    setIsLoadingScheduledMaintenance(canLoadScheduledMaintenance);
    try {
      const [logs, scheduled] = await Promise.all([
        canLoadAssetHistory
          ? listReplacementLogs(asset.id, accessToken)
          : Promise.resolve([]),
        canLoadScheduledMaintenance
          ? listScheduledMaintenance({ asset: asset.id }, accessToken)
          : Promise.resolve([]),
      ]);
      setReplacementLogs(logs);
      setSelectedAssetScheduledMaintenance(
        scheduled.filter((item) => item.status === "scheduled")
      );
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to load maintenance logs."));
    } finally {
      setIsLoadingReplacementLogs(false);
      setIsLoadingScheduledMaintenance(false);
    }
  };

  const submitReplacementLog = async () => {
    if (!selectedAsset) return;
    if (!canLogReplacement) {
      setApiError("You do not have permission to log asset maintenance.");
      return;
    }

    const reason = replacementForm.reason.trim();
    const date = replacementForm.date.trim();

    if (!reason || !date) {
      setApiError("Maintenance date and reason are required.");
      return;
    }

    const payload = {
      asset: selectedAsset.id,
      reason,
      date,
      ...(replacementForm.replacementAssetId !== "none"
        ? { replacement_asset: Number(replacementForm.replacementAssetId) }
        : {}),
      ...(replacementForm.cost.trim()
        ? { cost: replacementForm.cost.trim() }
        : {}),
      ...(replacementForm.assetStatusBefore !== "none"
        ? { asset_status_before: replacementForm.assetStatusBefore }
        : {}),
      ...(replacementForm.assetStatusAfter !== "none"
        ? { asset_status_after: replacementForm.assetStatusAfter }
        : {}),
      ...(replacementForm.assetConditionBefore !== "none"
        ? { asset_condition_before: replacementForm.assetConditionBefore }
        : {}),
      ...(replacementForm.assetConditionAfter !== "none"
        ? { asset_condition_after: replacementForm.assetConditionAfter }
        : {}),
    };

    setIsCreatingReplacementLog(true);
    try {
      const createdLog = await createReplacementLog(payload, accessToken);
      setReplacementLogs((prev) => [createdLog, ...prev]);
      setReplacementForm({
        date: "",
        reason: "",
        replacementAssetId: "none",
        cost: "",
        assetStatusBefore: "none",
        assetStatusAfter: "none",
        assetConditionBefore: "none",
        assetConditionAfter: "none",
      });
      setIsReplacementFormOpen(false);
      setApiError(null);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 403) {
        setApiError("You do not have permission to log asset maintenance.");
      } else {
        setApiError(getErrorMessage(error, "Failed to log asset maintenance."));
      }
    } finally {
      setIsCreatingReplacementLog(false);
    }
  };

  const openReplacementLogEdit = (log: AssetReplacementLogApiItem) => {
    if (!canLogReplacement) {
      setApiError("You do not have permission to edit asset maintenance.");
      return;
    }

    setEditingReplacementLogId(log.id);
    setReplacementEditErrors({});
    setReplacementEditForm({
      assetId: String(log.asset),
      date: log.date,
      reason: log.reason,
      replacementAssetId: log.replacement_asset
        ? String(log.replacement_asset)
        : "none",
      cost: log.cost || "",
      assetStatusBefore: log.asset_status_before || "none",
      assetStatusAfter: log.asset_status_after || "none",
      assetConditionBefore: log.asset_condition_before || "none",
      assetConditionAfter: log.asset_condition_after || "none",
    });
  };

  const cancelReplacementLogEdit = () => {
    setEditingReplacementLogId(null);
    setReplacementEditErrors({});
    setReplacementEditForm({
      assetId: "",
      date: "",
      reason: "",
      replacementAssetId: "none",
      cost: "",
      assetStatusBefore: "none",
      assetStatusAfter: "none",
      assetConditionBefore: "none",
      assetConditionAfter: "none",
    });
  };

  const submitReplacementLogEdit = async (logId: number) => {
    if (!canLogReplacement) {
      setApiError("You do not have permission to edit asset maintenance.");
      return;
    }

    const assetId = Number(replacementEditForm.assetId);
    const reason = replacementEditForm.reason.trim();
    const date = replacementEditForm.date.trim();

    if (!assetId || !reason || !date) {
      setReplacementEditErrors({
        ...(!assetId ? { asset: "Asset is required." } : {}),
        ...(!reason ? { reason: "Reason is required." } : {}),
        ...(!date ? { date: "Maintenance date is required." } : {}),
      });
      return;
    }

    const payload = {
      asset: assetId,
      reason,
      date,
      replacement_asset:
        replacementEditForm.replacementAssetId !== "none"
          ? Number(replacementEditForm.replacementAssetId)
          : null,
      cost: replacementEditForm.cost.trim()
        ? replacementEditForm.cost.trim()
        : null,
      asset_status_before:
        replacementEditForm.assetStatusBefore !== "none"
          ? replacementEditForm.assetStatusBefore
          : null,
      asset_status_after:
        replacementEditForm.assetStatusAfter !== "none"
          ? replacementEditForm.assetStatusAfter
          : null,
      asset_condition_before:
        replacementEditForm.assetConditionBefore !== "none"
          ? replacementEditForm.assetConditionBefore
          : null,
      asset_condition_after:
        replacementEditForm.assetConditionAfter !== "none"
          ? replacementEditForm.assetConditionAfter
          : null,
    };

    setIsUpdatingReplacementLog(true);
    setReplacementEditErrors({});
    try {
      const updatedLog = await updateReplacementLog(
        logId,
        payload,
        accessToken
      );
      setReplacementLogs((prev) =>
        prev.map((log) => (log.id === updatedLog.id ? updatedLog : log))
      );
      cancelReplacementLogEdit();
      setApiError(null);
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error);
      setReplacementEditErrors(fieldErrors);

      if (error instanceof ApiError && error.status === 403) {
        setApiError("You do not have permission to edit asset maintenance.");
      } else {
        setApiError(
          getErrorMessage(error, "Failed to update asset maintenance.")
        );
      }
    } finally {
      setIsUpdatingReplacementLog(false);
    }
  };

  const upsertScheduledMaintenance = (item: ScheduledMaintenanceApiItem) => {
    setScheduledMaintenance((prev) => {
      const exists = prev.some((current) => current.id === item.id);
      return exists
        ? prev.map((current) => (current.id === item.id ? item : current))
        : [item, ...prev];
    });

    setSelectedAssetScheduledMaintenance((prev) => {
      if (
        !selectedAsset ||
        item.asset !== selectedAsset.id ||
        item.status !== "scheduled"
      ) {
        return prev.filter((current) => current.id !== item.id);
      }

      const exists = prev.some((current) => current.id === item.id);
      return exists
        ? prev.map((current) => (current.id === item.id ? item : current))
        : [item, ...prev];
    });
  };

  const openMaintenanceForm = (asset?: Asset) => {
    setMaintenanceForm({
      assetId: asset ? String(asset.id) : "",
      dueDate: "",
      reason: "",
      maintenanceType: "preventive",
      ownerId: "none",
      estimatedCost: "",
      vendor: "",
    });
    setIsMaintenanceFormOpen(true);
    if (assignableUsers.length === 0) {
      void listAssignableUsers(accessToken)
        .then((users) => setAssignableUsers(users))
        .catch(() => setAssignableUsers([]));
    }
  };

  const submitScheduledMaintenance = async () => {
    if (!canManageMaintenance) {
      setApiError("You do not have permission to schedule maintenance.");
      return;
    }

    const assetId = Number(maintenanceForm.assetId);
    const dueDate = maintenanceForm.dueDate.trim();
    const reason = maintenanceForm.reason.trim();

    if (!assetId || !dueDate || !reason) {
      setApiError("Asset, due date, and reason are required.");
      return;
    }

    const payload = {
      asset: assetId,
      due_date: dueDate,
      reason,
      maintenance_type: maintenanceForm.maintenanceType,
      ...(maintenanceForm.ownerId !== "none"
        ? { owner: Number(maintenanceForm.ownerId) }
        : {}),
      ...(maintenanceForm.estimatedCost.trim()
        ? { estimated_cost: maintenanceForm.estimatedCost.trim() }
        : {}),
      ...(maintenanceForm.vendor.trim()
        ? { vendor: maintenanceForm.vendor.trim() }
        : {}),
    };

    setIsSubmittingMaintenance(true);
    try {
      const created = await createScheduledMaintenance(payload, accessToken);
      upsertScheduledMaintenance(created);
      setIsMaintenanceFormOpen(false);
      setApiError(null);
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to schedule maintenance."));
    } finally {
      setIsSubmittingMaintenance(false);
    }
  };

  const openCompleteMaintenance = (item: ScheduledMaintenanceApiItem) => {
    setMaintenanceActionTarget(item);
    setMaintenanceCompletionForm({
      date: getTodayDateValue(),
      reason: item.reason || "",
      cost: item.estimated_cost || "",
      replacementAssetId: "none",
      assetStatusBefore: "none",
      assetStatusAfter: "none",
      assetConditionBefore: "none",
      assetConditionAfter: "none",
    });
  };

  const submitCompleteMaintenance = async () => {
    if (!maintenanceActionTarget) return;
    if (!canManageMaintenance) {
      setApiError("You do not have permission to complete maintenance.");
      return;
    }

    const date = maintenanceCompletionForm.date.trim();
    const reason = maintenanceCompletionForm.reason.trim();
    const cost = maintenanceCompletionForm.cost.trim();
    const assetStatusBefore = normalizeAssetStatusForApi(
      maintenanceCompletionForm.assetStatusBefore
    );
    const assetStatusAfter = normalizeAssetStatusForApi(
      maintenanceCompletionForm.assetStatusAfter
    );

    if (!date || !reason) {
      setApiError("Completion date and reason are required.");
      return;
    }

    const payload = {
      date,
      reason,
      ...(cost ? { cost } : {}),
      ...(maintenanceCompletionForm.replacementAssetId !== "none"
        ? {
            replacement_asset: Number(
              maintenanceCompletionForm.replacementAssetId
            ),
          }
        : {}),
      ...(assetStatusBefore ? { asset_status_before: assetStatusBefore } : {}),
      ...(assetStatusAfter ? { asset_status_after: assetStatusAfter } : {}),
      ...(maintenanceCompletionForm.assetConditionBefore !== "none"
        ? {
            asset_condition_before:
              maintenanceCompletionForm.assetConditionBefore,
          }
        : {}),
      ...(maintenanceCompletionForm.assetConditionAfter !== "none"
        ? {
            asset_condition_after:
              maintenanceCompletionForm.assetConditionAfter,
          }
        : {}),
    };

    setIsCompletingMaintenance(true);
    try {
      const completed = await completeScheduledMaintenance(
        maintenanceActionTarget.id,
        payload,
        accessToken
      );
      upsertScheduledMaintenance(completed);
      if (completed.completed_log_details) {
        setReplacementLogs((prev) => [
          completed.completed_log_details!,
          ...prev,
        ]);
      }
      setMaintenanceActionTarget(null);
      setApiError(null);
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to complete maintenance."));
    } finally {
      setIsCompletingMaintenance(false);
    }
  };

  const submitCancelMaintenance = async () => {
    if (!maintenanceCancelTarget) return;
    if (!canManageMaintenance) {
      setApiError("You do not have permission to cancel maintenance.");
      return;
    }

    setIsCancellingMaintenance(true);
    try {
      const cancelled = await cancelScheduledMaintenance(
        maintenanceCancelTarget.id,
        { cancelled_reason: maintenanceCancelReason.trim() },
        accessToken
      );
      upsertScheduledMaintenance(cancelled);
      setMaintenanceCancelTarget(null);
      setMaintenanceCancelReason("");
      setApiError(null);
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to cancel maintenance."));
    } finally {
      setIsCancellingMaintenance(false);
    }
  };

  const openEditAsset = (asset: Asset) => {
    const canEditAsset =
      getAssetCapability(asset, "can_update") ??
      (canUpdateAssets || canUpdateAssetCondition);

    if (!canEditAsset) {
      setApiError("You do not have permission to edit this asset.");
      return;
    }

    setSelectedAsset(asset);
    setEditAsset({
      name: asset.name,
      category: asset.category,
      serialNumber: asset.serialNumber,
      assetTag: asset.assetTag,
      brand: asset.brand,
      model: asset.model,
      description: asset.description,
      purchaseDate: asset.purchaseDate,
      purchasePrice: String(asset.purchasePrice || ""),
      warranty: asset.warranty,
      location: asset.location,
      specifications: JSON.stringify(asset.specifications || {}, null, 2),
      condition: asset.condition,
      status: asset.status,
    });
    setIsEditAssetDialogOpen(true);
  };

  const openReturnDialogForAsset = (asset: Asset) => {
    if (!isAssetCurrentlyAssigned(asset)) {
      setApiError("Only currently assigned assets can be returned.");
      return;
    }

    if (!canProcessReturnForAsset(asset)) {
      setApiError("You can only return assets currently assigned to you.");
      return;
    }

    setSelectedAsset(asset);
    setReturnChecklist((prev) =>
      prev.map((item) => ({ ...item, checked: false, notes: "" }))
    );
    setReturnNotes("");
    setIsReturnDialogOpen(true);
  };

  const saveAssetEdit = async () => {
    if (!selectedAsset) return;

    const canEditSelectedAsset =
      getAssetCapability(selectedAsset, "can_update") ??
      (canUpdateAssets || canUpdateAssetCondition);

    if (!canEditSelectedAsset) {
      setApiError("You do not have permission to edit this asset.");
      return;
    }

    if (editAsset.specifications.trim()) {
      try {
        JSON.parse(editAsset.specifications);
      } catch {
        setApiError("Specifications must be valid JSON.");
        return;
      }
    }

    setIsActionSubmitting(true);
    try {
      const parsedSpecifications = editAsset.specifications.trim()
        ? (JSON.parse(editAsset.specifications) as Record<string, string>)
        : undefined;
      const updated = await updateAsset(
        selectedAsset.id,
        {
          asset_id: editAsset.assetTag || selectedAsset.assetTag,
          name: editAsset.name,
          category: editAsset.category,
          serial_number: editAsset.serialNumber,
          manufacturer: editAsset.brand || undefined,
          model: editAsset.model || undefined,
          description: editAsset.description || undefined,
          purchase_date: editAsset.purchaseDate || undefined,
          purchase_price: editAsset.purchasePrice
            ? Number(editAsset.purchasePrice)
            : undefined,
          warranty: editAsset.warranty || undefined,
          warranty_until: editAsset.warranty || undefined,
          location: editAsset.location || undefined,
          specifications: parsedSpecifications,
          status: toApiAssetStatus(editAsset.status),
          condition: toApiAssetCondition(editAsset.condition),
        },
        accessToken
      );

      const activeAssignment = getActiveAssignmentForAsset(selectedAsset.id);
      const mappedUpdated = applyActiveAssignmentToAsset(
        mapAssetFromApi(updated),
        activeAssignment
      );

      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === selectedAsset.id ? mappedUpdated : asset
        )
      );
      setSelectedAsset(mappedUpdated);
      setIsEditAssetDialogOpen(false);
      setApiError(null);
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to update asset."));
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const openAssignDialog = async (asset?: Asset) => {
    if (
      asset &&
      !(getAssetCapability(asset, "can_assign") ?? canAssignAssets)
    ) {
      setApiError("You do not have permission to assign this asset.");
      return;
    }

    if (!asset && !canAssignAssets) {
      setApiError("You do not have permission to assign assets.");
      return;
    }

    setSelectedAsset(asset || null);
    setAssignmentError(null);
    setAssignmentForm({
      assetId: asset ? String(asset.id) : "",
      employeeId: "",
      notes: "",
    });
    setIsAssignDialogOpen(true);
    setIsLoadingAssignableUsers(true);

    try {
      const users = await listAssignableUsers(accessToken);
      setAssignableUsers(users);
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to load employee list."));
      setAssignableUsers([]);
    } finally {
      setIsLoadingAssignableUsers(false);
    }
  };

  const submitAssignment = async () => {
    if (!assignmentForm.assetId || !assignmentForm.employeeId) {
      return;
    }

    const targetAsset =
      assets.find((asset) => asset.id === Number(assignmentForm.assetId)) ||
      selectedAsset;

    if (!targetAsset) {
      setAssignmentError("Please select an asset to assign.");
      return;
    }

    if (!(getAssetCapability(targetAsset, "can_assign") ?? canAssignAssets)) {
      setAssignmentError("You do not have permission to assign this asset.");
      return;
    }

    setAssignmentError(null);
    setIsActionSubmitting(true);
    try {
      const createdAssignment = await assignAssetToEmployee(
        {
          asset: targetAsset.id,
          employee: Number(assignmentForm.employeeId),
          notes: assignmentForm.notes || undefined,
        },
        accessToken
      );

      const mapped = mapAssignmentFromApi(createdAssignment);
      const assignedEmployeeName =
        mapped.employeeName ||
        assignableUsers.find((user) => user.id === assignmentForm.employeeId)
          ?.name ||
        "Assigned User";
      const updateAssignedAsset = (asset: Asset): Asset =>
        asset.id === targetAsset.id
          ? {
              ...asset,
              status: "active",
              assignedTo: assignmentForm.employeeId,
              assignedEmployeeName,
              assignedDate:
                mapped.assignedDate || new Date().toISOString().split("T")[0],
            }
          : asset;

      setAssignments((prev) => [
        mapped,
        ...prev.map((assignment) =>
          assignment.assetId === targetAsset.id && assignment.isActive
            ? {
                ...assignment,
                isActive: false,
                returnedDate:
                  assignment.returnedDate ||
                  new Date().toISOString().split("T")[0],
              }
            : assignment
        ),
      ]);
      setAssets((prev) => prev.map(updateAssignedAsset));
      setSelectedAsset((prev) =>
        prev && prev.id === targetAsset.id ? updateAssignedAsset(prev) : prev
      );
      setIsAssignDialogOpen(false);
      setApiError(null);
      void loadAssetsAndAssignments();
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status >= 500) {
        setAssignmentError(
          "Assignment could not be completed right now due to a temporary server issue. Your selections are kept - please try again."
        );
      } else {
        setAssignmentError(getErrorMessage(error, "Failed to assign asset."));
      }
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const confirmDeleteAsset = async () => {
    if (deleteTargetAssetId === null) {
      return;
    }

    setIsActionSubmitting(true);
    await deleteAsset(deleteTargetAssetId);
    setDeleteTargetAssetId(null);
    setIsActionSubmitting(false);
  };

  const handleExportAssets = async () => {
    if (!canExportInventory || isExportingAssets) {
      return;
    }

    const filters: Record<string, unknown> = {};

    if (categoryFilter !== "all") {
      filters.category = categoryFilter;
    }

    if (
      statusFilter === "active" ||
      statusFilter === "lost" ||
      statusFilter === "damaged" ||
      statusFilter === "maintenance" ||
      statusFilter === "retired"
    ) {
      filters.status = statusFilter;
    }

    const payload: {
      filters?: Record<string, unknown>;
      include_assignment: boolean;
      filename: string;
    } = {
      include_assignment: true,
      filename: `asset_export_${new Date().toISOString().slice(0, 10)}.csv`,
    };

    if (Object.keys(filters).length > 0) {
      payload.filters = filters;
    }

    setIsExportingAssets(true);
    setApiError(null);

    try {
      const { blob, filename } = await exportAssetsCsv(payload, accessToken);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename || "asset_export.csv";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setApiError(
            "Your session has expired. Please sign in again to export assets."
          );
        } else if (error.status === 403) {
          setApiError(
            "You do not have permission to export the full asset inventory."
          );
        } else if (error.status === 400) {
          setApiError(
            "Export request is invalid. Please review the selected filters and try again."
          );
        } else {
          setApiError(getErrorMessage(error, "Failed to export assets."));
        }
      } else {
        setApiError(getErrorMessage(error, "Failed to export assets."));
      }
    } finally {
      setIsExportingAssets(false);
    }
  };

  const handleDownloadAssetQrCode = async (asset: Asset) => {
    if (downloadingQrCodeAssetId !== null) {
      return;
    }

    if (!asset.qrCodeUrl) {
      setQrCodeError("QR code is not available for this asset.");
      return;
    }

    setDownloadingQrCodeAssetId(asset.id);
    setQrCodeError(null);

    try {
      const { blob } = await downloadAssetQrCode(asset.id, accessToken);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getAssetQrDownloadFilename(asset);
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setQrCodeError(
            "Your session has expired. Please sign in again to download this QR code."
          );
        } else if (error.status === 403) {
          setQrCodeError(
            "You do not have permission to download this QR code."
          );
        } else if (error.status === 404) {
          setQrCodeError("QR code is missing for this asset.");
        } else {
          setQrCodeError(getErrorMessage(error, "Failed to download QR code."));
        }
      } else {
        setQrCodeError(getErrorMessage(error, "Failed to download QR code."));
      }
    } finally {
      setDownloadingQrCodeAssetId(null);
    }
  };

  return (
    <div className="am-page assets-redesign">
      <div className="am-pagehead">
        <div>
          <h1>Asset Management</h1>
          <p>
            Track, assign, and service company equipment across Bloomteq ·{" "}
            {assets.length} assets
          </p>
        </div>
        <div className="am-pagehead-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const isAssetsTabActive = activeTab === "assets";
              setActiveTab("assets");
              setIsFilterPanelOpen((prev) =>
                isAssetsTabActive ? !prev : true
              );
            }}
            aria-expanded={isFilterPanelOpen}
            aria-controls="asset-filter-controls"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-zinc-900" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportAssets()}
            disabled={!canExportInventory || isExportingAssets}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExportingAssets ? "Exporting..." : "Export"}
          </Button>
          <Button variant="outline" size="sm" disabled={!canGenerateQr}>
            <QrCode className="mr-2 h-4 w-4" />
            Scan QR
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddAssetDialogOpen(true)}
            disabled={!canCreateAssets}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      <div className="am-kpis">
        {(
          [
            {
              key: "total",
              label: "Total assets",
              value: assets.length,
              sub: "All categories",
              icon: Package,
              tone: { bg: "#f4f4f5", fg: "#52525b" },
            },
            {
              key: "active",
              label: "Active",
              value: assets.filter((asset) => asset.status === "active").length,
              sub: "In service",
              icon: CheckCircle,
              tone: { bg: "#f0fdf4", fg: "#15803d" },
            },
            {
              key: "available",
              label: "Available",
              value: assets.filter((asset) => asset.isAvailable).length,
              sub: "Ready to assign",
              icon: Package2,
              tone: { bg: "#eff6ff", fg: "#1d4ed8" },
            },
            {
              key: "maintenance",
              label: "In maintenance",
              value: assets.filter((asset) => asset.status === "maintenance")
                .length,
              sub: "Being serviced",
              icon: Wrench,
              tone: { bg: "#fffbeb", fg: "#b45309" },
            },
            {
              key: "issues",
              label: "Issues",
              value: assets.filter(
                (asset) => asset.status === "lost" || asset.status === "damaged"
              ).length,
              sub: "Lost or damaged",
              icon: AlertTriangle,
              tone: { bg: "#fef2f2", fg: "#b91c1c" },
            },
          ] as const
        ).map((kpi) => {
          const Icon = kpi.icon;
          const isActive = quickFilter === kpi.key && kpi.key !== "total";
          return (
            <button
              key={kpi.key}
              type="button"
              className={`am-kpi ${isActive ? "is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => {
                setActiveTab("assets");
                setStatusFilter("all");
                setQuickFilter((prev) =>
                  prev === kpi.key ? "total" : kpi.key
                );
              }}
            >
              {isActive && <span className="am-kpi-active-bar" />}
              <div className="am-kpi-top">
                <span
                  className="am-kpi-ic"
                  style={{ background: kpi.tone.bg, color: kpi.tone.fg }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {kpi.label}
              </div>
              <div className="am-kpi-val">{kpi.value}</div>
              <div className="am-kpi-sub">
                {isActive ? (
                  <>
                    <Filter className="h-3 w-3" /> Filtering inventory
                  </>
                ) : (
                  kpi.sub
                )}
              </div>
            </button>
          );
        })}
      </div>

      {apiError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {!canViewAnyAssets ? (
        <div className="am-panel">
          <div className="am-empty">
            <Package className="am-empty-icon p-3" />
            <h3>Asset inventory hidden</h3>
            <p>You do not have permission to view asset inventory.</p>
          </div>
        </div>
      ) : isLoadingAssets ? (
        <div className="am-panel">
          <div className="am-empty">
            <Package className="am-empty-icon p-3" />
            <h3>Loading asset inventory...</h3>
            <p>Fetching current assets, assignments, and maintenance.</p>
          </div>
        </div>
      ) : (
        <div className="am-grid">
          <div className="am-panel">
            <div className="am-tabs">
              {[
                {
                  value: "assets",
                  label: "Inventory",
                  ariaLabel: "Asset Inventory",
                  icon: Package,
                  count: assets.length,
                },
                {
                  value: "assignments",
                  label: "Assignments",
                  ariaLabel: "Assignment History",
                  icon: UserCheck,
                  count: assignments.length,
                },
                {
                  value: "returns",
                  label: "Return Requests",
                  ariaLabel: "Return Requests",
                  icon: RefreshCw,
                  count: pendingReturnRequests.length,
                  alert: pendingReturnRequests.length > 0,
                },
                {
                  value: "maintenance",
                  label: "Maintenance",
                  ariaLabel: "Maintenance",
                  icon: Wrench,
                  count: scheduledMaintenance.filter(
                    (item) => item.status === "scheduled"
                  ).length,
                },
                {
                  value: "logs",
                  label: "Replacement Logs",
                  ariaLabel: "Replacement Logs",
                  icon: History,
                  count: inventoryReplacementLogs.length,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const activateTab = () => {
                  setActiveTab(tab.value);
                  if (tab.value === "assets") void loadAssetsAndAssignments();
                  if (tab.value === "logs") void loadInventoryReplacementLogs();
                };
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-label={tab.ariaLabel}
                    aria-selected={activeTab === tab.value}
                    className={`am-tab ${activeTab === tab.value ? "is-active" : ""}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      activateTab();
                    }}
                    onClick={activateTab}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span
                      className={`am-tab-count ${tab.alert ? "am-tab-count--alert" : ""}`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="am-panel-body">
              {activeTab === "assets" && (
                <div>
                  <div id="asset-filter-controls" className="am-toolbar">
                    {isFilterPanelOpen && (
                      <>
                        <div className="relative min-w-[180px] flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                          <Input
                            placeholder="Search assets..."
                            value={searchTerm}
                            onChange={(event) =>
                              setSearchTerm(event.target.value)
                            }
                            className="pl-9"
                          />
                        </div>
                        <Select
                          value={categoryFilter}
                          onValueChange={setCategoryFilter}
                        >
                          <SelectTrigger className="w-full md:w-40">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.value}
                                value={category.value}
                              >
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="w-full md:w-36">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {ASSET_STATUS_OPTIONS.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={conditionFilter}
                          onValueChange={setConditionFilter}
                        >
                          <SelectTrigger className="w-full md:w-36">
                            <SelectValue placeholder="Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All conditions</SelectItem>
                            {ASSET_CONDITION_OPTIONS.map((condition) => (
                              <SelectItem
                                key={condition.value}
                                value={condition.value}
                              >
                                {condition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={ownerFilter}
                          onValueChange={setOwnerFilter}
                        >
                          <SelectTrigger className="w-full md:w-40">
                            <SelectValue placeholder="Owner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All owners</SelectItem>
                            <SelectItem value="unassigned">
                              Unassigned
                            </SelectItem>
                            {ownerOptions.map((owner) => (
                              <SelectItem key={owner.id} value={owner.id}>
                                {owner.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={locationFilter}
                          onValueChange={setLocationFilter}
                        >
                          <SelectTrigger className="w-full md:w-40">
                            <SelectValue placeholder="Location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All locations</SelectItem>
                            {locationOptions.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearInventoryFilters}
                          >
                            Clear
                          </Button>
                        )}
                      </>
                    )}
                    <div className="am-toolbar-spacer" />
                    <span className="am-result-count">
                      {filteredAssets.length} of {assets.length}
                    </span>
                    <div className="am-seg am-seg--sm" role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={inventoryView === "table"}
                        aria-label="Table view"
                        className={inventoryView === "table" ? "is-active" : ""}
                        onClick={() => setInventoryView("table")}
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={inventoryView === "grid"}
                        aria-label="Grid view"
                        className={inventoryView === "grid" ? "is-active" : ""}
                        onClick={() => setInventoryView("grid")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {filteredAssets.length === 0 ? (
                    <div className="am-empty">
                      <Package className="am-empty-icon p-3" />
                      <h3>No assets found</h3>
                      <p>Try adjusting filters or add a new asset.</p>
                    </div>
                  ) : inventoryView === "table" ? (
                    <div className="am-tablewrap">
                      <Table className="am-table">
                        <TableHeader>
                          <TableRow>
                            {renderSortableHead("name", "Asset")}
                            {renderSortableHead("category", "Category")}
                            {renderSortableHead("owner", "Owner")}
                            {renderSortableHead("location", "Location")}
                            {renderSortableHead("value", "Value", true)}
                            {renderSortableHead("condition", "Condition")}
                            {renderSortableHead("status", "Status")}
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssets.map((asset) => {
                            const CategoryIcon = getCategoryIcon(
                              asset.category
                            );
                            const activeAssignment =
                              getActiveAssignmentForAsset(asset.id);
                            const returnStatus =
                              activeAssignment?.returnRequestStatus;
                            return (
                              <TableRow
                                key={asset.id}
                                data-slot="card"
                                className="cursor-pointer"
                                onClick={() => void openAssetDetails(asset)}
                              >
                                <TableCell>
                                  <div className="am-asset-cell">
                                    <span className="am-asset-ic">
                                      <CategoryIcon className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                      <div className="am-asset-name">
                                        {asset.name}
                                      </div>
                                      <div className="am-asset-meta">
                                        <span className="font-mono">
                                          {asset.assetTag}
                                        </span>{" "}
                                        · {asset.brand}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="capitalize">
                                  {asset.category}
                                </TableCell>
                                <TableCell>
                                  {asset.assignedEmployeeName ? (
                                    <div className="am-owner">
                                      <Avatar className="h-7 w-7">
                                        <AvatarFallback className="text-xs">
                                          {asset.assignedEmployeeName
                                            .split(" ")
                                            .map((name) => name[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="am-owner-name">
                                        {asset.assignedEmployeeName}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="am-unassigned">--</span>
                                  )}
                                </TableCell>
                                <TableCell>{asset.location}</TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                  {formatCurrency(asset.purchasePrice)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={getConditionColor(
                                      asset.condition
                                    )}
                                  >
                                    {asset.condition}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col items-start gap-1">
                                    <Badge
                                      variant="outline"
                                      className={getStatusColor(asset.status)}
                                    >
                                      {asset.status}
                                    </Badge>
                                    {returnStatus === "pending" && (
                                      <span className="whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                        Return pending
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <div className="am-rowactions">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        void openAssetDetails(asset)
                                      }
                                    >
                                      <Eye className="mr-1 h-3 w-3" />
                                      View
                                    </Button>
                                    {isAssetCurrentlyAssigned(asset) ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                          !canProcessReturnForAsset(asset) ||
                                          returnStatus === "pending"
                                        }
                                        onClick={() =>
                                          openReturnDialogForAsset(asset)
                                        }
                                      >
                                        {canApproveReturnForAsset(asset)
                                          ? "Approve Return"
                                          : "Request Return"}
                                      </Button>
                                    ) : (
                                      isAssetAssignable(asset) && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={
                                            !(
                                              getAssetCapability(
                                                asset,
                                                "can_assign"
                                              ) ?? canAssignAssets
                                            )
                                          }
                                          onClick={() =>
                                            void openAssignDialog(asset)
                                          }
                                        >
                                          Assign Asset
                                        </Button>
                                      )
                                    )}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label="Asset actions"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            void openAssetDetails(asset)
                                          }
                                        >
                                          <Eye className="mr-2 h-4 w-4" />
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          disabled={
                                            !(
                                              getAssetCapability(
                                                asset,
                                                "can_update"
                                              ) ??
                                              (canUpdateAssets ||
                                                canUpdateAssetCondition)
                                            )
                                          }
                                          onClick={() => openEditAsset(asset)}
                                        >
                                          <Edit3 className="mr-2 h-4 w-4" />
                                          Edit details
                                        </DropdownMenuItem>
                                        {isAssetCurrentlyAssigned(asset) ? (
                                          <DropdownMenuItem
                                            disabled={
                                              !canProcessReturnForAsset(
                                                asset
                                              ) || returnStatus === "pending"
                                            }
                                            onClick={() =>
                                              openReturnDialogForAsset(asset)
                                            }
                                          >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            {canApproveReturnForAsset(asset)
                                              ? "Approve return"
                                              : "Request return"}
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem
                                            disabled={
                                              !isAssetAssignable(asset) ||
                                              !(
                                                getAssetCapability(
                                                  asset,
                                                  "can_assign"
                                                ) ?? canAssignAssets
                                              )
                                            }
                                            onClick={() =>
                                              void openAssignDialog(asset)
                                            }
                                          >
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Assign asset
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          disabled={!canManageMaintenance}
                                          onClick={() =>
                                            openMaintenanceForm(asset)
                                          }
                                        >
                                          <Wrench className="mr-2 h-4 w-4" />
                                          Schedule maintenance
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          disabled={
                                            !asset.qrCodeUrl ||
                                            downloadingQrCodeAssetId ===
                                              asset.id
                                          }
                                          onClick={() =>
                                            void handleDownloadAssetQrCode(
                                              asset
                                            )
                                          }
                                        >
                                          <QrCode className="mr-2 h-4 w-4" />
                                          Download QR code
                                        </DropdownMenuItem>
                                        {(getAssetCapability(
                                          asset,
                                          "can_delete"
                                        ) ??
                                          canDeleteAssets) && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-red-600"
                                              onClick={() =>
                                                setDeleteTargetAssetId(asset.id)
                                              }
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete asset
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="am-cardgrid">
                      {filteredAssets.map((asset) => {
                        const CategoryIcon = getCategoryIcon(asset.category);
                        const activeAssignment = getActiveAssignmentForAsset(
                          asset.id
                        );
                        const returnStatus =
                          activeAssignment?.returnRequestStatus;
                        const assigned = isAssetCurrentlyAssigned(asset);
                        const flagged =
                          asset.status === "lost" || asset.status === "damaged";
                        return (
                          <div
                            key={asset.id}
                            className="am-acard"
                            onClick={() => void openAssetDetails(asset)}
                          >
                            <div className="am-acard-top">
                              <span className="am-acard-ic">
                                <CategoryIcon className="h-5 w-5" />
                              </span>
                              <Badge
                                variant="outline"
                                className={getStatusColor(asset.status)}
                              >
                                {asset.status}
                              </Badge>
                            </div>
                            <h3>{asset.name}</h3>
                            <div className="am-acard-brand">
                              {asset.brand} · {asset.model}
                            </div>
                            <div className="am-acard-rows">
                              <div className="am-acard-row">
                                <Hash className="h-3.5 w-3.5" /> Tag
                                <span className="am-ar-val font-mono">
                                  {asset.assetTag}
                                </span>
                              </div>
                              <div className="am-acard-row">
                                <User className="h-3.5 w-3.5" /> Owner
                                <span className="am-ar-val">
                                  {asset.assignedEmployeeName || "Unassigned"}
                                </span>
                              </div>
                              <div className="am-acard-row">
                                <MapPin className="h-3.5 w-3.5" /> Location
                                <span className="am-ar-val">
                                  {asset.location}
                                </span>
                              </div>
                              <div className="am-acard-row">
                                <CircleDot className="h-3.5 w-3.5" /> Condition
                                <span className="am-ar-val">
                                  <Badge
                                    variant="outline"
                                    className={getConditionColor(
                                      asset.condition
                                    )}
                                  >
                                    {asset.condition}
                                  </Badge>
                                </span>
                              </div>
                              <div className="am-acard-row">
                                <Tag className="h-3.5 w-3.5" /> Value
                                <span className="am-ar-val am-cost">
                                  {formatCurrency(asset.purchasePrice)}
                                </span>
                              </div>
                            </div>
                            <div
                              className="am-acard-foot"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void openAssetDetails(asset)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Button>
                              {assigned ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    !canProcessReturnForAsset(asset) ||
                                    returnStatus === "pending"
                                  }
                                  onClick={() =>
                                    openReturnDialogForAsset(asset)
                                  }
                                >
                                  {canApproveReturnForAsset(asset)
                                    ? "Approve Return"
                                    : "Request Return"}
                                </Button>
                              ) : (
                                isAssetAssignable(asset) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      !(
                                        getAssetCapability(
                                          asset,
                                          "can_assign"
                                        ) ?? canAssignAssets
                                      )
                                    }
                                    onClick={() => void openAssignDialog(asset)}
                                  >
                                    Assign Asset
                                  </Button>
                                )
                              )}
                            </div>
                            {returnStatus === "pending" && (
                              <div className="am-flag am-flag--warn">
                                <Clock className="h-3.5 w-3.5" /> Return pending
                                HR review
                              </div>
                            )}
                            {flagged && (
                              <div className="am-flag am-flag--alert">
                                <AlertTriangle className="h-3.5 w-3.5" />{" "}
                                Flagged {asset.status}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "assignments" && (
                <div>
                  <div className="am-toolbar">
                    <div className="space-y-1">
                      <Label htmlFor="assignment-asset-filter">Asset</Label>
                      <Input
                        id="assignment-asset-filter"
                        placeholder="Filter by asset"
                        value={assignmentAssetFilter}
                        onChange={(event) =>
                          setAssignmentAssetFilter(event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="assignment-employee-filter">
                        Employee
                      </Label>
                      <Input
                        id="assignment-employee-filter"
                        placeholder="Filter by employee"
                        value={assignmentEmployeeFilter}
                        onChange={(event) =>
                          setAssignmentEmployeeFilter(event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="assignment-status-filter">Status</Label>
                      <Select
                        value={assignmentStatusFilter}
                        onValueChange={setAssignmentStatusFilter}
                      >
                        <SelectTrigger
                          id="assignment-status-filter"
                          className="w-full md:w-40"
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {hasActiveAssignmentFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAssignmentAssetFilter("");
                          setAssignmentEmployeeFilter("");
                          setAssignmentStatusFilter("all");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                    <div className="am-toolbar-spacer" />
                    <span className="am-result-count">
                      {filteredAssignments.length} assignments
                    </span>
                  </div>
                  {filteredAssignments.length === 0 ? (
                    <div className="am-empty">
                      <History className="am-empty-icon p-3" />
                      {assignments.length === 0 ? (
                        <>
                          <h3>No assignment history</h3>
                          <p>
                            Assignment records will appear here as assets are
                            assigned.
                          </p>
                        </>
                      ) : (
                        <>
                          <h3>No matching assignments</h3>
                          <p>
                            Try changing the asset, employee, or status filters.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="am-tablewrap">
                      <Table className="am-table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Returned</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssignments.map((assignment) => {
                            const asset = assets.find(
                              (item) => item.id === assignment.assetId
                            );
                            return (
                              <TableRow key={assignment.id}>
                                <TableCell>
                                  <button
                                    type="button"
                                    className="am-asset-cell text-left"
                                    onClick={() =>
                                      asset && void openAssetDetails(asset)
                                    }
                                  >
                                    <span className="am-asset-ic">
                                      <Package className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="am-asset-name block">
                                        {asset?.name ||
                                          getAssignmentAssetName(assignment)}
                                      </span>
                                      <span className="am-asset-meta block">
                                        {asset?.assetTag ||
                                          getAssignmentAssetTag(assignment)}
                                      </span>
                                    </span>
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div className="am-owner">
                                    <Avatar className="h-7 w-7">
                                      <AvatarFallback className="text-xs">
                                        {assignment.employeeName
                                          .split(" ")
                                          .map((name) => name[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="am-owner-name">
                                      {assignment.employeeName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatDate(assignment.assignedDate)}
                                </TableCell>
                                <TableCell>
                                  {assignment.returnedDate
                                    ? formatDate(assignment.returnedDate)
                                    : "Current"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={getConditionColor(
                                      assignment.condition
                                    )}
                                  >
                                    {assignment.condition}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {assignment.returnRequestStatus ===
                                  "pending" ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-amber-100 text-amber-800"
                                    >
                                      Return pending
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className={
                                        assignment.isActive
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }
                                    >
                                      {assignment.isActive
                                        ? "Active"
                                        : "Returned"}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        aria-label={`Assignment actions for ${assignment.employeeName}`}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedAssignment(assignment);
                                          setIsAssignmentDetailsDialogOpen(
                                            true
                                          );
                                        }}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedAssignment(assignment);
                                          setIsAssignmentFormDialogOpen(true);
                                        }}
                                      >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Assignment Form
                                      </DropdownMenuItem>
                                      {assignment.isActive && (
                                        <DropdownMenuItem
                                          disabled={
                                            !asset ||
                                            !canProcessReturnForAsset(asset)
                                          }
                                          onClick={() =>
                                            asset &&
                                            openReturnDialogForAsset(asset)
                                          }
                                        >
                                          <RefreshCw className="mr-2 h-4 w-4" />
                                          Process return
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "returns" && (
                <div>
                  {!canProcessReturn ? (
                    <div className="am-empty">
                      <RefreshCw className="am-empty-icon p-3" />
                      <h3>Return requests hidden</h3>
                      <p>
                        You do not have permission to process asset returns.
                      </p>
                    </div>
                  ) : pendingReturnRequests.length === 0 ? (
                    <div className="am-empty">
                      <RefreshCw className="am-empty-icon p-3" />
                      <h3>No pending return requests</h3>
                      <p>
                        Employee return requests will appear here for HR review.
                      </p>
                    </div>
                  ) : (
                    <div className="am-list">
                      {pendingReturnRequests.map((request) => (
                        <div key={request.id} className="am-listrow">
                          <span className="am-asset-ic">
                            <RefreshCw className="h-5 w-5" />
                          </span>
                          <div className="am-listrow-main">
                            <div className="am-listrow-title">
                              {request.assetName}
                              {request.assetTag ? (
                                <span className="am-tag ml-2">
                                  {request.assetTag}
                                </span>
                              ) : null}
                            </div>
                            <div className="am-listrow-sub">
                              Requested by {request.employeeName}
                              {request.requestedAt
                                ? ` · ${formatDate(request.requestedAt)}`
                                : ""}
                            </div>
                            {request.notes && (
                              <div className="am-listrow-sub">
                                {request.notes}
                              </div>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800"
                          >
                            Pending review
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReturnRequest(request);
                              setReturnRejectionReason("");
                              setIsReturnRequestDetailsOpen(true);
                            }}
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              void approvePendingReturn(request.assignmentId)
                            }
                          >
                            Approve
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "maintenance" && (
                <div>
                  <div className="am-toolbar">
                    <Tabs
                      value={maintenanceQueueTab}
                      onValueChange={(value) =>
                        setMaintenanceQueueTab(value as MaintenanceQueueTab)
                      }
                    >
                      <TabsList>
                        {MAINTENANCE_QUEUE_TABS.map((tab) => (
                          <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    <Input
                      value={maintenanceQueueSearchTerm}
                      onChange={(event) =>
                        setMaintenanceQueueSearchTerm(event.target.value)
                      }
                      placeholder="Search asset or user"
                    />
                    <Select
                      value={maintenanceQueueTypeFilter}
                      onValueChange={(value) =>
                        setMaintenanceQueueTypeFilter(
                          value as ScheduledMaintenanceType | "all"
                        )
                      }
                    >
                      <SelectTrigger className="w-full md:w-44">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {MAINTENANCE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="am-toolbar-spacer" />
                    {canManageMaintenance && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMaintenanceForm()}
                      >
                        <Wrench className="mr-2 h-4 w-4" />
                        Schedule maintenance
                      </Button>
                    )}
                  </div>

                  {!hasScheduledMaintenanceAccess ? (
                    <div className="am-empty">
                      <Wrench className="am-empty-icon p-3" />
                      <h3>Maintenance hidden</h3>
                      <p>
                        You do not have permission to view scheduled
                        maintenance.
                      </p>
                    </div>
                  ) : visibleScheduledMaintenance.length === 0 ? (
                    <div className="am-empty">
                      <Wrench className="am-empty-icon p-3" />
                      <h3>No maintenance items</h3>
                      <p>Matching maintenance items will appear here.</p>
                    </div>
                  ) : (
                    <div className="am-list">
                      {visibleScheduledMaintenance.map((item) => (
                        <div key={item.id} className="am-listrow">
                          <button
                            type="button"
                            className="am-asset-ic"
                            onClick={() => {
                              const asset = assets.find(
                                (candidate) => candidate.id === item.asset
                              );
                              if (asset) void openAssetDetails(asset);
                            }}
                          >
                            <Wrench className="h-5 w-5" />
                          </button>
                          <div className="am-listrow-main">
                            <div className="am-listrow-title">
                              {item.asset_details?.name ||
                                `Asset #${item.asset}`}
                            </div>
                            <div className="am-listrow-sub">
                              {formatMaintenanceType(item.maintenance_type)} ·
                              Due {formatDate(item.due_date)}
                              {item.vendor ? ` · ${item.vendor}` : ""}
                            </div>
                            <div className="am-listrow-sub">{item.reason}</div>
                          </div>
                          <Badge
                            variant="outline"
                            className={getMaintenanceStatusBadgeClass(
                              item.status
                            )}
                          >
                            {formatMaintenanceStatus(item.status)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getMaintenanceDueBadgeClass(
                              item.due_state
                            )}
                          >
                            {formatDueState(item.due_state)}
                          </Badge>
                          {canManageMaintenance &&
                            item.status === "scheduled" && (
                              <div className="am-rowactions">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openCompleteMaintenance(item)}
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setMaintenanceCancelTarget(item);
                                    setMaintenanceCancelReason("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "logs" && (
                <div>
                  {inventoryReplacementLogs.length === 0 ? (
                    <div className="am-empty">
                      <History className="am-empty-icon p-3" />
                      <h3>No replacement logs</h3>
                      <p>
                        Replacement and write-off events from the API will
                        appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="am-tablewrap">
                      <Table className="am-table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Related asset</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryReplacementLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <button
                                  type="button"
                                  className="am-asset-cell text-left"
                                  onClick={() => {
                                    const asset = assets.find(
                                      (candidate) => candidate.id === log.asset
                                    );
                                    if (asset) void openAssetDetails(asset);
                                  }}
                                >
                                  <span className="am-asset-ic">
                                    <History className="h-5 w-5" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="am-asset-name block">
                                      {log.asset_details?.name ||
                                        `Asset #${log.asset}`}
                                    </span>
                                    <span className="am-asset-meta block">
                                      {log.asset_details?.asset_id ||
                                        log.asset_details?.serial_number ||
                                        ""}
                                    </span>
                                  </span>
                                </button>
                              </TableCell>
                              <TableCell>
                                {formatReplacementLogDate(
                                  log.date || log.created_at || ""
                                )}
                              </TableCell>
                              <TableCell>
                                {log.reason || "Maintenance record"}
                              </TableCell>
                              <TableCell>
                                {formatSnapshotValue(log.asset_status_before)} →{" "}
                                {formatSnapshotValue(log.asset_status_after)}
                              </TableCell>
                              <TableCell>
                                {formatSnapshotValue(
                                  log.asset_condition_before
                                )}{" "}
                                →{" "}
                                {formatSnapshotValue(log.asset_condition_after)}
                              </TableCell>
                              <TableCell>
                                {log.replacement_asset_details?.name || "None"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {log.cost
                                  ? formatCurrency(Number(log.cost))
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="am-rail">
            <div className="am-rail-card">
              <div className="am-rail-head">
                <Activity className="h-4 w-4" />
                Quick actions
              </div>
              <div className="am-rail-body">
                <button
                  type="button"
                  className="am-qa am-qa-primary"
                  onClick={() => setIsAddAssetDialogOpen(true)}
                  disabled={!canCreateAssets}
                >
                  <span className="am-qa-ic">
                    <Plus className="h-4 w-4" />
                  </span>
                  <span>Add new asset</span>
                </button>
                <button
                  type="button"
                  className="am-qa"
                  onClick={() => void openAssignDialog()}
                  disabled={!canAssignAssets}
                >
                  <span className="am-qa-ic">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <span>Assign asset</span>
                </button>
                <button
                  type="button"
                  className="am-qa"
                  onClick={() => openMaintenanceForm()}
                  disabled={!canManageMaintenance}
                >
                  <span className="am-qa-ic">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <span>Schedule maintenance</span>
                </button>
                <button
                  type="button"
                  className="am-qa"
                  onClick={() => void handleExportAssets()}
                  disabled={!canExportInventory || isExportingAssets}
                >
                  <span className="am-qa-ic">
                    <Download className="h-4 w-4" />
                  </span>
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <div className="am-rail-card">
              <div className="am-rail-head">
                <AlertTriangle className="h-4 w-4" />
                Needs attention
              </div>
              <div className="am-rail-body">
                {[
                  {
                    title: "Return requests",
                    sub: "Awaiting review",
                    count: pendingReturnRequests.length,
                    icon: RefreshCw,
                    onClick: () => setActiveTab("returns"),
                  },
                  {
                    title: "Overdue maintenance",
                    sub: "Past due date",
                    count: scheduledMaintenance.filter(
                      (item) =>
                        item.status === "scheduled" &&
                        item.due_state === "overdue"
                    ).length,
                    icon: AlertCircle,
                    onClick: () => {
                      setMaintenanceQueueTab("overdue");
                      setActiveTab("maintenance");
                    },
                  },
                  {
                    title: "Lost or damaged",
                    sub: "Need attention",
                    count: assets.filter(
                      (asset) =>
                        asset.status === "lost" || asset.status === "damaged"
                    ).length,
                    icon: AlertTriangle,
                    onClick: () => {
                      setStatusFilter("all");
                      setQuickFilter("issues");
                      setActiveTab("assets");
                    },
                  },
                ]
                  .filter((item) => item.count > 0)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        className="am-attn"
                        onClick={item.onClick}
                      >
                        <span className="am-attn-dot">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="am-attn-txt">
                          <strong>{item.title}</strong>
                          <span>{item.sub}</span>
                        </span>
                        <span className="am-attn-num">{item.count}</span>
                      </button>
                    );
                  })}
                {pendingReturnRequests.length === 0 &&
                  scheduledMaintenance.filter(
                    (item) =>
                      item.status === "scheduled" &&
                      item.due_state === "overdue"
                  ).length === 0 &&
                  assets.filter(
                    (asset) =>
                      asset.status === "lost" || asset.status === "damaged"
                  ).length === 0 && (
                    <div className="px-3 py-4 text-sm text-zinc-500">
                      No current alerts.
                    </div>
                  )}
              </div>
            </div>

            <div className="am-rail-card">
              <div className="am-rail-head">
                <Package className="h-4 w-4" />
                Categories
              </div>
              <div className="am-rail-body">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = assets.filter(
                    (asset) => asset.category === category.value
                  ).length;
                  return (
                    <button
                      key={category.value}
                      type="button"
                      className="am-rail-stat w-full"
                      onClick={() => {
                        setCategoryFilter(category.value);
                        setActiveTab("assets");
                      }}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {category.label}
                        </span>
                        <b>{count}</b>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Details Dialog */}
      <Dialog
        open={isAssignmentDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsAssignmentDetailsDialogOpen(open);
          if (!open) {
            setSelectedAssignment(null);
          }
        }}
      >
        <DialogContent
          className={`max-w-3xl max-h-[90vh] gap-5 overflow-y-auto rounded-2xl p-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {formatAssetDetailValue(selectedAssignmentAssetTag)}
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Assignment Details
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Read-only assignment history and return workflow record.
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-6 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Asset</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignmentAssetName}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedAssignmentAssetTag}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Employee</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.employeeName}
                  </p>
                  {(selectedAssignment.employeeEmail ||
                    selectedAssignment.employeeUsername) && (
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedAssignment.employeeEmail ||
                        selectedAssignment.employeeUsername}
                    </p>
                  )}
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Assigned Date</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {formatDate(selectedAssignment.assignedDate)}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Returned Date</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.returnedDate
                      ? formatDate(selectedAssignment.returnedDate)
                      : "Current assignment"}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Duration</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignmentDuration} days
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Condition</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.condition}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Status</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.isActive ? "Active" : "Returned"}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Assigned By</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.assignedBy}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Return Status</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.returnRequestStatus}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Return Requested</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.returnRequestedAt
                      ? formatDate(selectedAssignment.returnRequestedAt)
                      : "Not requested"}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Return Reviewed</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.returnReviewedAt
                      ? formatDate(selectedAssignment.returnReviewedAt)
                      : "Not reviewed"}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Rejection Reason</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssignment.returnRejectionReason || "None"}
                  </p>
                </div>
              </div>

              {selectedAssignment.notes && (
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Notes</p>
                  <p className="mt-2 rounded-md border border-gray-200 p-3 text-sm text-gray-700">
                    {selectedAssignment.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsAssignmentDetailsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Form Dialog */}
      <Dialog
        open={isAssignmentFormDialogOpen}
        onOpenChange={(open) => {
          setIsAssignmentFormDialogOpen(open);
          if (!open) {
            setSelectedAssignment(null);
          }
        }}
      >
        <DialogContent
          className={`max-w-3xl max-h-[90vh] gap-5 overflow-y-auto rounded-2xl p-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Handover record
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Assignment Form
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Printable asset handover record for employee acknowledgement.
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-6 text-black">
              <div className="border border-gray-300 p-5">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Asset Assignment Form
                    </h3>
                    <p className="text-sm text-gray-600">
                      Assignment #{selectedAssignment.id}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>Issued {formatDate(selectedAssignment.assignedDate)}</p>
                    <p>
                      Status:{" "}
                      {selectedAssignment.isActive ? "Active" : "Returned"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Employee</h4>
                    <div>
                      <p className={ASSET_DETAILS_LABEL_CLASS}>Name</p>
                      <p className={ASSET_DETAILS_VALUE_CLASS}>
                        {selectedAssignment.employeeName}
                      </p>
                    </div>
                    <div>
                      <p className={ASSET_DETAILS_LABEL_CLASS}>Employee ID</p>
                      <p className={ASSET_DETAILS_VALUE_CLASS}>
                        {selectedAssignment.employeeId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className={ASSET_DETAILS_LABEL_CLASS}>Contact</p>
                      <p className={ASSET_DETAILS_VALUE_CLASS}>
                        {selectedAssignment.employeeEmail ||
                          selectedAssignment.employeeUsername ||
                          "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Asset</h4>
                    <div>
                      <p className={ASSET_DETAILS_LABEL_CLASS}>Name</p>
                      <p className={ASSET_DETAILS_VALUE_CLASS}>
                        {selectedAssignmentAssetName}
                      </p>
                    </div>
                    <div>
                      <p className={ASSET_DETAILS_LABEL_CLASS}>Asset Tag</p>
                      <p className={ASSET_DETAILS_VALUE_CLASS}>
                        {selectedAssignmentAssetTag}
                      </p>
                    </div>
                    <div>
                      <p className={ASSET_DETAILS_LABEL_CLASS}>Serial Number</p>
                      <p className={ASSET_DETAILS_VALUE_CLASS}>
                        {selectedAssignmentAsset?.serialNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className={ASSET_DETAILS_LABEL_CLASS}>Condition</p>
                      <p className={ASSET_DETAILS_VALUE_CLASS}>
                        {selectedAssignment.condition}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900">
                    Acknowledgement
                  </h4>
                  <p className="mt-2 text-sm text-gray-700">
                    The employee acknowledges receiving the asset listed above
                    in the stated condition and agrees to return it according to
                    company policy.
                  </p>
                  {selectedAssignment.notes && (
                    <p className="mt-3 text-sm text-gray-700">
                      Notes: {selectedAssignment.notes}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
                  <div>
                    <div className="border-t border-gray-400 pt-2 text-sm text-gray-700">
                      Employee Signature / Date
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-gray-400 pt-2 text-sm text-gray-700">
                      HR or Manager Signature / Date
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    window.print();
                  }}
                >
                  Print Form
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAssignmentFormDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Checklist Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent
          className={`max-w-2xl max-h-[90vh] gap-5 overflow-y-auto rounded-2xl p-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {formatAssetDetailValue(selectedAsset?.assetTag)}
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Process return · {selectedAsset?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Complete the return checklist to process the asset return for{" "}
              {selectedAsset?.assignedEmployeeName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Asset Info */}
            {selectedAsset && (
              <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-sm leading-relaxed text-blue-700">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  Currently held by{" "}
                  <b className="font-semibold">
                    {selectedAsset.assignedEmployeeName || "—"}
                  </b>
                  . Approving releases{" "}
                  <span className="font-mono">{selectedAsset.assetTag}</span>{" "}
                  back to inventory.
                </div>
              </div>
            )}

            {/* Return Checklist */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Return Checklist</h4>
              <div className="space-y-3">
                {returnChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(checked) =>
                        updateChecklistItem(item.id, checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-900">
                          {item.label}
                        </label>
                        {item.required && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-50 text-red-700 border-red-200"
                          >
                            Required
                          </Badge>
                        )}
                      </div>
                      {item.checked && (
                        <Textarea
                          placeholder="Add notes (optional)"
                          value={item.notes || ""}
                          onChange={(e) =>
                            updateChecklistItem(item.id, true, e.target.value)
                          }
                          className={`mt-2 ${ADD_ASSET_LIGHT_FIELD_CLASS}`}
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return Notes */}
            <div className="space-y-2">
              <Label htmlFor="return-notes" className="text-gray-900">
                Additional Return Notes
              </Label>
              <Textarea
                id="return-notes"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                placeholder="Any additional notes about the asset condition or return process..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-900">
                <span>Checklist Progress</span>
                <span>
                  {returnChecklist.filter((item) => item.checked).length}/
                  {returnChecklist.length}
                </span>
              </div>
              <Progress
                value={
                  (returnChecklist.filter((item) => item.checked).length /
                    returnChecklist.length) *
                  100
                }
                className="h-2"
              />
            </div>
          </div>

          <DialogFooter className="mt-1 flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsReturnDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void returnAsset();
              }}
              variant="primary"
              disabled={
                !selectedAsset ||
                !canProcessReturnForAsset(selectedAsset) ||
                !returnChecklist
                  .filter((item) => item.required)
                  .every((item) => item.checked)
              }
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {selectedAsset && canApproveReturnForAsset(selectedAsset)
                ? "Approve Return"
                : "Request Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Asset Dialog */}
      <Dialog
        open={isAddAssetDialogOpen}
        onOpenChange={setIsAddAssetDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] gap-5 overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 dark:bg-white dark:text-gray-900">
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              New asset
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight">
              Add new asset
            </DialogTitle>
            <DialogDescription>
              Register a new asset in the system with complete details and
              specifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {renderFormSection(Tag, "Identification")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name">Asset Name *</Label>
                <Input
                  id="asset-name"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={newAsset.name}
                  onChange={(e) =>
                    setNewAsset((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter asset name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-category">Category *</Label>
                <Select
                  value={newAsset.category}
                  onValueChange={(value) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      category: value as AssetCategory,
                    }))
                  }
                >
                  <SelectTrigger
                    id="asset-category"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className={ADD_ASSET_LIGHT_SURFACE_CLASS}>
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serial-number">Serial Number *</Label>
                <Input
                  id="serial-number"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={newAsset.serialNumber}
                  onChange={(e) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      serialNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter serial number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-tag">Asset Tag</Label>
                <Input
                  id="asset-tag"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={newAsset.assetTag}
                  onChange={(e) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      assetTag: e.target.value,
                    }))
                  }
                  placeholder="Auto-generated if empty"
                />
                <p className="text-xs text-gray-500">
                  {newAsset.assetTag.trim()
                    ? "Custom tag"
                    : `Auto-generates as ${computeNextAssetTag(newAsset.category)}`}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100" />
            {renderFormSection(CircleDot, "Status & condition")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset-status">Status</Label>
                <Select
                  value={newAsset.status}
                  onValueChange={(value) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      status: value as AssetStatus,
                    }))
                  }
                >
                  <SelectTrigger
                    id="asset-status"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className={ADD_ASSET_LIGHT_SURFACE_CLASS}>
                    {ASSET_STATUS_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-condition">Condition</Label>
                <Select
                  value={newAsset.condition}
                  onValueChange={(value) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      condition: value as AssetCondition,
                    }))
                  }
                >
                  <SelectTrigger
                    id="asset-condition"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className={ADD_ASSET_LIGHT_SURFACE_CLASS}>
                    {ASSET_CONDITION_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-gray-100" />
            {renderFormSection(FileText, "Details")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={newAsset.brand}
                  onChange={(e) =>
                    setNewAsset((prev) => ({ ...prev, brand: e.target.value }))
                  }
                  placeholder="Enter brand name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={newAsset.model}
                  onChange={(e) =>
                    setNewAsset((prev) => ({ ...prev, model: e.target.value }))
                  }
                  placeholder="Enter model name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                placeholder="Brief description of the asset..."
                value={newAsset.description}
                onChange={(e) =>
                  setNewAsset((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="h-px bg-gray-100" />
            {renderFormSection(CalendarDays, "Purchase & warranty")}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)]">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <DatePicker
                  mode="single"
                  value={newAsset.purchaseDate}
                  onChange={(date) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      purchaseDate: date,
                    }))
                  }
                  placeholder="Select date"
                  size="compact"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="purchase-price">Purchase Price</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={newAsset.purchasePrice}
                  onChange={(e) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      purchasePrice: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="min-w-0 space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="warranty">Warranty Until</Label>
                <DatePicker
                  mode="single"
                  value={newAsset.warranty}
                  onChange={(date) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      warranty: date,
                    }))
                  }
                  placeholder="Select date"
                  size="compact"
                  popoverAlign="end"
                />
              </div>
            </div>

            <div className="h-px bg-gray-100" />
            {renderFormSection(MapPin, "Location")}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                value={newAsset.location}
                onChange={(e) =>
                  setNewAsset((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="IT Storage Room"
              />
            </div>

            <div className="h-px bg-gray-100" />
            {renderFormSection(
              List,
              "Specifications",
              "Optional key/value pairs — stored as JSON on the asset."
            )}
            <div className="space-y-2">
              <Label htmlFor="specifications">Specifications (JSON)</Label>
              <Textarea
                id="specifications"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                placeholder='{"RAM": "16GB", "Storage": "512GB", "Processor": "Intel i7"}'
                value={newAsset.specifications}
                onChange={(e) =>
                  setNewAsset((prev) => ({
                    ...prev,
                    specifications: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-xs leading-relaxed text-blue-700">
              <QrCode className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                A scannable QR code is generated automatically once the asset is
                saved — available from its detail panel.
              </span>
            </div>
          </div>

          <DialogFooter className="mt-1 flex-row items-center sm:justify-end">
            <div className="mr-auto flex items-center gap-1.5 text-xs text-gray-500">
              <AlertCircle className="h-3.5 w-3.5" />
              Fields marked <span className="text-red-600">*</span> are required
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAddAssetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void addNewAsset();
              }}
              disabled={
                !canCreateAssets ||
                !newAsset.name ||
                !newAsset.category ||
                !newAsset.serialNumber
              }
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Request Details Dialog */}
      <Dialog
        open={isReturnRequestDetailsOpen}
        onOpenChange={(open) => {
          setIsReturnRequestDetailsOpen(open);
          if (!open) {
            setSelectedReturnRequest(null);
            setReturnRejectionReason("");
          }
        }}
      >
        <DialogContent
          className={`max-w-2xl max-h-[90vh] gap-5 overflow-y-auto rounded-2xl p-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Return request
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Return Request Details
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Review the submitted return checklist before approving or
              rejecting the request.
            </DialogDescription>
          </DialogHeader>

          {selectedReturnRequest && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900">
                    {selectedReturnRequest.assetName}
                    {selectedReturnRequest.assetTag
                      ? ` (${selectedReturnRequest.assetTag})`
                      : ""}
                  </h4>
                  <p className="text-sm text-gray-700">
                    Requested by {selectedReturnRequest.employeeName}
                    {selectedReturnRequest.requestedAt
                      ? ` on ${formatDate(selectedReturnRequest.requestedAt)}`
                      : ""}
                  </p>
                </div>
              </div>

              {selectedReturnRequest.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Return Notes</h4>
                  <p className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                    {selectedReturnRequest.notes}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Return Checklist</h4>
                {selectedReturnRequest.checklist.length === 0 ? (
                  <p className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                    No checklist was submitted with this return request.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedReturnRequest.checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <Checkbox
                          checked={item.checked}
                          disabled
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {item.label}
                            </span>
                            {item.required && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-red-50 text-red-700 border-red-200"
                              >
                                Required
                              </Badge>
                            )}
                          </div>
                          {item.notes && (
                            <p className="mt-2 text-sm text-gray-700">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="return-rejection-reason"
                  className="text-gray-900"
                >
                  Rejection Reason
                </Label>
                <Textarea
                  id="return-rejection-reason"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  placeholder="Describe why this return request is being rejected..."
                  value={returnRejectionReason}
                  onChange={(event) =>
                    setReturnRejectionReason(event.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    void approvePendingReturn(
                      selectedReturnRequest.assignmentId
                    );
                  }}
                  variant="primary"
                >
                  Approve return
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    void rejectPendingReturn(
                      selectedReturnRequest.assignmentId
                    );
                  }}
                >
                  Reject return
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Asset Details Dialog */}
      <Dialog
        open={isAssetDetailsDialogOpen}
        onOpenChange={setIsAssetDetailsDialogOpen}
      >
        <DialogContent
          className={`left-auto top-0 right-0 bottom-0 h-screen min-h-0 max-h-screen w-full max-w-[560px] translate-x-0 translate-y-0 gap-5 overflow-y-auto rounded-none border-l p-6 data-[state=open]:slide-in-from-right-6 data-[state=closed]:slide-out-to-right-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {formatAssetDetailValue(selectedAsset?.assetTag)}
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-black">
              {selectedAsset?.name || "Asset Details"}
            </DialogTitle>
            <DialogDescription className="text-black">
              View asset metadata, assignment status, and maintenance history.
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-5 text-black">
              {/* Hero */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl border border-gray-100 bg-gray-50 text-gray-700">
                  {(() => {
                    const HeroIcon = getCategoryIcon(selectedAsset.category);
                    return <HeroIcon className="h-7 w-7" />;
                  })()}
                </span>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getConditionColor(selectedAsset.condition)}
                    >
                      {selectedAsset.condition}
                    </Badge>
                    <span className="truncate text-xs text-gray-500">
                      {selectedAsset.brand} · {selectedAsset.model}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg font-semibold text-gray-900">
                      {Number.isFinite(selectedAsset.purchasePrice)
                        ? formatCurrency(selectedAsset.purchasePrice)
                        : "—"}
                    </span>
                    <span className="text-xs text-gray-500">
                      purchase value
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`ml-auto flex-shrink-0 ${getStatusColor(
                    selectedAsset.status
                  )}`}
                >
                  {selectedAsset.status}
                </Badge>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-100 bg-gray-100">
                {(
                  [
                    ["Category", formatSnapshotValue(selectedAsset.category)],
                    [
                      "Serial Number",
                      formatAssetDetailValue(selectedAsset.serialNumber),
                      true,
                    ],
                    ["Status", formatSnapshotValue(selectedAsset.status)],
                    ["Condition", formatSnapshotValue(selectedAsset.condition)],
                    ["Brand", formatAssetDetailValue(selectedAsset.brand)],
                    ["Model", formatAssetDetailValue(selectedAsset.model)],
                    [
                      "Location",
                      formatAssetDetailValue(selectedAsset.location),
                    ],
                    ["Assigned To", selectedAssetAssigneeName],
                    [
                      "Assigned Date",
                      selectedAsset.assignedDate
                        ? formatDate(selectedAsset.assignedDate)
                        : "Not recorded",
                    ],
                    [
                      "Purchase Date",
                      selectedAsset.purchaseDate
                        ? formatDate(selectedAsset.purchaseDate)
                        : "Not recorded",
                    ],
                    [
                      "Purchase Price",
                      Number.isFinite(selectedAsset.purchasePrice)
                        ? formatCurrency(selectedAsset.purchasePrice)
                        : "Not recorded",
                    ],
                    [
                      "Warranty Until",
                      formatAssetDetailValue(selectedAsset.warranty),
                    ],
                    [
                      "Warranty",
                      selectedAsset.warranty &&
                      selectedAsset.warranty >= getTodayDateValue()
                        ? "Active"
                        : "Expired",
                    ],
                    [
                      "Availability",
                      selectedAsset.isAvailable ? "Available" : "In use",
                    ],
                  ] as [string, string, boolean?][]
                ).map(([label, value, mono]) => (
                  <div key={label} className="bg-white px-3.5 py-2.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-gray-500">
                      {label}
                    </p>
                    <p
                      className={`mt-0.5 text-sm font-medium text-gray-900 ${
                        mono ? "font-mono text-[13px]" : ""
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-gray-700">
                  {formatAssetDetailValue(selectedAsset.description)}
                </p>
              </div>

              {/* Specifications */}
              {Object.keys(selectedAsset.specifications || {}).length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <List className="h-4 w-4 text-gray-400" />
                    Specifications
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    {Object.entries(selectedAsset.specifications).map(
                      ([key, value], index, entries) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm ${
                            index < entries.length - 1
                              ? "border-b border-gray-100"
                              : ""
                          }`}
                        >
                          <span className="text-gray-500">
                            {formatSnapshotValue(key)}
                          </span>
                          <span className="text-right font-medium text-gray-900">
                            {value}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* QR code */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <QrCode className="h-4 w-4 text-gray-400" />
                  QR Code
                </h4>
                <div className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="grid h-[104px] w-[104px] flex-shrink-0 place-items-center rounded-lg border border-gray-200 bg-white p-2">
                    {qrCodePreviewUrl ? (
                      <img
                        src={qrCodePreviewUrl}
                        alt={`${selectedAsset.name} QR code`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <p className="px-2 text-center text-xs text-gray-500">
                        {isQrCodePreviewLoading
                          ? "Loading QR..."
                          : "QR not available"}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">
                      Scan to open the asset record
                    </p>
                    {selectedAsset.qrCodePayload && (
                      <p className="mt-1 break-all font-mono text-[11px] text-gray-600">
                        {selectedAsset.qrCodePayload}
                      </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={
                          !selectedAsset.qrCodeUrl ||
                          downloadingQrCodeAssetId === selectedAsset.id
                        }
                        onClick={() => {
                          void handleDownloadAssetQrCode(selectedAsset);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {downloadingQrCodeAssetId === selectedAsset.id
                          ? "Downloading..."
                          : "Download QR"}
                      </Button>
                    </div>
                    {qrCodeError && (
                      <p className="mt-2 text-sm text-red-700">{qrCodeError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignment history */}
              {(() => {
                const assetHistory = assignments
                  .filter((item) => item.assetId === selectedAsset.id)
                  .slice()
                  .sort((a, b) =>
                    (b.assignedDate || "").localeCompare(a.assignedDate || "")
                  );
                if (assetHistory.length === 0) {
                  return null;
                }
                return (
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <History className="h-4 w-4 text-gray-400" />
                      Assignment history
                    </h4>
                    <div className="space-y-0">
                      {assetHistory.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative flex gap-3 pb-4 last:pb-0"
                        >
                          {index < assetHistory.length - 1 && (
                            <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-200" />
                          )}
                          <span className="z-[1] grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-gray-200 bg-gray-50 text-gray-600">
                            {item.isActive ? (
                              <UserCheck className="h-3.5 w-3.5" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">
                              {item.isActive ? "Assigned " : "Held "}
                              {item.assignedDate
                                ? formatDate(item.assignedDate)
                                : "—"}
                              {item.returnedDate
                                ? ` → returned ${formatDate(item.returnedDate)}`
                                : " · current holder"}
                              {item.assignedBy
                                ? ` · by ${item.assignedBy}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-md border border-gray-200 p-2.5">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-black">
                    Scheduled Maintenance
                  </p>
                  {canLogReplacement && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedAsset) {
                          openMaintenanceForm(selectedAsset);
                        }
                      }}
                      className="h-8"
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Schedule Maintenance
                    </Button>
                  )}
                </div>

                {isLoadingScheduledMaintenance ? (
                  <p className="text-sm text-black">
                    Loading scheduled maintenance...
                  </p>
                ) : selectedAssetScheduledMaintenance.length === 0 ? (
                  <p className="text-sm text-black">
                    No scheduled maintenance available.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedAssetScheduledMaintenance.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-gray-950">
                              {item.reason}
                            </p>
                            <p className="text-gray-700">
                              {formatMaintenanceType(item.maintenance_type)} •
                              Due {formatDate(item.due_date)}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getMaintenanceStatusBadgeClass(
                                  item.status
                                )}
                              >
                                Status: {formatMaintenanceStatus(item.status)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getMaintenanceDueBadgeClass(
                                  item.due_state
                                )}
                              >
                                Due state: {formatDueState(item.due_state)}
                              </Badge>
                              {item.owner_details && (
                                <Badge
                                  variant="outline"
                                  className="border-violet-200 bg-violet-50 text-violet-800"
                                >
                                  Owner: {toPersonName(item.owner_details)}
                                </Badge>
                              )}
                            </div>
                            {item.estimated_cost && (
                              <p className="mt-2 text-gray-700">
                                Estimated cost:{" "}
                                {formatCurrency(Number(item.estimated_cost))}
                              </p>
                            )}
                            {item.vendor && (
                              <p className="text-gray-700">
                                Vendor: {item.vendor}
                              </p>
                            )}
                            {item.cancelled_reason && (
                              <p className="text-gray-700">
                                Cancel reason: {item.cancelled_reason}
                              </p>
                            )}
                          </div>
                          {canLogReplacement && item.status === "scheduled" && (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openCompleteMaintenance(item)}
                              >
                                Complete
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setMaintenanceCancelTarget(item);
                                  setMaintenanceCancelReason("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-md border border-gray-200 p-2.5">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-black">Maintenance</p>
                  {canLogReplacement && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReplacementFormOpen((prev) => !prev)}
                      className="h-8"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Log Maintenance
                    </Button>
                  )}
                </div>

                {isReplacementFormOpen && (
                  <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        This creates a history record only. It will not change
                        asset status, condition, availability, assignment, or
                        the selected related asset.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="replacement-date">
                          Maintenance Date *
                        </Label>
                        <DatePicker
                          mode="single"
                          value={replacementForm.date}
                          onChange={(date) =>
                            setReplacementForm((prev) => ({
                              ...prev,
                              date,
                            }))
                          }
                          placeholder="Select date"
                          size="compact"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="replacement-cost">Cost</Label>
                        <Input
                          id="replacement-cost"
                          type="number"
                          step="0.01"
                          min="0"
                          className={ADD_ASSET_LIGHT_FIELD_CLASS}
                          value={replacementForm.cost}
                          onChange={(event) =>
                            setReplacementForm((prev) => ({
                              ...prev,
                              cost: event.target.value,
                            }))
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <Label htmlFor="replacement-reason">Reason *</Label>
                      <Textarea
                        id="replacement-reason"
                        className={ADD_ASSET_LIGHT_FIELD_CLASS}
                        value={replacementForm.reason}
                        onChange={(event) =>
                          setReplacementForm((prev) => ({
                            ...prev,
                            reason: event.target.value,
                          }))
                        }
                        placeholder="Why is this maintenance being logged?"
                        rows={3}
                      />
                    </div>

                    <div className="mt-3 space-y-2">
                      <Label htmlFor="replacement-asset">Related Asset</Label>
                      <Select
                        value={replacementForm.replacementAssetId}
                        onValueChange={(value) =>
                          setReplacementForm((prev) => ({
                            ...prev,
                            replacementAssetId: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          id="replacement-asset"
                          className={ADD_ASSET_LIGHT_FIELD_CLASS}
                        >
                          <SelectValue placeholder="Optional related asset" />
                        </SelectTrigger>
                        <SelectContent
                          className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                        >
                          <SelectItem
                            value="none"
                            className={ADD_ASSET_LIGHT_ITEM_CLASS}
                          >
                            No related asset
                          </SelectItem>
                          {replacementAssetOptions.map((asset) => (
                            <SelectItem
                              key={asset.id}
                              value={String(asset.id)}
                              className={ADD_ASSET_LIGHT_ITEM_CLASS}
                            >
                              {asset.name} ({asset.assetTag})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="replacement-status-before">
                          Status before
                        </Label>
                        <Select
                          value={replacementForm.assetStatusBefore}
                          onValueChange={(value) =>
                            setReplacementForm((prev) => ({
                              ...prev,
                              assetStatusBefore: value,
                            }))
                          }
                        >
                          <SelectTrigger
                            id="replacement-status-before"
                            className={ADD_ASSET_LIGHT_FIELD_CLASS}
                          >
                            <SelectValue placeholder="Use current asset status" />
                          </SelectTrigger>
                          <SelectContent
                            className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                          >
                            <SelectItem
                              value="none"
                              className={ADD_ASSET_LIGHT_ITEM_CLASS}
                            >
                              Status before: Not recorded
                            </SelectItem>
                            {ASSET_STATUS_OPTIONS.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                                className={ADD_ASSET_LIGHT_ITEM_CLASS}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="replacement-status-after">
                          Status after
                        </Label>
                        <Select
                          value={replacementForm.assetStatusAfter}
                          onValueChange={(value) =>
                            setReplacementForm((prev) => ({
                              ...prev,
                              assetStatusAfter: value,
                            }))
                          }
                        >
                          <SelectTrigger
                            id="replacement-status-after"
                            className={ADD_ASSET_LIGHT_FIELD_CLASS}
                          >
                            <SelectValue placeholder="Optional after-state status" />
                          </SelectTrigger>
                          <SelectContent
                            className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                          >
                            <SelectItem
                              value="none"
                              className={ADD_ASSET_LIGHT_ITEM_CLASS}
                            >
                              Status after: Not recorded
                            </SelectItem>
                            {ASSET_STATUS_OPTIONS.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                                className={ADD_ASSET_LIGHT_ITEM_CLASS}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="replacement-condition-before">
                          Condition before
                        </Label>
                        <Select
                          value={replacementForm.assetConditionBefore}
                          onValueChange={(value) =>
                            setReplacementForm((prev) => ({
                              ...prev,
                              assetConditionBefore: value,
                            }))
                          }
                        >
                          <SelectTrigger
                            id="replacement-condition-before"
                            className={ADD_ASSET_LIGHT_FIELD_CLASS}
                          >
                            <SelectValue placeholder="Use current asset condition" />
                          </SelectTrigger>
                          <SelectContent
                            className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                          >
                            <SelectItem
                              value="none"
                              className={ADD_ASSET_LIGHT_ITEM_CLASS}
                            >
                              Condition before: Not recorded
                            </SelectItem>
                            {ASSET_CONDITION_OPTIONS.map((condition) => (
                              <SelectItem
                                key={condition.value}
                                value={condition.value}
                                className={ADD_ASSET_LIGHT_ITEM_CLASS}
                              >
                                {condition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="replacement-condition-after">
                          Condition after
                        </Label>
                        <Select
                          value={replacementForm.assetConditionAfter}
                          onValueChange={(value) =>
                            setReplacementForm((prev) => ({
                              ...prev,
                              assetConditionAfter: value,
                            }))
                          }
                        >
                          <SelectTrigger
                            id="replacement-condition-after"
                            className={ADD_ASSET_LIGHT_FIELD_CLASS}
                          >
                            <SelectValue placeholder="Optional after-state condition" />
                          </SelectTrigger>
                          <SelectContent
                            className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                          >
                            <SelectItem
                              value="none"
                              className={ADD_ASSET_LIGHT_ITEM_CLASS}
                            >
                              Condition after: Not recorded
                            </SelectItem>
                            {ASSET_CONDITION_OPTIONS.map((condition) => (
                              <SelectItem
                                key={condition.value}
                                value={condition.value}
                                className={ADD_ASSET_LIGHT_ITEM_CLASS}
                              >
                                {condition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          void submitReplacementLog();
                        }}
                        disabled={
                          isCreatingReplacementLog ||
                          !replacementForm.date ||
                          !replacementForm.reason.trim()
                        }
                      >
                        {isCreatingReplacementLog
                          ? "Logging..."
                          : "Save Maintenance"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsReplacementFormOpen(false)}
                        disabled={isCreatingReplacementLog}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {isLoadingReplacementLogs ? (
                  <p className="text-sm text-black">
                    Loading maintenance logs...
                  </p>
                ) : replacementLogs.length === 0 ? (
                  <p className="text-sm text-black">
                    No maintenance logs available.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {replacementLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded border border-gray-100 p-2 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-black">
                            {log.reason || "Maintenance record"}
                          </p>
                          {canLogReplacement && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openReplacementLogEdit(log)}
                              disabled={isUpdatingReplacementLog}
                            >
                              <Edit3 className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          )}
                        </div>
                        <p className="text-black">
                          {log.date
                            ? formatReplacementLogDate(log.date)
                            : log.created_at
                              ? formatReplacementLogDate(log.created_at)
                              : "Date not recorded"}
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-black md:grid-cols-2">
                          <p>
                            Status before:{" "}
                            {formatSnapshotValue(log.asset_status_before)}
                          </p>
                          <p>
                            Status after:{" "}
                            {formatSnapshotValue(log.asset_status_after)}
                          </p>
                          <p>
                            Condition before:{" "}
                            {formatSnapshotValue(log.asset_condition_before)}
                          </p>
                          <p>
                            Condition after:{" "}
                            {formatSnapshotValue(log.asset_condition_after)}
                          </p>
                        </div>
                        {log.replaced_by_details && (
                          <p className="text-black">
                            Logged by: {toPersonName(log.replaced_by_details)}
                          </p>
                        )}
                        {log.replacement_asset_details && (
                          <p className="text-black">
                            Related asset: {log.replacement_asset_details.name}
                          </p>
                        )}
                        {log.cost && (
                          <p className="text-black">
                            Cost: {formatCurrency(Number(log.cost))}
                          </p>
                        )}
                        {editingReplacementLogId === log.id && (
                          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`replacement-log-asset-${log.id}`}
                                >
                                  Asset
                                </Label>
                                <Select
                                  value={replacementEditForm.assetId}
                                  onValueChange={(value) => {
                                    setReplacementEditForm((prev) => ({
                                      ...prev,
                                      assetId: value,
                                      replacementAssetId:
                                        prev.replacementAssetId === value
                                          ? "none"
                                          : prev.replacementAssetId,
                                    }));
                                  }}
                                  disabled={isUpdatingReplacementLog}
                                >
                                  <SelectTrigger
                                    id={`replacement-log-asset-${log.id}`}
                                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                                  >
                                    <SelectValue placeholder="Select asset" />
                                  </SelectTrigger>
                                  <SelectContent
                                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                                  >
                                    {assets.map((asset) => (
                                      <SelectItem
                                        key={asset.id}
                                        value={String(asset.id)}
                                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                      >
                                        {asset.name} ({asset.assetTag})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {replacementEditErrors.asset && (
                                  <p className="text-xs text-red-600">
                                    {replacementEditErrors.asset}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Maintenance date</Label>
                                <DatePicker
                                  mode="single"
                                  value={replacementEditForm.date}
                                  onChange={(date) =>
                                    setReplacementEditForm((prev) => ({
                                      ...prev,
                                      date,
                                    }))
                                  }
                                  placeholder="Select date"
                                  size="compact"
                                  disabled={isUpdatingReplacementLog}
                                />
                                {replacementEditErrors.date && (
                                  <p className="text-xs text-red-600">
                                    {replacementEditErrors.date}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              <Label
                                htmlFor={`replacement-log-reason-${log.id}`}
                              >
                                Reason
                              </Label>
                              <Textarea
                                id={`replacement-log-reason-${log.id}`}
                                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                                value={replacementEditForm.reason}
                                onChange={(event) =>
                                  setReplacementEditForm((prev) => ({
                                    ...prev,
                                    reason: event.target.value,
                                  }))
                                }
                                rows={3}
                                disabled={isUpdatingReplacementLog}
                              />
                              {replacementEditErrors.reason && (
                                <p className="text-xs text-red-600">
                                  {replacementEditErrors.reason}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`replacement-log-replacement-asset-${log.id}`}
                                >
                                  Related asset
                                </Label>
                                <Select
                                  value={replacementEditForm.replacementAssetId}
                                  onValueChange={(value) =>
                                    setReplacementEditForm((prev) => ({
                                      ...prev,
                                      replacementAssetId: value,
                                    }))
                                  }
                                  disabled={isUpdatingReplacementLog}
                                >
                                  <SelectTrigger
                                    id={`replacement-log-replacement-asset-${log.id}`}
                                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                                  >
                                    <SelectValue placeholder="Optional related asset" />
                                  </SelectTrigger>
                                  <SelectContent
                                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                                  >
                                    <SelectItem
                                      value="none"
                                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                    >
                                      No related asset
                                    </SelectItem>
                                    {editReplacementAssetOptions.map(
                                      (asset) => (
                                        <SelectItem
                                          key={asset.id}
                                          value={String(asset.id)}
                                          className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                        >
                                          {asset.name} ({asset.assetTag})
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                                {replacementEditErrors.replacement_asset && (
                                  <p className="text-xs text-red-600">
                                    {replacementEditErrors.replacement_asset}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`replacement-log-cost-${log.id}`}
                                >
                                  Cost
                                </Label>
                                <Input
                                  id={`replacement-log-cost-${log.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                                  value={replacementEditForm.cost}
                                  onChange={(event) =>
                                    setReplacementEditForm((prev) => ({
                                      ...prev,
                                      cost: event.target.value,
                                    }))
                                  }
                                  placeholder="0.00"
                                  disabled={isUpdatingReplacementLog}
                                />
                                {replacementEditErrors.cost && (
                                  <p className="text-xs text-red-600">
                                    {replacementEditErrors.cost}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`replacement-log-status-before-${log.id}`}
                                >
                                  Status before
                                </Label>
                                <Select
                                  value={replacementEditForm.assetStatusBefore}
                                  onValueChange={(value) =>
                                    setReplacementEditForm((prev) => ({
                                      ...prev,
                                      assetStatusBefore: value,
                                    }))
                                  }
                                  disabled={isUpdatingReplacementLog}
                                >
                                  <SelectTrigger
                                    id={`replacement-log-status-before-${log.id}`}
                                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                                  >
                                    <SelectValue placeholder="Optional before-state status" />
                                  </SelectTrigger>
                                  <SelectContent
                                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                                  >
                                    <SelectItem
                                      value="none"
                                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                    >
                                      Status before: Not recorded
                                    </SelectItem>
                                    {ASSET_STATUS_OPTIONS.map((status) => (
                                      <SelectItem
                                        key={status.value}
                                        value={status.value}
                                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                      >
                                        {status.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {replacementEditErrors.asset_status_before && (
                                  <p className="text-xs text-red-600">
                                    {replacementEditErrors.asset_status_before}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`replacement-log-status-after-${log.id}`}
                                >
                                  Status after
                                </Label>
                                <Select
                                  value={replacementEditForm.assetStatusAfter}
                                  onValueChange={(value) =>
                                    setReplacementEditForm((prev) => ({
                                      ...prev,
                                      assetStatusAfter: value,
                                    }))
                                  }
                                  disabled={isUpdatingReplacementLog}
                                >
                                  <SelectTrigger
                                    id={`replacement-log-status-after-${log.id}`}
                                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                                  >
                                    <SelectValue placeholder="Optional after-state status" />
                                  </SelectTrigger>
                                  <SelectContent
                                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                                  >
                                    <SelectItem
                                      value="none"
                                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                    >
                                      Status after: Not recorded
                                    </SelectItem>
                                    {ASSET_STATUS_OPTIONS.map((status) => (
                                      <SelectItem
                                        key={status.value}
                                        value={status.value}
                                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                      >
                                        {status.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {replacementEditErrors.asset_status_after && (
                                  <p className="text-xs text-red-600">
                                    {replacementEditErrors.asset_status_after}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`replacement-log-condition-before-${log.id}`}
                                >
                                  Condition before
                                </Label>
                                <Select
                                  value={
                                    replacementEditForm.assetConditionBefore
                                  }
                                  onValueChange={(value) =>
                                    setReplacementEditForm((prev) => ({
                                      ...prev,
                                      assetConditionBefore: value,
                                    }))
                                  }
                                  disabled={isUpdatingReplacementLog}
                                >
                                  <SelectTrigger
                                    id={`replacement-log-condition-before-${log.id}`}
                                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                                  >
                                    <SelectValue placeholder="Optional before-state condition" />
                                  </SelectTrigger>
                                  <SelectContent
                                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                                  >
                                    <SelectItem
                                      value="none"
                                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                    >
                                      Condition before: Not recorded
                                    </SelectItem>
                                    {ASSET_CONDITION_OPTIONS.map(
                                      (condition) => (
                                        <SelectItem
                                          key={condition.value}
                                          value={condition.value}
                                          className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                        >
                                          {condition.label}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                                {replacementEditErrors.asset_condition_before && (
                                  <p className="text-xs text-red-600">
                                    {
                                      replacementEditErrors.asset_condition_before
                                    }
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`replacement-log-condition-after-${log.id}`}
                                >
                                  Condition after
                                </Label>
                                <Select
                                  value={
                                    replacementEditForm.assetConditionAfter
                                  }
                                  onValueChange={(value) =>
                                    setReplacementEditForm((prev) => ({
                                      ...prev,
                                      assetConditionAfter: value,
                                    }))
                                  }
                                  disabled={isUpdatingReplacementLog}
                                >
                                  <SelectTrigger
                                    id={`replacement-log-condition-after-${log.id}`}
                                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                                  >
                                    <SelectValue placeholder="Optional after-state condition" />
                                  </SelectTrigger>
                                  <SelectContent
                                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                                  >
                                    <SelectItem
                                      value="none"
                                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                    >
                                      Condition after: Not recorded
                                    </SelectItem>
                                    {ASSET_CONDITION_OPTIONS.map(
                                      (condition) => (
                                        <SelectItem
                                          key={condition.value}
                                          value={condition.value}
                                          className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                        >
                                          {condition.label}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                                {replacementEditErrors.asset_condition_after && (
                                  <p className="text-xs text-red-600">
                                    {
                                      replacementEditErrors.asset_condition_after
                                    }
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                              <Button
                                type="button"
                                variant="primary"
                                onClick={() => {
                                  void submitReplacementLogEdit(log.id);
                                }}
                                disabled={isUpdatingReplacementLog}
                              >
                                {isUpdatingReplacementLog
                                  ? "Saving..."
                                  : "Save Changes"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={cancelReplacementLogEdit}
                                disabled={isUpdatingReplacementLog}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog
        open={isMaintenanceFormOpen}
        onOpenChange={setIsMaintenanceFormOpen}
      >
        <DialogContent
          className={`max-w-3xl gap-5 rounded-2xl p-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {maintenanceForm.assetId
                ? formatAssetDetailValue(
                    assets.find(
                      (asset) => String(asset.id) === maintenanceForm.assetId
                    )?.assetTag
                  )
                : "New maintenance"}
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Schedule maintenance
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Create planned maintenance for an asset.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maintenance-asset">Asset *</Label>
                <Select
                  value={maintenanceForm.assetId}
                  onValueChange={(value) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      assetId: value,
                    }))
                  }
                >
                  <SelectTrigger
                    id="maintenance-asset"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent className={ADD_ASSET_LIGHT_SURFACE_CLASS}>
                    {assets.map((asset) => (
                      <SelectItem
                        key={asset.id}
                        value={String(asset.id)}
                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                      >
                        {asset.name} ({asset.assetTag})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due date *</Label>
                <DatePicker
                  mode="single"
                  value={maintenanceForm.dueDate}
                  onChange={(date) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      dueDate: date,
                    }))
                  }
                  placeholder="Select date"
                  size="compact"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maintenance-type">Type *</Label>
                <Select
                  value={maintenanceForm.maintenanceType}
                  onValueChange={(value) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      maintenanceType: value as ScheduledMaintenanceType,
                    }))
                  }
                >
                  <SelectTrigger
                    id="maintenance-type"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className={ADD_ASSET_LIGHT_SURFACE_CLASS}>
                    {MAINTENANCE_TYPE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-owner">Owner</Label>
                <Select
                  value={maintenanceForm.ownerId}
                  onValueChange={(value) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      ownerId: value,
                    }))
                  }
                >
                  <SelectTrigger
                    id="maintenance-owner"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Optional owner" />
                  </SelectTrigger>
                  <SelectContent className={ADD_ASSET_LIGHT_SURFACE_CLASS}>
                    <SelectItem
                      value="none"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      No owner
                    </SelectItem>
                    {assignableUsers.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                      >
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-reason">Reason *</Label>
              <Textarea
                id="maintenance-reason"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                value={maintenanceForm.reason}
                onChange={(event) =>
                  setMaintenanceForm((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maintenance-estimated-cost">
                  Estimated cost
                </Label>
                <Input
                  id="maintenance-estimated-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={maintenanceForm.estimatedCost}
                  onChange={(event) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      estimatedCost: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance-vendor">Vendor</Label>
                <Input
                  id="maintenance-vendor"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={maintenanceForm.vendor}
                  onChange={(event) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      vendor: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-1 flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMaintenanceFormOpen(false)}
              disabled={isSubmittingMaintenance}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                void submitScheduledMaintenance();
              }}
              disabled={
                isSubmittingMaintenance ||
                !maintenanceForm.assetId ||
                !maintenanceForm.dueDate ||
                !maintenanceForm.reason.trim()
              }
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {isSubmittingMaintenance ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Maintenance Dialog */}
      <Dialog
        open={Boolean(maintenanceActionTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setMaintenanceActionTarget(null);
          }
        }}
      >
        <DialogContent
          className={`max-w-2xl gap-5 rounded-2xl p-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Maintenance
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Complete maintenance
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Complete schedule and create maintenance history.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Completion creates a history record only. It will not change asset
              status, condition, availability, or assignment.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Completion date *</Label>
                <DatePicker
                  mode="single"
                  value={maintenanceCompletionForm.date}
                  onChange={(date) =>
                    setMaintenanceCompletionForm((prev) => ({
                      ...prev,
                      date,
                    }))
                  }
                  placeholder="Select date"
                  size="compact"
                  disabled={isCompletingMaintenance}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance-completion-cost">Cost</Label>
                <Input
                  id="maintenance-completion-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={maintenanceCompletionForm.cost}
                  onChange={(event) =>
                    setMaintenanceCompletionForm((prev) => ({
                      ...prev,
                      cost: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                  disabled={isCompletingMaintenance}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-completion-reason">Reason *</Label>
              <Textarea
                id="maintenance-completion-reason"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                value={maintenanceCompletionForm.reason}
                onChange={(event) =>
                  setMaintenanceCompletionForm((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                rows={3}
                disabled={isCompletingMaintenance}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-completion-related-asset">
                Related Asset
              </Label>
              <Select
                value={maintenanceCompletionForm.replacementAssetId}
                onValueChange={(value) =>
                  setMaintenanceCompletionForm((prev) => ({
                    ...prev,
                    replacementAssetId: value,
                  }))
                }
                disabled={isCompletingMaintenance}
              >
                <SelectTrigger
                  id="maintenance-completion-related-asset"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                >
                  <SelectValue placeholder="Optional related asset" />
                </SelectTrigger>
                <SelectContent className={ADD_ASSET_LIGHT_SURFACE_CLASS}>
                  <SelectItem
                    value="none"
                    className={ADD_ASSET_LIGHT_ITEM_CLASS}
                  >
                    No related asset
                  </SelectItem>
                  {maintenanceRelatedAssetOptions.map((asset) => (
                    <SelectItem
                      key={asset.id}
                      value={String(asset.id)}
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      {asset.name} ({asset.assetTag})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                [
                  "assetStatusBefore",
                  "Status before",
                  MAINTENANCE_ASSET_STATUS_OPTIONS,
                ],
                [
                  "assetStatusAfter",
                  "Status after",
                  MAINTENANCE_ASSET_STATUS_OPTIONS,
                ],
                [
                  "assetConditionBefore",
                  "Condition before",
                  ASSET_CONDITION_OPTIONS,
                ],
                [
                  "assetConditionAfter",
                  "Condition after",
                  ASSET_CONDITION_OPTIONS,
                ],
              ].map(([field, label, options]) => {
                const fieldLabel = String(label);
                const notRecordedLabel = `${fieldLabel}: Not recorded`;

                return (
                  <div key={String(field)} className="space-y-2">
                    <Label>{fieldLabel}</Label>
                    <Select
                      value={
                        maintenanceCompletionForm[
                          field as keyof typeof maintenanceCompletionForm
                        ]
                      }
                      onValueChange={(value) =>
                        setMaintenanceCompletionForm((prev) => ({
                          ...prev,
                          [String(field)]: value,
                        }))
                      }
                      disabled={isCompletingMaintenance}
                    >
                      <SelectTrigger className={ADD_ASSET_LIGHT_FIELD_CLASS}>
                        <SelectValue placeholder={notRecordedLabel} />
                      </SelectTrigger>
                      <SelectContent className={ADD_ASSET_LIGHT_SURFACE_CLASS}>
                        <SelectItem
                          value="none"
                          className={ADD_ASSET_LIGHT_ITEM_CLASS}
                        >
                          {notRecordedLabel}
                        </SelectItem>
                        {(
                          options as Array<{ value: string; label: string }>
                        ).map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className={ADD_ASSET_LIGHT_ITEM_CLASS}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="mt-1 flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMaintenanceActionTarget(null)}
              disabled={isCompletingMaintenance}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                void submitCompleteMaintenance();
              }}
              disabled={
                isCompletingMaintenance ||
                !maintenanceCompletionForm.date ||
                !maintenanceCompletionForm.reason.trim()
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isCompletingMaintenance ? "Completing..." : "Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Maintenance Dialog */}
      <Dialog
        open={Boolean(maintenanceCancelTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setMaintenanceCancelTarget(null);
          }
        }}
      >
        <DialogContent
          className={`w-[calc(100vw-2rem)] max-w-sm max-h-[80vh] gap-5 overflow-y-auto rounded-2xl p-5 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Maintenance
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Cancel maintenance
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Add optional reason for cancelling this maintenance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="maintenance-cancel-reason">Reason</Label>
            <Textarea
              id="maintenance-cancel-reason"
              className={ADD_ASSET_LIGHT_FIELD_CLASS}
              value={maintenanceCancelReason}
              onChange={(event) =>
                setMaintenanceCancelReason(event.target.value)
              }
              rows={2}
              disabled={isCancellingMaintenance}
            />
          </div>

          <DialogFooter className="mt-1 flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMaintenanceCancelTarget(null)}
              disabled={isCancellingMaintenance}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                void submitCancelMaintenance();
              }}
              disabled={isCancellingMaintenance}
            >
              {isCancellingMaintenance ? "Cancelling..." : "Cancel Maintenance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog
        open={isEditAssetDialogOpen}
        onOpenChange={setIsEditAssetDialogOpen}
      >
        <DialogContent
          className={`max-w-2xl gap-5 rounded-2xl p-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {formatAssetDetailValue(editAsset.assetTag)}
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Edit asset
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Update existing asset metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
            {renderFormSection(Tag, "Identification")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-id"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Asset Tag
                </Label>
                <Input
                  id="edit-asset-id"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={editAsset.assetTag}
                  onChange={(e) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      assetTag: e.target.value,
                    }))
                  }
                  placeholder="Asset identifier"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-name"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Asset Name *
                </Label>
                <Input
                  id="edit-asset-name"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={editAsset.name}
                  onChange={(e) =>
                    setEditAsset((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-serial"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Serial Number *
                </Label>
                <Input
                  id="edit-asset-serial"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={editAsset.serialNumber}
                  onChange={(e) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      serialNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-manufacturer"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Manufacturer
                </Label>
                <Input
                  id="edit-asset-manufacturer"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={editAsset.brand}
                  onChange={(e) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }))
                  }
                  placeholder="Enter manufacturer"
                />
              </div>
            </div>

            <div className="h-px bg-gray-100" />
            {renderFormSection(CircleDot, "Status & condition")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-status"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Status
                </Label>
                <Select
                  value={editAsset.status}
                  onValueChange={(value) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      status: value as AssetStatus,
                    }))
                  }
                >
                  <SelectTrigger
                    id="edit-asset-status"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent
                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                    style={FORCED_LIGHT_SURFACE_STYLE}
                  >
                    {ASSET_STATUS_OPTIONS.map((status) => (
                      <SelectItem
                        key={status.value}
                        value={status.value}
                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-category"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Category
                </Label>
                <Select
                  value={editAsset.category}
                  onValueChange={(value) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      category: value as AssetCategory,
                    }))
                  }
                >
                  <SelectTrigger
                    id="edit-asset-category"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent
                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                    style={FORCED_LIGHT_SURFACE_STYLE}
                  >
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className={ADD_ASSET_LIGHT_ITEM_CLASS}
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-condition"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Condition
                </Label>
                <Select
                  value={editAsset.condition}
                  onValueChange={(value) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      condition: value as AssetCondition,
                    }))
                  }
                >
                  <SelectTrigger
                    id="edit-asset-condition"
                    className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent
                    className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                    style={FORCED_LIGHT_SURFACE_STYLE}
                  >
                    <SelectItem
                      value="excellent"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Excellent
                    </SelectItem>
                    <SelectItem
                      value="good"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Good
                    </SelectItem>
                    <SelectItem
                      value="fair"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Fair
                    </SelectItem>
                    <SelectItem
                      value="poor"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Poor
                    </SelectItem>
                    <SelectItem
                      value="damaged"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Damaged
                    </SelectItem>
                    <SelectItem
                      value="unknown"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Unknown
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-gray-100" />
            {renderFormSection(CalendarDays, "Details & purchase")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-model"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Model
                </Label>
                <Input
                  id="edit-asset-model"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={editAsset.model}
                  onChange={(e) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      model: e.target.value,
                    }))
                  }
                  placeholder="Enter model"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-purchase-price"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Purchase Price
                </Label>
                <Input
                  id="edit-asset-purchase-price"
                  type="number"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                  value={editAsset.purchasePrice}
                  onChange={(e) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      purchasePrice: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-purchase-date"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Purchase Date
                </Label>
                <DatePicker
                  mode="single"
                  value={editAsset.purchaseDate}
                  onChange={(date) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      purchaseDate: date,
                    }))
                  }
                  placeholder="Select date"
                  size="compact"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-asset-warranty"
                  className={ADD_ASSET_LIGHT_LABEL_CLASS}
                >
                  Warranty Until
                </Label>
                <DatePicker
                  mode="single"
                  value={editAsset.warranty}
                  onChange={(date) =>
                    setEditAsset((prev) => ({
                      ...prev,
                      warranty: date,
                    }))
                  }
                  placeholder="Select date"
                  size="compact"
                  popoverAlign="end"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-asset-description"
                className={ADD_ASSET_LIGHT_LABEL_CLASS}
              >
                Description
              </Label>
              <Textarea
                id="edit-asset-description"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                value={editAsset.description}
                onChange={(e) =>
                  setEditAsset((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the asset..."
                rows={3}
              />
            </div>

            <div className="h-px bg-gray-100" />
            {renderFormSection(
              List,
              "Specifications",
              "Key/value pairs stored as JSON on the asset."
            )}
            <div className="space-y-2">
              <Label
                htmlFor="edit-asset-specs"
                className={ADD_ASSET_LIGHT_LABEL_CLASS}
              >
                Specifications (JSON)
              </Label>
              <Textarea
                id="edit-asset-specs"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                value={editAsset.specifications}
                onChange={(e) =>
                  setEditAsset((prev) => ({
                    ...prev,
                    specifications: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="mt-1 flex-row items-center sm:justify-end">
            <div className="mr-auto flex items-center gap-1.5 text-xs text-gray-500">
              <AlertCircle className="h-3.5 w-3.5" />
              Fields marked <span className="text-red-600">*</span> are required
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditAssetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                void saveAssetEdit();
              }}
              disabled={
                isActionSubmitting || !editAsset.name || !editAsset.serialNumber
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Asset Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent
          className={`max-w-lg gap-5 rounded-2xl p-6 ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Assignment
            </p>
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-gray-900">
              Assign asset
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Choose an asset and assign it to an employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assign-asset">Asset</Label>
              <Select
                value={assignmentForm.assetId}
                onValueChange={(value) => {
                  setAssignmentForm((prev) => ({ ...prev, assetId: value }));
                  const asset = assets.find(
                    (item) => String(item.id) === value
                  );
                  setSelectedAsset(asset || null);
                }}
                disabled={assignableAssets.length === 0}
              >
                <SelectTrigger
                  id="assign-asset"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                >
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent
                  className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                  style={FORCED_LIGHT_SURFACE_STYLE}
                >
                  {assignableAssets.map((asset) => (
                    <SelectItem
                      key={asset.id}
                      value={String(asset.id)}
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      {asset.name} • {asset.assetTag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignableAssets.length === 0 && (
                <p className="flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  No assets are available to assign. Every asset is already
                  assigned, in maintenance, or otherwise unavailable. Add a new
                  asset or process a return first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-employee">Employee</Label>
              <Select
                value={assignmentForm.employeeId}
                onValueChange={(value) =>
                  setAssignmentForm((prev) => ({ ...prev, employeeId: value }))
                }
                disabled={isLoadingAssignableUsers}
              >
                <SelectTrigger
                  id="assign-employee"
                  className={ADD_ASSET_LIGHT_FIELD_CLASS}
                >
                  <SelectValue
                    placeholder={
                      isLoadingAssignableUsers
                        ? "Loading employees..."
                        : "Select employee"
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  className={ADD_ASSET_LIGHT_SURFACE_CLASS}
                  style={FORCED_LIGHT_SURFACE_STYLE}
                >
                  {assignableUsers.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-notes">Notes</Label>
              <Textarea
                id="assign-notes"
                className={ADD_ASSET_LIGHT_FIELD_CLASS}
                value={assignmentForm.notes}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {assignmentError && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {assignmentError}
              </div>
            )}
          </div>

          <DialogFooter className="mt-1 flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                void submitAssignment();
              }}
              disabled={
                isActionSubmitting ||
                isLoadingAssignableUsers ||
                !assignmentForm.assetId ||
                !assignmentForm.employeeId
              }
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Assign Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteTargetAssetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetAssetId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected asset will be removed
              from inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void confirmDeleteAsset();
              }}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
