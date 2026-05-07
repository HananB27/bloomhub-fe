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
  Building,
  UserCheck,
  Package2,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/utils";
import { ApiError } from "@/utils/api";
import {
  approveAssetReturn,
  assignAssetToEmployee,
  createAsset,
  deleteAssetById,
  exportAssetsCsv,
  getAssetCapabilities,
  listAssets,
  listAssignments,
  listAssignableUsers,
  listPendingReturnRequests,
  listReplacementLogs,
  rejectAssetReturn,
  requestAssetReturn,
  updateAsset,
  type AssetApiItem,
  type AssetAssignmentApiItem,
  type AssetCapabilities,
  type AssetItemCapabilities,
  type PendingReturnRequestApiItem,
  type AssetReplacementLogApiItem,
} from "@/lib/api/assets";
import type { LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react";

type AssetStatus =
  | "active"
  | "available"
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
    "available",
    "lost",
    "damaged",
    "maintenance",
    "retired",
  ];

  if (!value) return "available";

  const normalized = value.trim().toLowerCase();
  return allowed.includes(normalized as AssetStatus)
    ? (normalized as AssetStatus)
    : "available";
}

function toApiAssetStatus(
  value: AssetStatus
): "active" | "lost" | "returned" | "damaged" {
  if (value === "lost" || value === "returned" || value === "damaged") {
    return value;
  }

  return "active";
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

function toPersonName(value?: {
  full_name?: string | null;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
  };
}): string {
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

function toKnownPersonName(value?: Parameters<typeof toPersonName>[0]): string {
  const name = toPersonName(value);
  return name === "Unknown" ? "" : name;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
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
    warranty: item.warranty || "",
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

  return assets.map((asset) => {
    const activeAssignment = activeAssignmentsByAssetId.get(asset.id);

    if (!activeAssignment) {
      return asset;
    }

    return {
      ...asset,
      assignedTo: asset.assignedTo || activeAssignment.employeeId,
      assignedEmployeeName:
        asset.assignedEmployeeName || activeAssignment.employeeName,
      assignedDate: asset.assignedDate || activeAssignment.assignedDate,
    };
  });
}

function mapPendingReturnRequestFromApi(
  item: PendingReturnRequestApiItem
): PendingReturnRequest {
  const assignmentId =
    item.assignment_id || item.assignment || item.assignment_details?.id || 0;
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

  return !["lost", "damaged", "maintenance", "retired"].includes(asset.status);
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
    status: "available" as AssetStatus,
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
  const [isLoadingReplacementLogs, setIsLoadingReplacementLogs] =
    useState(false);

  const [assets, setAssets] = useState<Asset[]>([]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingReturnRequests, setPendingReturnRequests] = useState<
    PendingReturnRequest[]
  >([]);
  const [assetCapabilities, setAssetCapabilities] =
    useState<AssetCapabilities | null>(null);
  const isAssetsMountedRef = useRef(true);

  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
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
      setIsLoadingAssets(false);
      return;
    }

    try {
      const [assetsPayload, assignmentsPayload, pendingReturnsPayload] =
        await Promise.all([
          listAssets(accessToken),
          listAssignments(accessToken).catch(() => []),
          loadedCapabilities.can_process_return
            ? listPendingReturnRequests(accessToken).catch(() => [])
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

  const filteredAssets = assets.filter((asset) => {
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

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    categoryFilter !== "all" ||
    statusFilter !== "all";

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
      case "available":
        return "bg-blue-100 text-blue-800";
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
      case "available":
        return Package;
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

  const selectedAssetAssigneeName = (() => {
    if (!selectedAsset) {
      return "Unassigned";
    }

    const fromAsset = selectedAsset.assignedEmployeeName?.trim();
    if (fromAsset) {
      return fromAsset;
    }

    const fromAssignment = getActiveAssignmentForAsset(
      selectedAsset.id
    )?.employeeName?.trim();
    return fromAssignment || "Unassigned";
  })();

  const canApproveReturnForAsset = (asset: Asset): boolean =>
    getAssetCapability(asset, "can_process_return") ?? canProcessReturn;

  const canRequestReturnForAsset = (asset: Asset): boolean =>
    getAssetCapability(asset, "can_request_return") ?? false;

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
          condition: "good",
          status: "active",
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

    if (
      !(getAssetCapability(asset, "can_view_history") ?? canViewAssetHistory)
    ) {
      return;
    }

    setIsLoadingReplacementLogs(true);
    try {
      const logs = await listReplacementLogs(asset.id, accessToken);
      setReplacementLogs(logs);
    } catch (error: unknown) {
      setApiError(getErrorMessage(error, "Failed to load replacement logs."));
    } finally {
      setIsLoadingReplacementLogs(false);
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

      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === selectedAsset.id ? mapAssetFromApi(updated) : asset
        )
      );
      setSelectedAsset(mapAssetFromApi(updated));
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

      setAssignments((prev) => [mapped, ...prev]);
      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === targetAsset.id
            ? {
                ...asset,
                status: "active",
                assignedTo: assignmentForm.employeeId,
                assignedEmployeeName,
                assignedDate:
                  mapped.assignedDate || new Date().toISOString().split("T")[0],
              }
            : asset
        )
      );
      setIsAssignDialogOpen(false);
      setApiError(null);
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

    if (statusFilter === "available") {
      filters.available = true;
    } else if (
      statusFilter === "active" ||
      statusFilter === "lost" ||
      statusFilter === "damaged"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Asset Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage company assets, assignments, and maintenance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-expanded={isFilterPanelOpen}
              aria-controls="asset-filter-controls"
              onClick={() => {
                const isAssetsTabActive = activeTab === "assets";
                setActiveTab("assets");
                setIsFilterPanelOpen((prev) =>
                  isAssetsTabActive ? !prev : true
                );
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {hasActiveFilters && (
                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-blue-500" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void handleExportAssets();
              }}
              disabled={!canExportInventory || isExportingAssets}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExportingAssets ? "Exporting..." : "Export"}
            </Button>
            <Button variant="outline" size="sm" disabled={!canGenerateQr}>
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
            {canCreateAssets && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddAssetDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Assets
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {assets.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All categories
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {assets.filter((asset) => asset.status === "active").length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Currently assigned
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Issues</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {
                assets.filter(
                  (asset) =>
                    asset.status === "lost" || asset.status === "damaged"
                ).length
              }
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Lost or damaged
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Value
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(
                assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Asset portfolio
            </p>
          </div>
        </div>

        {apiError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </div>
        )}
      </div>

      {!canViewAnyAssets ? (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="py-8 text-center text-gray-600 dark:text-gray-300">
            You do not have permission to view asset inventory.
          </CardContent>
        </Card>
      ) : isLoadingAssets ? (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="py-8 text-center text-gray-600 dark:text-gray-300">
            Loading asset inventory...
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-gray-200 dark:border-gray-700">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <CardHeader className="pb-3">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="assets">Asset Inventory</TabsTrigger>
                    <TabsTrigger value="assignments">
                      Assignment History
                    </TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  <TabsContent value="assets" className="space-y-6 mt-0">
                    {/* Search and Filters */}
                    {isFilterPanelOpen && (
                      <div
                        id="asset-filter-controls"
                        className="flex flex-col md:flex-row gap-4"
                      >
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -trangray-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            placeholder="Search assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="w-full md:w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="maintenance">
                              Maintenance
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="md:self-center"
                          onClick={() => {
                            setSearchTerm("");
                            setCategoryFilter("all");
                            setStatusFilter("all");
                          }}
                          disabled={!hasActiveFilters}
                        >
                          Clear
                        </Button>
                      </div>
                    )}

                    {/* Asset Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAssets.map((asset) => {
                        const StatusIcon = getStatusIcon(asset.status);
                        const CategoryIcon = getCategoryIcon(asset.category);
                        const activeAssignment = getActiveAssignmentForAsset(
                          asset.id
                        );
                        const returnStatus =
                          activeAssignment?.returnRequestStatus;

                        return (
                          <Card
                            key={asset.id}
                            className="border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
                          >
                            <CardContent className="p-4">
                              <div className="relative mb-3">
                                <ImageWithFallback
                                  src={asset.image}
                                  alt={asset.name}
                                  className="w-full h-32 object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(asset.status)}
                                  >
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {asset.status}
                                  </Badge>
                                </div>
                                <div className="absolute bottom-2 left-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-white dark:bg-gray-800/90 text-gray-700 dark:text-gray-300"
                                  >
                                    {asset.assetTag}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <CategoryIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {asset.name}
                                    </h3>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {asset.brand} {asset.model}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Hash className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Serial:
                                    </span>
                                    <span className="font-mono text-gray-900 dark:text-gray-100 text-xs">
                                      {asset.serialNumber}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <Badge
                                      variant="outline"
                                      className={getConditionColor(
                                        asset.condition
                                      )}
                                    >
                                      {asset.condition}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {formatCurrency(asset.purchasePrice)}
                                    </span>
                                  </div>

                                  <div className="flex min-w-0 items-center gap-2 text-sm">
                                    <User className="w-3 h-3 shrink-0 text-gray-400 dark:text-gray-500" />
                                    <span className="shrink-0 text-gray-600 dark:text-gray-400">
                                      Assigned to:
                                    </span>
                                    <span
                                      className={`min-w-0 truncate ${asset.assignedTo ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
                                    >
                                      {asset.assignedEmployeeName || "--"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Location:
                                    </span>
                                    <span className="text-gray-900 dark:text-gray-100 truncate">
                                      {asset.location}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                      void openAssetDetails(asset);
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  {asset.status === "active" &&
                                    (isAssetCurrentlyAssigned(asset) ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                          !canProcessReturnForAsset(asset) ||
                                          returnStatus === "pending"
                                        }
                                        onClick={() => {
                                          openReturnDialogForAsset(asset);
                                        }}
                                      >
                                        {canApproveReturnForAsset(asset)
                                          ? "Approve Return"
                                          : "Request Return"}
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                          !isAssetAssignable(asset) ||
                                          !(
                                            getAssetCapability(
                                              asset,
                                              "can_assign"
                                            ) ?? canAssignAssets
                                          )
                                        }
                                        onClick={() => {
                                          void openAssignDialog(asset);
                                        }}
                                      >
                                        Assign Asset
                                      </Button>
                                    ))}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
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
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit Details
                                      </DropdownMenuItem>
                                      {isAssetAssignable(asset) && (
                                        <DropdownMenuItem
                                          disabled={
                                            !(
                                              getAssetCapability(
                                                asset,
                                                "can_assign"
                                              ) ?? canAssignAssets
                                            )
                                          }
                                          onClick={() => {
                                            void openAssignDialog(asset);
                                          }}
                                        >
                                          <UserCheck className="w-4 h-4 mr-2" />
                                          Assign Asset
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem>
                                        <Wrench className="w-4 h-4 mr-2" />
                                        Schedule Maintenance
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Generate QR Code
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {(getAssetCapability(
                                        asset,
                                        "can_delete"
                                      ) ??
                                        canDeleteAssets) && (
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => {
                                            setDeleteTargetAssetId(asset.id);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete Asset
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {returnStatus === "pending" && (
                                  <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 shadow-sm dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>Pending HR Review</span>
                                  </div>
                                )}
                                {returnStatus === "rejected" &&
                                  activeAssignment?.returnRejectionReason && (
                                    <p className="text-xs text-red-700 dark:text-red-300">
                                      Rejected:{" "}
                                      {activeAssignment.returnRejectionReason}
                                    </p>
                                  )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {filteredAssets.length === 0 && (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No assets found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Try adjusting your search criteria or add a new asset.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="assignments" className="space-y-6 mt-0">
                    {canProcessReturn && (
                      <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          Pending Returns
                        </h3>
                        {pendingReturnRequests.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            No pending return requests.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {pendingReturnRequests.map((request) => (
                              <div
                                key={request.id}
                                className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2"
                              >
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  <span className="font-medium">
                                    {request.employeeName}
                                  </span>{" "}
                                  requested return for {request.assetName}
                                  {request.assetTag
                                    ? ` (${request.assetTag})`
                                    : ""}
                                  {request.requestedAt
                                    ? ` on ${formatDate(request.requestedAt)}`
                                    : ""}
                                </div>
                                {request.notes && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {request.notes}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedReturnRequest(request);
                                      setReturnRejectionReason("");
                                      setIsReturnRequestDetailsOpen(true);
                                    }}
                                  >
                                    View details
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      void approvePendingReturn(
                                        request.assignmentId
                                      );
                                    }}
                                  >
                                    Approve return
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedReturnRequest(request);
                                      setReturnRejectionReason("");
                                      setIsReturnRequestDetailsOpen(true);
                                    }}
                                  >
                                    Reject return
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            Assignment History
                          </h3>
                          {hasActiveAssignmentFilters && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAssignmentAssetFilter("");
                                setAssignmentEmployeeFilter("");
                                setAssignmentStatusFilter("all");
                              }}
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label
                              htmlFor="assignment-asset-filter"
                              className="text-xs text-gray-600 dark:text-gray-400"
                            >
                              Asset
                            </Label>
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
                            <Label
                              htmlFor="assignment-employee-filter"
                              className="text-xs text-gray-600 dark:text-gray-400"
                            >
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
                            <Label
                              htmlFor="assignment-status-filter"
                              className="text-xs text-gray-600 dark:text-gray-400"
                            >
                              Status
                            </Label>
                            <Select
                              value={assignmentStatusFilter}
                              onValueChange={setAssignmentStatusFilter}
                            >
                              <SelectTrigger id="assignment-status-filter">
                                <SelectValue placeholder="Filter by status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All statuses
                                </SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="returned">
                                  Returned
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-900">
                              <TableHead>Asset</TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead>Assigned Date</TableHead>
                              <TableHead>Returned Date</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Condition</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAssignments.map((assignment) => {
                              const asset = assets.find(
                                (a) => a.id === assignment.assetId
                              );
                              const fallbackAssetName =
                                getAssignmentAssetName(assignment);
                              const fallbackAssetTag =
                                getAssignmentAssetTag(assignment);
                              const duration = assignment.returnedDate
                                ? Math.ceil(
                                    (new Date(
                                      assignment.returnedDate
                                    ).getTime() -
                                      new Date(
                                        assignment.assignedDate
                                      ).getTime()) /
                                      (1000 * 3600 * 24)
                                  )
                                : Math.ceil(
                                    (new Date().getTime() -
                                      new Date(
                                        assignment.assignedDate
                                      ).getTime()) /
                                      (1000 * 3600 * 24)
                                  );

                              return (
                                <TableRow
                                  key={assignment.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Package className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                          {asset?.name || fallbackAssetName}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          {asset?.assetTag || fallbackAssetTag}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs">
                                          {assignment.employeeName
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-gray-900 dark:text-gray-100">
                                        {assignment.employeeName}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {formatDate(assignment.assignedDate)}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {assignment.returnedDate ? (
                                      <span className="text-gray-900 dark:text-gray-100">
                                        {formatDate(assignment.returnedDate)}
                                      </span>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700"
                                      >
                                        Current
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {duration} days
                                    </span>
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
                                    <Badge
                                      variant="outline"
                                      className={
                                        assignment.isActive
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                      }
                                    >
                                      {assignment.isActive
                                        ? "Active"
                                        : "Returned"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label={`Assignment actions for ${assignment.employeeName}`}
                                        >
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className={
                                          ADD_ASSET_LIGHT_SURFACE_CLASS
                                        }
                                        style={FORCED_LIGHT_SURFACE_STYLE}
                                      >
                                        <DropdownMenuItem
                                          className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                          onClick={() => {
                                            setSelectedAssignment(assignment);
                                            setIsAssignmentDetailsDialogOpen(
                                              true
                                            );
                                          }}
                                        >
                                          <Eye className="w-4 h-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className={ADD_ASSET_LIGHT_ITEM_CLASS}
                                          onClick={() => {
                                            setSelectedAssignment(assignment);
                                            setIsAssignmentFormDialogOpen(true);
                                          }}
                                        >
                                          <FileText className="w-4 h-4 mr-2" />
                                          Assignment Form
                                        </DropdownMenuItem>
                                        {assignment.isActive && (
                                          <DropdownMenuItem
                                            className={
                                              ADD_ASSET_LIGHT_ITEM_CLASS
                                            }
                                            disabled={
                                              !asset ||
                                              !canProcessReturnForAsset(asset)
                                            }
                                            onClick={() => {
                                              if (asset) {
                                                openReturnDialogForAsset(asset);
                                              }
                                            }}
                                          >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Unassign Asset
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

                      {assignments.length === 0 ? (
                        <div className="text-center py-8">
                          <History className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No assignment history
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Assignment records will appear here as assets are
                            assigned to employees.
                          </p>
                        </div>
                      ) : (
                        filteredAssignments.length === 0 && (
                          <div className="text-center py-8">
                            <Search className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                              No matching assignments
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              Try changing the asset, employee, or status
                              filters.
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="maintenance" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Maintenance Schedule
                      </h3>

                      <div className="space-y-3">
                        {assets
                          .filter((asset) => asset.nextMaintenance)
                          .map((asset) => (
                            <Card
                              key={asset.id}
                              className="border-gray-200 dark:border-gray-700"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <Wrench className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                        {asset.name}
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {asset.assetTag} • {asset.brand}{" "}
                                        {asset.model}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      Next:{" "}
                                      {asset.nextMaintenance
                                        ? formatDate(asset.nextMaintenance)
                                        : "Not scheduled"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Last:{" "}
                                      {asset.lastMaintenance
                                        ? formatDate(asset.lastMaintenance)
                                        : "Never"}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>

                      {assets.filter((asset) => asset.nextMaintenance)
                        .length === 0 && (
                        <div className="text-center py-8">
                          <Wrench className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No maintenance scheduled
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Maintenance schedules will appear here when assets
                            require service.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickActionButton
                  label="Add Asset"
                  icon={Plus}
                  onClick={() => setIsAddAssetDialogOpen(true)}
                  variant="primary"
                  disabled={!canCreateAssets}
                />
                <QuickActionButton
                  label="Scan QR Code"
                  icon={QrCode}
                  onClick={() => {}}
                  disabled={!canGenerateQr}
                />
                <QuickActionButton
                  label="Assign Asset"
                  icon={UserCheck}
                  onClick={() => {
                    void openAssignDialog();
                  }}
                  disabled={!canAssignAssets || assignableAssets.length === 0}
                />
                <QuickActionButton
                  label="Schedule Maintenance"
                  icon={Wrench}
                  onClick={() => {}}
                />
                {canConfigureAssetTypes && (
                  <>
                    <QuickActionButton
                      label="Generate Report"
                      icon={FileText}
                      onClick={() => {}}
                    />
                    <QuickActionButton
                      label="Asset Settings"
                      icon={Settings}
                      onClick={() => {}}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category) => {
                  const count = assets.filter(
                    (asset) => asset.category === category.value
                  ).length;
                  const Icon = category.icon;
                  return (
                    <div
                      key={category.value}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {category.label}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Asset Issues
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {
                        assets.filter(
                          (asset) =>
                            asset.status === "lost" ||
                            asset.status === "damaged"
                        ).length
                      }{" "}
                      assets need attention
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Review Issues
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        Asset assigned
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        New asset added
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        5 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        Asset returned
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        1 day ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
          className={`max-w-3xl max-h-[90vh] overflow-y-auto ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900">
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
          className={`max-w-3xl max-h-[90vh] overflow-y-auto ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900">Assignment Form</DialogTitle>
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
          className={`max-w-2xl max-h-[90vh] overflow-y-auto ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Return Asset - {selectedAsset?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Complete the return checklist to process the asset return for{" "}
              {selectedAsset?.assignedEmployeeName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Asset Info */}
            {selectedAsset && (
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={selectedAsset.image}
                    alt={selectedAsset.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedAsset.name}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {selectedAsset.assetTag} • {selectedAsset.serialNumber}
                    </p>
                    <p className="text-sm text-gray-700">
                      Assigned to {selectedAsset.assignedEmployeeName}
                    </p>
                  </div>
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

            <div className="flex gap-3">
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
              <Button
                variant="outline"
                onClick={() => setIsReturnDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Asset Dialog */}
      <Dialog
        open={isAddAssetDialogOpen}
        onOpenChange={setIsAddAssetDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-gray-900 dark:bg-white dark:text-gray-900">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Register a new asset in the system with complete details and
              specifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
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
                  <SelectTrigger className={ADD_ASSET_LIGHT_FIELD_CLASS}>
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
              </div>
            </div>

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

            <div className="flex gap-3">
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
              <Button
                variant="outline"
                onClick={() => setIsAddAssetDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
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
          className={`max-w-2xl max-h-[90vh] overflow-y-auto ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900">
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
          className={`max-w-3xl ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <DialogTitle className="text-black">
              {selectedAsset?.name || "Asset Details"}
            </DialogTitle>
            <DialogDescription className="text-black">
              View asset metadata, assignment status, and replacement history.
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Asset Tag</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAsset.assetTag}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Serial Number</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAsset.serialNumber}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Status</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAsset.status}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Condition</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAsset.condition}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Assigned To</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAssetAssigneeName}
                  </p>
                </div>
                <div>
                  <p className={ASSET_DETAILS_LABEL_CLASS}>Location</p>
                  <p className={ASSET_DETAILS_VALUE_CLASS}>
                    {selectedAsset.location}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <p className="font-medium mb-2 text-black">Replacement Logs</p>
                {isLoadingReplacementLogs ? (
                  <p className="text-sm text-black">
                    Loading replacement logs...
                  </p>
                ) : replacementLogs.length === 0 ? (
                  <p className="text-sm text-black">
                    No replacement logs available.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {replacementLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded border border-gray-100 p-2 text-sm"
                      >
                        <p className="font-medium text-black">
                          {log.reason || "Replacement record"}
                        </p>
                        <p className="text-black">
                          {log.date || log.created_at
                            ? formatDate(log.date || log.created_at || "")
                            : "Unknown date"}
                        </p>
                        {log.notes && <p className="text-black">{log.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog
        open={isEditAssetDialogOpen}
        onOpenChange={setIsEditAssetDialogOpen}
      >
        <DialogContent
          className={`max-w-2xl ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Asset</DialogTitle>
            <DialogDescription className="text-gray-700">
              Update existing asset metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

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
                    <SelectItem
                      value="available"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Available
                    </SelectItem>
                    <SelectItem
                      value="active"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Active
                    </SelectItem>
                    <SelectItem
                      value="maintenance"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Maintenance
                    </SelectItem>
                    <SelectItem
                      value="damaged"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Damaged
                    </SelectItem>
                    <SelectItem
                      value="lost"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Lost
                    </SelectItem>
                    <SelectItem
                      value="retired"
                      className={ADD_ASSET_LIGHT_ITEM_CLASS}
                    >
                      Retired
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  void saveAssetEdit();
                }}
                disabled={
                  isActionSubmitting ||
                  !editAsset.name ||
                  !editAsset.serialNumber
                }
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditAssetDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Asset Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent
          className={`max-w-lg ${ADD_ASSET_LIGHT_SURFACE_CLASS}`}
          style={FORCED_LIGHT_SURFACE_STYLE}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900">Assign Asset</DialogTitle>
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

            <div className="flex gap-3">
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
                Assign Asset
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
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
