import {
  useState,
  useEffect,
  useCallback,
  createElement,
  Fragment,
  useRef,
  type ChangeEvent,
} from "react";
import {
  consumeOpenEmployeeRequest,
  requestOpenProject,
} from "../orgchart/crossModuleNav";
import { DEFAULT_EMPLOYEES_LIST_FILTERS } from "./employeesListHelpers";
import { invalidateOrgChartCache } from "../orgchart/useOrgChartData";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertCircle,
  Search,
  Loader2,
  Eye,
  Edit2,
  Upload,
  Download,
  FileText,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate as _formatDate } from "@/utils";
import { cn as _cn } from "../ui/utils";
import {
  employeeApi,
  EmployeeProfileData,
  type EmployeeExportPayload,
  type EmployeeProfileChangeHistoryItem,
} from "@/lib/api/employees";
import type { Manager } from "@/lib/api/managers";
import {
  employeeCVApi,
  type EmployeeCVVersion,
} from "@/lib/api/modules/employee-cvs";
import { getAccessToken, getStoredUser } from "@/lib/api/tokens";
import { fetchTemplates, type ChecklistTemplate } from "@/lib/api/onboarding";
import {
  getUserPermissions,
  EMPLOYEE_PERMISSIONS,
  hasPermission,
  PERMISSION_REQUIREMENTS,
} from "@/lib/api/permissions";
import { DatePicker } from "../DatePicker";
import {
  EditableInput,
  EditableSelect,
  EditableMultiSelect,
} from "../ui/editable-form";
import { TechnologyTagInput } from "./TechnologyTagInput";
import { TechIcon } from "./tech-icons";
import { technologyTagsApi } from "@/lib/api/modules/technology-tags";
import type { TechnologyTag } from "@/types/technology-tags";
import {
  buildEmployeeUpdatePayload,
  canUploadCvForEmployee,
  cvVersionSupportsEmbeddedPreview as _cvVersionSupportsEmbeddedPreview,
  getEmbeddedPreviewUrl,
  inferCvLinkProvider,
  normalizeExternalCvUrl,
  sortCvVersionsDesc,
  validateCVFile,
  validateExternalCvUrlInput,
} from "./profilesModuleHelpers";
import {
  fetchEmployeeModalOpenPayload,
  fetchLegacyProfilesPageSnapshot,
  fetchProfilesDropdownRefs,
} from "./profilesModuleLoaders";
import { EmployeesListPage } from "./EmployeesListPage";
import type { EmployeesExportContext } from "./EmployeesListPage";
import { ProfilesDetailView } from "./ProfilesDetailView";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { ExportEmployeesDialog } from "./ExportEmployeesDialog";
import {
  Document as PdfDocument,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
  StyleSheet as PdfStyleSheet,
  pdf as renderPdf,
} from "@react-pdf/renderer";

const TRACKED_HISTORY_FIELDS = new Set(["role", "salary", "cpf", "cpf_level"]);

const EMPLOYEE_EXPORT_COLUMN_LABELS: Record<string, string> = {
  first_name: "First name",
  last_name: "Last name",
  email: "Work email",
  phone_number: "Phone",
  role: "Job title",
  department: "Department",
  team: "Team",
  location: "Location",
  employment_status: "Status",
  start_date: "Start date",
  salary: "Salary",
  address: "Home address",
  birth_date: "Date of birth",
  emergency_contact: "Emergency contact",
};

function deriveJobTitlesFromEmployees(employees: EmployeeProfileData[]) {
  return Array.from(
    new Set(
      employees
        .map((employee) => employee.role?.name?.trim() ?? "")
        .filter((title) => title.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function employeeExportValue(employee: EmployeeProfileData, column: string) {
  switch (column) {
    case "role":
      return employee.role?.name ?? "";
    case "team":
      return (
        employee.assigned_projects
          ?.filter(
            (project) => (project.status ?? "").toLowerCase() !== "ended"
          )
          .map((project) => project.project_name)
          .join("; ") ?? ""
      );
    case "location":
      return "";
    case "emergency_contact":
      return [employee.emergency_contact_name, employee.emergency_contact_phone]
        .filter(Boolean)
        .join(" - ");
    default:
      return String(
        (employee as unknown as Record<string, unknown>)[column] ?? ""
      );
  }
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function localEmployeeExportRows(
  rows: EmployeeProfileData[],
  payload: EmployeeExportPayload
) {
  const header = payload.columns.map(
    (column) => EMPLOYEE_EXPORT_COLUMN_LABELS[column] ?? column
  );
  const body = rows.map((employee) =>
    payload.columns.map((column) => employeeExportValue(employee, column))
  );
  return { header, body };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xlsxColumnName(index: number) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

async function buildXlsxEmployeeExport(
  rows: EmployeeProfileData[],
  payload: EmployeeExportPayload
) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const { header, body } = localEmployeeExportRows(rows, payload);
  const tableRows = [...(payload.include_header ? [header] : []), ...body];

  const sheetRows = tableRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const ref = `${xlsxColumnName(columnIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );
  zip.folder("xl")?.file(
    "workbook.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Employees" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
  );
  zip
    .folder("xl")
    ?.folder("_rels")
    ?.file(
      "workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
    );
  zip
    .folder("xl")
    ?.folder("worksheets")
    ?.file(
      "sheet1.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`
    );

  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

const employeeExportPdfStyles = PdfStyleSheet.create({
  page: {
    padding: 28,
    backgroundColor: "#f8fafc",
    color: "#111827",
    fontFamily: "Helvetica",
  },
  eyebrow: {
    color: "#6b7280",
    fontSize: 8,
    letterSpacing: 2.4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 9,
    marginBottom: 18,
  },
  table: {
    borderColor: "#e5e7eb",
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    minHeight: 24,
  },
  headerRow: {
    backgroundColor: "#374151",
  },
  oddRow: {
    backgroundColor: "#ffffff",
  },
  evenRow: {
    backgroundColor: "#f3f4f6",
  },
  cell: {
    borderColor: "#e5e7eb",
    borderRightWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  headerText: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: 700,
  },
  cellText: {
    color: "#1f2937",
    fontSize: 7,
    lineHeight: 1.25,
  },
  footer: {
    bottom: 18,
    color: "#9ca3af",
    fontSize: 8,
    left: 28,
    position: "absolute",
    right: 28,
    textAlign: "right",
  },
});

async function buildPdfEmployeeExport(
  rows: EmployeeProfileData[],
  payload: EmployeeExportPayload
) {
  const { header, body } = localEmployeeExportRows(rows, payload);
  const columnFlex = 1 / Math.max(header.length, 1);
  const rowNodes = body.length > 0 ? body : [payload.columns.map(() => "")];

  const tableHeader = payload.include_header
    ? createElement(
        PdfView,
        {
          fixed: true,
          style: [
            employeeExportPdfStyles.row,
            employeeExportPdfStyles.headerRow,
          ],
        },
        ...header.map((label, index) =>
          createElement(
            PdfView,
            {
              key: `header-${label}-${index}`,
              style: [
                employeeExportPdfStyles.cell,
                ...(index === header.length - 1
                  ? [employeeExportPdfStyles.lastCell]
                  : []),
                { flexBasis: `${columnFlex * 100}%` },
              ],
            },
            createElement(
              PdfText,
              { style: employeeExportPdfStyles.headerText },
              label
            )
          )
        )
      )
    : null;

  const document = createElement(
    PdfDocument,
    null,
    createElement(
      PdfPage,
      {
        size: "A4",
        orientation: "landscape",
        style: employeeExportPdfStyles.page,
      },
      createElement(
        PdfText,
        { style: employeeExportPdfStyles.eyebrow },
        "BloomHub Export"
      ),
      createElement(
        PdfText,
        { style: employeeExportPdfStyles.title },
        "Employees"
      ),
      createElement(
        PdfText,
        { style: employeeExportPdfStyles.subtitle },
        `${rows.length} rows x ${header.length} columns`
      ),
      createElement(
        PdfView,
        { style: employeeExportPdfStyles.table },
        tableHeader,
        ...rowNodes.map((row, rowIndex) =>
          createElement(
            PdfView,
            {
              key: `row-${rowIndex}`,
              wrap: false,
              style: [
                employeeExportPdfStyles.row,
                rowIndex % 2 === 0
                  ? employeeExportPdfStyles.oddRow
                  : employeeExportPdfStyles.evenRow,
              ],
            },
            ...row.map((value, columnIndex) =>
              createElement(
                PdfView,
                {
                  key: `cell-${rowIndex}-${columnIndex}`,
                  style: [
                    employeeExportPdfStyles.cell,
                    ...(columnIndex === row.length - 1
                      ? [employeeExportPdfStyles.lastCell]
                      : []),
                    { flexBasis: `${columnFlex * 100}%` },
                  ],
                },
                createElement(
                  PdfText,
                  { style: employeeExportPdfStyles.cellText },
                  value || "-"
                )
              )
            )
          )
        )
      ),
      createElement(PdfText, {
        fixed: true,
        render: ({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`,
        style: employeeExportPdfStyles.footer,
      })
    )
  );

  return renderPdf(document).toBlob();
}

async function buildLocalEmployeeExport(
  rows: EmployeeProfileData[],
  payload: EmployeeExportPayload
) {
  if (payload.format === "json") {
    const data = rows.map((employee) =>
      Object.fromEntries(
        payload.columns.map((column) => [
          column,
          employeeExportValue(employee, column),
        ])
      )
    );
    return new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    });
  }
  if (payload.format === "xlsx") {
    return buildXlsxEmployeeExport(rows, payload);
  }
  if (payload.format === "pdf") {
    return buildPdfEmployeeExport(rows, payload);
  }

  const { header, body } = localEmployeeExportRows(rows, payload);
  const csv = [...(payload.include_header ? [header] : []), ...body]
    .map((row) => row.map((value) => csvCell(value)).join(","))
    .join("\n");

  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

function shouldUseLocalExportFallback(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("not found") ||
    message.includes("method") ||
    message.includes("not allowed")
  );
}

function _profileHistoryFieldLabel(field: string): string {
  if (field === "cpf" || field === "cpf_level") return "CPF Level";
  if (field === "role") return "Role";
  if (field === "salary") return "Salary";
  return field.replace(/_/g, " ");
}

function _profileHistoryValueText(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "salary") {
    const amount = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(amount)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(amount);
    }
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === "string") return obj.name;
    return JSON.stringify(value);
  }
  return String(value);
}

interface ProfilesModuleProps {
  onNavigate?: (moduleId: string) => void;
}

interface IntroAnnouncementDraft {
  enabled: boolean;
  title: string;
  body: string;
  scheduledDate: string;
  scheduledTime: string;
}

const EMPTY_INTRO_DRAFT: IntroAnnouncementDraft = {
  enabled: false,
  title: "",
  body: "",
  scheduledDate: "",
  scheduledTime: "",
};

function introDraftScheduleToIso(draft: IntroAnnouncementDraft) {
  if (!draft.scheduledDate) return null;
  const date = new Date(
    `${draft.scheduledDate}T${draft.scheduledTime || "09:00"}`
  );
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeIntroError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Failed to save employee";
  const lower = message.toLowerCase();
  if (lower.includes("intro") && lower.includes("already")) {
    return "introduction announcement already exists.";
  }
  if (
    lower.includes("permission") ||
    lower.includes("not allowed") ||
    message.includes("403")
  ) {
    return "Not allowed to schedule introduction announcement.";
  }
  return message;
}

export default function ProfilesModule({
  onNavigate,
}: ProfilesModuleProps = {}) {
  const [employees, setEmployees] = useState<EmployeeProfileData[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [exportEmployeesOpen, setExportEmployeesOpen] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [isExportingEmployees, setIsExportingEmployees] = useState(false);
  const [exportContext, setExportContext] =
    useState<EmployeesExportContext | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [editMode, setEditMode] = useState(false);
  const [editBaseline, setEditBaseline] = useState<EmployeeProfileData | null>(
    null
  );
  const [departments, setDepartments] = useState<string[]>([]);
  const [canEditAll, setCanEditAll] = useState(false);
  const [permissionBits, setPermissionBits] = useState<number | bigint>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [cvVersions, setCvVersions] = useState<EmployeeCVVersion[]>([]);
  const [profileChangeHistory, setProfileChangeHistory] = useState<
    EmployeeProfileChangeHistoryItem[]
  >([]);
  const [isLoadingProfileHistory, setIsLoadingProfileHistory] = useState(false);
  const [profileHistoryError, setProfileHistoryError] = useState<string | null>(
    null
  );
  const [isLoadingCVs, setIsLoadingCVs] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("CV Preview");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cvPendingDelete, setCvPendingDelete] =
    useState<EmployeeCVVersion | null>(null);
  const [isDeletingCV, setIsDeletingCV] = useState(false);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] =
    useState<EmployeeProfileData | null>(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
  const cvFileInputRef = useRef<HTMLInputElement | null>(null);
  const [cvAddMode, setCvAddMode] = useState<"file" | "link">("file");
  const [cvLinkDraft, setCvLinkDraft] = useState("");
  const [isAddingCvLink, setIsAddingCvLink] = useState(false);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [projects, setProjects] = useState<
    { id: number; name: string; leaders?: { id: number; name: string }[] }[]
  >([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [onboardingTemplates, setOnboardingTemplates] = useState<
    ChecklistTemplate[]
  >([]);
  const [_loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [allTechnologyTags, setAllTechnologyTags] = useState<TechnologyTag[]>(
    []
  );
  const [cpfLevels, setCpfLevels] = useState<string[]>([]);
  const [_isLoadingEmployee, setIsLoadingEmployee] = useState(false);
  const [_saveError, setSaveError] = useState<string | null>(null);
  const [_saveSuccess, setSaveSuccess] = useState(false);
  const [introDraft, setIntroDraft] =
    useState<IntroAnnouncementDraft>(EMPTY_INTRO_DRAFT);

  useEffect(() => {
    let stale = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const pageBundle = await employeeApi.loadHrProfilesPageBundle();
        if (stale) return;

        if (pageBundle) {
          const user = getStoredUser();
          if (user && typeof user.id === "number") {
            setCurrentUserId(user.id);
          }

          if (pageBundle.permissionBits !== null) {
            setPermissionBits(pageBundle.permissionBits);
            setCanEditAll(
              PERMISSION_REQUIREMENTS.canUpdateAnyProfile(
                pageBundle.permissionBits
              )
            );
          } else {
            const permBits = await getUserPermissions();
            if (stale) return;
            setPermissionBits(permBits);
            setCanEditAll(
              PERMISSION_REQUIREMENTS.canUpdateAnyProfile(permBits)
            );
          }

          setEmployees(pageBundle.employees);
          setAllTechnologyTags(
            technologyTagsApi.getAllTags(pageBundle.employees)
          );
          setDepartments(pageBundle.departments);
          setJobTitles(
            deriveJobTitlesFromEmployees(pageBundle.employees).length > 0
              ? deriveJobTitlesFromEmployees(pageBundle.employees)
              : pageBundle.roles.map((role) => role.name).filter(Boolean)
          );
          setProjects(pageBundle.projects);
          setManagers(pageBundle.managers);
          setCpfLevels(pageBundle.cpfLevels);
          return;
        }

        setLoadingDropdowns(true);
        try {
          const snap = await fetchLegacyProfilesPageSnapshot();
          if (stale) return;
          setCurrentUserId(snap.currentUserId);
          setPermissionBits(snap.permissionBits);
          setCanEditAll(
            PERMISSION_REQUIREMENTS.canUpdateAnyProfile(snap.permissionBits)
          );
          setEmployees(snap.employees);
          setAllTechnologyTags(snap.allTechnologyTags);
          setDepartments(snap.departments);
          setJobTitles(
            deriveJobTitlesFromEmployees(snap.employees).length > 0
              ? deriveJobTitlesFromEmployees(snap.employees)
              : snap.roles.map((role) => role.name).filter(Boolean)
          );
          setProjects(snap.projects);
          setCpfLevels(snap.cpfLevels);
          setManagers(snap.managers);
        } finally {
          setLoadingDropdowns(false);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load employees"
        );
      } finally {
        if (!stale) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      stale = true;
    };
  }, []);

  // Cross-module request: org chart asked us to open a specific employee.
  // Fires once after employees load.
  const orgChartHandoffConsumedRef = useRef(false);
  useEffect(() => {
    if (orgChartHandoffConsumedRef.current) return;
    if (employees.length === 0) return;
    const id = consumeOpenEmployeeRequest();
    if (id == null) {
      orgChartHandoffConsumedRef.current = true;
      return;
    }
    const match = employees.find((e) => e.id === id);
    orgChartHandoffConsumedRef.current = true;
    if (match) void openEmployeeDialog(match, "view");
    // openEmployeeDialog is stable enough for this one-shot trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees]);

  useEffect(() => {
    if (!addEmployeeOpen) return;

    let stale = false;
    const loadOnboardingTemplates = async () => {
      const token = getAccessToken();
      if (!token) {
        setOnboardingTemplates([]);
        return;
      }
      try {
        const templates = await fetchTemplates(token);
        if (stale) return;
        setOnboardingTemplates(
          templates.filter((template) => template.type === "onboarding")
        );
      } catch {
        if (!stale) setOnboardingTemplates([]);
      }
    };

    void loadOnboardingTemplates();
    return () => {
      stale = true;
    };
  }, [addEmployeeOpen]);

  const refetchDropdownData = useCallback(async () => {
    try {
      setLoadingDropdowns(true);
      const refs = await fetchProfilesDropdownRefs();
      setDepartments(refs.departments);
      setProjects(refs.projects);
      setManagers(refs.managers);
      setJobTitles((current) =>
        current.length > 0
          ? current
          : refs.roles.map((role) => role.name).filter(Boolean)
      );
    } catch {
    } finally {
      setLoadingDropdowns(false);
    }
  }, []);

  const openEmployeeDialog = async (
    employee: EmployeeProfileData,
    mode: "view" | "edit"
  ) => {
    try {
      setIsLoadingEmployee(true);
      setCvVersions([]);
      setIsLoadingCVs(true);
      const result = await fetchEmployeeModalOpenPayload(employee);

      if (result.kind === "bundle") {
        const modalBundle = result.modalBundle;
        setCvVersions(sortCvVersionsDesc(modalBundle.cvVersions));
        setSelectedEmployee(modalBundle.employee);
        setDepartments(modalBundle.departments);
        setProjects(modalBundle.projects);
        setManagers(modalBundle.managers);
        setEditMode(mode === "edit");
        setEditBaseline(mode === "edit" ? modalBundle.employee : null);
        setViewMode("detail");
        return;
      }

      setCvVersions(result.cvVersions);
      setSelectedEmployee(result.employee);
      setEditMode(mode === "edit");
      setEditBaseline(mode === "edit" ? result.employee : null);
      setViewMode("detail");
      await refetchDropdownData();
    } catch (err) {
      console.error("Error fetching employee details:", err);
      setSelectedEmployee(employee);
      setEditMode(mode === "edit");
      setEditBaseline(mode === "edit" ? employee : null);
      setViewMode("detail");
      try {
        setIsLoadingCVs(true);
        const rawCvs = await employeeCVApi.list(employee.id);
        setCvVersions(sortCvVersionsDesc(rawCvs));
      } catch {
        setCvVersions([]);
      }
      await refetchDropdownData();
    } finally {
      setIsLoadingEmployee(false);
      setIsLoadingCVs(false);
    }
  };

  useEffect(() => {
    if (!selectedEmployee) return;

    const canViewHistory =
      selectedEmployee.id === currentUserId ||
      hasPermission(permissionBits, EMPLOYEE_PERMISSIONS.VIEW_AUDIT_LOG) ||
      PERMISSION_REQUIREMENTS.canViewAllProfiles(permissionBits);

    if (!canViewHistory) {
      setProfileChangeHistory([]);
      setProfileHistoryError(null);
      return;
    }

    let stale = false;
    const loadProfileHistory = async () => {
      try {
        setIsLoadingProfileHistory(true);
        setProfileHistoryError(null);
        const history = await employeeApi.getProfileChangeHistory(
          selectedEmployee.id
        );
        if (stale) return;
        setProfileChangeHistory(
          history.filter((entry) => TRACKED_HISTORY_FIELDS.has(entry.field))
        );
      } catch (err) {
        if (stale) return;
        setProfileChangeHistory([]);
        setProfileHistoryError(
          err instanceof Error ? err.message : "Failed to load history"
        );
      } finally {
        if (!stale) setIsLoadingProfileHistory(false);
      }
    };

    void loadProfileHistory();
    return () => {
      stale = true;
    };
  }, [selectedEmployee, permissionBits, currentUserId]);

  const _closeEmployeeDialog = () => {
    setSelectedEmployee(null);
    setEditMode(false);
    setSaveError(null);
    setSaveSuccess(false);
    setCvVersions([]);
    setProfileChangeHistory([]);
    setIsLoadingProfileHistory(false);
    setProfileHistoryError(null);
    setIsLoadingCVs(false);
    setIsUploadingCV(false);
    setIsPreviewOpen(false);
    setPreviewUrl(null);
    setIsLoadingPreview(false);
    setIsDeleteDialogOpen(false);
    setCvPendingDelete(null);
    setIsDeletingCV(false);
    setCvAddMode("file");
    setCvLinkDraft("");
    setIsAddingCvLink(false);
  };

  const fetchCVVersions = useCallback(async (employeeId: number) => {
    try {
      setIsLoadingCVs(true);
      const versions = await employeeCVApi.list(employeeId);
      setCvVersions(sortCvVersionsDesc(versions));
    } catch (err) {
      setCvVersions([]);
      const message =
        err instanceof Error ? err.message : "Failed to fetch CV versions";
      toast.error(message, { position: "bottom-right" });
    } finally {
      setIsLoadingCVs(false);
    }
  }, []);

  const canUploadCV =
    !!selectedEmployee &&
    canUploadCvForEmployee(permissionBits, selectedEmployee.id, currentUserId);

  const handleCVFilePicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedEmployee || !editMode) {
      event.target.value = "";
      return;
    }

    const validationError = validateCVFile(file);
    if (validationError) {
      toast.error(validationError, { position: "bottom-right" });
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingCV(true);
      await employeeCVApi.upload(selectedEmployee.id, file);
      await fetchCVVersions(selectedEmployee.id);
      toast.success("CV uploaded successfully", { position: "bottom-right" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload CV";
      toast.error(message, { position: "bottom-right" });
    } finally {
      setIsUploadingCV(false);
      event.target.value = "";
    }
  };

  const handleAddCvLink = async () => {
    if (!selectedEmployee || !editMode || !canUploadCV) return;

    const msg = validateExternalCvUrlInput(cvLinkDraft);
    if (msg) {
      toast.error(msg, { position: "bottom-right" });
      return;
    }

    const href = normalizeExternalCvUrl(cvLinkDraft);
    if (!href) {
      toast.error("Enter a valid URL", { position: "bottom-right" });
      return;
    }

    try {
      setIsAddingCvLink(true);
      const provider = inferCvLinkProvider(href);
      await employeeCVApi.createLink(selectedEmployee.id, {
        external_url: href,
        provider,
        file_name: provider === "canva" ? "Canva CV" : "External CV link",
      });
      setCvLinkDraft("");
      await fetchCVVersions(selectedEmployee.id);
      toast.success("CV link saved", { position: "bottom-right" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save CV link";
      toast.error(message, { position: "bottom-right" });
    } finally {
      setIsAddingCvLink(false);
    }
  };

  const handleCVAccess = async (cv: EmployeeCVVersion) => {
    if (!selectedEmployee) return;

    try {
      const url = await employeeCVApi.resolveAccessUrl(selectedEmployee.id, cv);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open CV";
      toast.error(message, { position: "bottom-right" });
    }
  };

  const handleCVPreview = async (cv: EmployeeCVVersion) => {
    if (!selectedEmployee) return;

    try {
      setIsLoadingPreview(true);
      setPreviewTitle(cv.file_name || "CV Preview");
      setIsPreviewOpen(true);
      const url = await employeeCVApi.resolveAccessUrl(selectedEmployee.id, cv);
      setPreviewUrl(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to preview CV";
      toast.error(message, { position: "bottom-right" });
      setIsPreviewOpen(false);
      setPreviewUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDeleteCV = (cv: EmployeeCVVersion) => {
    if (!selectedEmployee || !canUploadCV || !editMode) return;
    setCvPendingDelete(cv);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCV = async () => {
    if (!selectedEmployee || !cvPendingDelete) return;

    try {
      setIsDeletingCV(true);
      await employeeCVApi.delete(selectedEmployee.id, cvPendingDelete.id);
      await fetchCVVersions(selectedEmployee.id);
      toast.success("CV version deleted", { position: "bottom-right" });
      setIsDeleteDialogOpen(false);
      setCvPendingDelete(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete CV";
      toast.error(message, { position: "bottom-right" });
    } finally {
      setIsDeletingCV(false);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!deleteConfirmEmployee) return;
    const target = deleteConfirmEmployee;
    try {
      setIsDeletingEmployee(true);
      await employeeApi.deleteEmployee(target.id);
      setEmployees((arr) => arr.filter((e) => e.id !== target.id));
      // Org-chart module reads cached snapshot — bust it so the deleted
      // employee disappears from the chart on next view.
      invalidateOrgChartCache();
      toast.success(`Deleted ${target.first_name} ${target.last_name}`.trim(), {
        position: "bottom-right",
      });
      setDeleteConfirmEmployee(null);
      setSelectedEmployee(null);
      setEditMode(false);
      setEditBaseline(null);
      setViewMode("list");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete employee";
      toast.error(message, { position: "bottom-right" });
    } finally {
      setIsDeletingEmployee(false);
    }
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;
    if (introDraft.enabled && !introDraft.body.trim()) {
      const message = "Add introduction announcement body before saving.";
      setSaveError(message);
      toast.error(message, { position: "bottom-right" });
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const updated = await employeeApi.updateEmployee(selectedEmployee.id, {
        ...buildEmployeeUpdatePayload(selectedEmployee),
        ...(introDraft.enabled
          ? {
              publish_intro_announcement: true,
              intro_announcement_title:
                introDraft.title.trim() ||
                `Welcome ${selectedEmployee.first_name} ${selectedEmployee.last_name}`.trim(),
              intro_announcement_body: introDraft.body.trim(),
              intro_announcement_scheduled_at:
                introDraftScheduleToIso(introDraft),
            }
          : {}),
      });

      setEmployees(
        employees.map((emp) => (emp.id === updated.id ? updated : emp))
      );

      try {
        const data = await employeeApi.listEmployees();
        const employeeResults = data.results || [];
        setEmployees(employeeResults);
        setAllTechnologyTags(technologyTagsApi.getAllTags(employeeResults));
        if (data.results) {
          const updatedEmployee = data.results.find(
            (emp) => emp.id === selectedEmployee.id
          );
          if (updatedEmployee) setSelectedEmployee(updatedEmployee);
        }
      } catch (err) {
        console.error("Error refetching employees:", err);
      }

      toast.success(
        `${selectedEmployee.first_name} ${selectedEmployee.last_name} has been updated successfully`,
        { position: "bottom-right" }
      );

      setEditMode(false);
      setEditBaseline(null);
      setIntroDraft(EMPTY_INTRO_DRAFT);
    } catch (err) {
      const errorMessage = normalizeIntroError(err);
      setSaveError(errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });
      console.error("Error saving employee:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const canAddEmployees =
    PERMISSION_REQUIREMENTS.canManageEmployees(permissionBits) ||
    PERMISSION_REQUIREMENTS.isHR(permissionBits) ||
    canEditAll;
  const canExportEmployees =
    PERMISSION_REQUIREMENTS.canExportData(permissionBits);

  const refreshEmployees = useCallback(async () => {
    const data = await employeeApi.listEmployees();
    const employeeResults = data.results || [];
    setEmployees(employeeResults);
    setAllTechnologyTags(technologyTagsApi.getAllTags(employeeResults));
    return employeeResults;
  }, []);

  const handleCreateEmployee = async (
    payload: Parameters<typeof employeeApi.createEmployee>[0]
  ) => {
    try {
      setIsCreatingEmployee(true);
      const created = await employeeApi.createEmployee(payload);
      const refreshedEmployees = await refreshEmployees().catch(() => {
        const fallbackEmployees = [created, ...employees];
        setEmployees(fallbackEmployees);
        setAllTechnologyTags(technologyTagsApi.getAllTags(fallbackEmployees));
        return fallbackEmployees;
      });
      setAddEmployeeOpen(false);
      toast.success(
        `${created.first_name} ${created.last_name} has been added successfully`,
        { position: "bottom-right" }
      );
      return (
        refreshedEmployees.find((employee) => employee.id === created.id) ??
        created
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add employee";
      toast.error(message, { position: "bottom-right" });
      throw err;
    } finally {
      setIsCreatingEmployee(false);
    }
  };

  const handleCheckEmployeeEmail = async (email: string) => {
    const result = await employeeApi.checkEmailAvailability(email);
    return result.available;
  };

  const handleOpenExport = (context: EmployeesExportContext) => {
    setExportContext(context);
    setExportEmployeesOpen(true);
  };

  const handleExportEmployees = async (payload: EmployeeExportPayload) => {
    try {
      setIsExportingEmployees(true);
      let blob: Blob;
      let filename: string;

      try {
        const result = await employeeApi.exportEmployees(payload);
        blob = result.blob;
        filename = result.filename;
      } catch (err) {
        if (!shouldUseLocalExportFallback(err)) throw err;

        const rows =
          payload.scope === "filtered"
            ? (exportContext?.filteredEmployees ?? employees)
            : employees;
        blob = await buildLocalEmployeeExport(rows, payload);
        filename = payload.filename || `bloomhub-employees.${payload.format}`;
        toast.info(
          "Backend export is unavailable, so a local export was generated.",
          {
            position: "bottom-right",
          }
        );
      }

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      setExportEmployeesOpen(false);
      toast.success("Employee export is ready", { position: "bottom-right" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export employees";
      toast.error(message, { position: "bottom-right" });
      throw err;
    } finally {
      setIsExportingEmployees(false);
    }
  };

  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col bg-[#f7f7f6]">
      {error ? (
        <div className="m-4 flex gap-3 rounded-md border border-red-200 bg-red-50 p-4">
          <AlertCircle
            className="h-5 w-5 text-red-600 mt-0.5 shrink-0"
            aria-hidden
          />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      {viewMode === "detail" && selectedEmployee ? (
        <ProfilesDetailView
          profile={selectedEmployee}
          cpfLevels={cpfLevels}
          allTechnologyTags={allTechnologyTags}
          canEditAll={canEditAll}
          currentUserId={currentUserId}
          editMode={editMode}
          dirty={
            editMode &&
            editBaseline !== null &&
            (JSON.stringify(selectedEmployee) !==
              JSON.stringify(editBaseline) ||
              introDraft.enabled)
          }
          isSaving={isSaving}
          onEmployeeChange={setSelectedEmployee}
          cvVersions={cvVersions}
          isLoadingCVs={isLoadingCVs}
          canUploadCV={canUploadCV}
          cvAddMode={cvAddMode}
          onCvAddModeChange={setCvAddMode}
          cvFileInputRef={cvFileInputRef}
          isUploadingCV={isUploadingCV}
          onCvFilePicked={handleCVFilePicked}
          cvLinkDraft={cvLinkDraft}
          onCvLinkDraftChange={setCvLinkDraft}
          isAddingCvLink={isAddingCvLink}
          onAddCvLink={handleAddCvLink}
          onCVAccess={handleCVAccess}
          onCVPreview={handleCVPreview}
          onDeleteCV={handleDeleteCV}
          isLoadingProfileHistory={isLoadingProfileHistory}
          profileHistoryError={profileHistoryError}
          profileHistory={profileChangeHistory}
          onBack={() => {
            setViewMode("list");
            setSelectedEmployee(null);
            setEditMode(false);
            setEditBaseline(null);
            setIntroDraft(EMPTY_INTRO_DRAFT);
          }}
          onEnterEdit={() => {
            setEditMode(true);
            setEditBaseline(selectedEmployee);
            setIntroDraft(EMPTY_INTRO_DRAFT);
          }}
          onCancelEdit={() => {
            if (editBaseline) setSelectedEmployee(editBaseline);
            setEditMode(false);
            setEditBaseline(null);
            setIntroDraft(EMPTY_INTRO_DRAFT);
          }}
          onSave={handleSaveEmployee}
          introDraft={introDraft}
          onIntroDraftChange={setIntroDraft}
          canDelete={canEditAll}
          onExport={() => {
            handleOpenExport({
              filteredEmployees: [selectedEmployee],
              search: "",
              filters: DEFAULT_EMPLOYEES_LIST_FILTERS,
              activeFilterCount: 0,
            });
          }}
          onDelete={() => setDeleteConfirmEmployee(selectedEmployee)}
          onOpenProject={(projectId) => {
            requestOpenProject(projectId);
            onNavigate?.("projects");
          }}
        />
      ) : (
        <EmployeesListPage
          employees={employees}
          isLoading={isLoading}
          canEditAll={canEditAll}
          canAdd={canAddEmployees}
          canExport={canExportEmployees}
          onOpenEmployee={openEmployeeDialog}
          onAdd={() => setAddEmployeeOpen(true)}
          onExport={handleOpenExport}
        />
      )}
      <AddEmployeeDialog
        open={addEmployeeOpen}
        onOpenChange={setAddEmployeeOpen}
        departments={departments}
        projects={projects}
        managers={managers}
        existingEmails={employees.map((employee) => employee.email)}
        onboardingTemplates={onboardingTemplates}
        isSaving={isCreatingEmployee}
        onCheckEmail={handleCheckEmployeeEmail}
        onSubmit={handleCreateEmployee}
        jobTitles={jobTitles}
      />
      <ExportEmployeesDialog
        open={exportEmployeesOpen}
        onOpenChange={setExportEmployeesOpen}
        employees={employees}
        filteredEmployees={exportContext?.filteredEmployees ?? employees}
        search={exportContext?.search ?? ""}
        filters={
          exportContext?.filters ?? {
            department: "all",
            status: "all",
            sort: "name_asc",
          }
        }
        activeFilterCount={exportContext?.activeFilterCount ?? 0}
        isExporting={isExportingEmployees}
        onExport={handleExportEmployees}
      />
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl h-[88vh] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col rounded-2xl">
          <DialogTitle className="px-6 pt-5 pb-3 text-base font-semibold text-zinc-900 border-b border-zinc-200 bg-white flex items-center justify-between">
            <span className="truncate">{previewTitle}</span>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full ml-4 shrink-0">
              CV Preview
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Inline preview for selected CV version.
          </DialogDescription>
          <div className="flex-1 bg-linear-to-b from-zinc-100 to-zinc-200 p-4">
            {isLoadingPreview ? (
              <div className="h-full w-full flex items-center justify-center gap-2 text-zinc-600 bg-white/70 rounded-xl border border-zinc-200">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading document preview...
              </div>
            ) : previewUrl ? (
              <div className="h-full w-full rounded-xl overflow-hidden border border-zinc-300 shadow-sm bg-white">
                <iframe
                  src={getEmbeddedPreviewUrl(previewUrl, previewTitle)}
                  title={previewTitle}
                  className="h-full w-full border-0"
                />
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500 bg-white/70 rounded-xl border border-zinc-200">
                Unable to load preview.
              </div>
            )}
          </div>
          {previewUrl ? (
            <div className="px-6 py-3 border-t border-zinc-200 bg-white flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Tip: Some browsers may ignore PDF pane preferences.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  window.open(previewUrl, "_blank", "noopener,noreferrer")
                }
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setCvPendingDelete(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md border-zinc-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-zinc-900">
              Delete CV version?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-600">
              {`This will permanently delete "${cvPendingDelete?.file_name || "this CV version"}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isDeletingCV} type="button">
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDeleteCV}
              disabled={isDeletingCV}
            >
              {isDeletingCV ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deleteConfirmEmployee}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmEmployee(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md border-zinc-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-zinc-900">
              Delete employee?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-600">
              {deleteConfirmEmployee
                ? `This will permanently delete ${deleteConfirmEmployee.first_name} ${deleteConfirmEmployee.last_name} and all linked data (assignments, CVs, history). This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isDeletingEmployee} type="button">
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDeleteEmployee}
              disabled={isDeletingEmployee}
            >
              {isDeletingEmployee ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete employee"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
