import {
  useState,
  useEffect,
  useCallback,
  Fragment,
  useRef,
  type ChangeEvent,
} from "react";
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
import { formatDate } from "@/utils";
import { cn } from "../ui/utils";
import {
  employeeApi,
  EmployeeProfileData,
  type EmployeeProfileChangeHistoryItem,
} from "@/lib/api/employees";
import { cpfLevelsApi } from "@/lib/api/cpf-levels";
import type { Manager } from "@/lib/api/managers";
import {
  employeeCVApi,
  type EmployeeCVVersion,
} from "@/lib/api/modules/employee-cvs";
import { getStoredUser } from "@/lib/api/tokens";
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
  cvVersionSupportsEmbeddedPreview,
  employeeDisplayInitials,
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

const TRACKED_HISTORY_FIELDS = new Set(["role", "salary", "cpf", "cpf_level"]);

function profileHistoryFieldLabel(field: string): string {
  if (field === "cpf" || field === "cpf_level") return "CPF Level";
  if (field === "role") return "Role";
  if (field === "salary") return "Salary";
  return field.replace(/_/g, " ");
}

function profileHistoryValueText(field: string, value: unknown): string {
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

export default function ProfilesModule({
  onNavigate,
}: ProfilesModuleProps = {}) {
  const [employees, setEmployees] = useState<EmployeeProfileData[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeProfileData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [canEditAll, setCanEditAll] = useState(false);
  const [permissionBits, setPermissionBits] = useState<number | bigint>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [_saveSuccess, setSaveSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
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
  const cvFileInputRef = useRef<HTMLInputElement | null>(null);
  const [cvAddMode, setCvAddMode] = useState<"file" | "link">("file");
  const [cvLinkDraft, setCvLinkDraft] = useState("");
  const [isAddingCvLink, setIsAddingCvLink] = useState(false);
  /** After modal bundle supplies CPF levels, skip one redundant cpf-by-role fetch. */
  const skipInitialCpfFetchAfterModalBundleRef = useRef(false);

  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<
    { id: number; name: string; leaders?: { id: number; name: string }[] }[]
  >([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [cpfLevels, setCpfLevels] = useState<string[]>([]);
  const [_loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loadingCpfLevels, setLoadingCpfLevels] = useState(false);
  const [allTechnologyTags, setAllTechnologyTags] = useState<TechnologyTag[]>(
    []
  );

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
          setRoles(pageBundle.roles);
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
          setRoles(snap.roles);
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

  useEffect(() => {
    if (employees.length === 0) return;
    const focusId = sessionStorage.getItem("profiles_focus_employee_id");
    if (!focusId) return;
    sessionStorage.removeItem("profiles_focus_employee_id");
    const target = employees.find((e) => String(e.id) === focusId);
    if (target) {
      void openEmployeeDialog(target, "view");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees]);

  // Fetch CPF levels based on role name
  const fetchCPFLevelsByRole = useCallback(async (roleName?: string) => {
    if (!roleName) {
      setCpfLevels([]);
      return;
    }

    try {
      setLoadingCpfLevels(true);
      const cpfLevelsData = await cpfLevelsApi.getCPFLevelsByRole(roleName);
      setCpfLevels(cpfLevelsData);
    } catch (cpfErr) {
      console.error("Error fetching CPF levels for role:", cpfErr);
      setCpfLevels([]);
    } finally {
      setLoadingCpfLevels(false);
    }
  }, []);

  const refetchDropdownData = useCallback(async () => {
    try {
      setLoadingDropdowns(true);
      const refs = await fetchProfilesDropdownRefs();
      setDepartments(refs.departments);
      setRoles(refs.roles);
      setProjects(refs.projects);
      setManagers(refs.managers);
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
      skipInitialCpfFetchAfterModalBundleRef.current = false;

      const result = await fetchEmployeeModalOpenPayload(employee);

      if (result.kind === "bundle") {
        const modalBundle = result.modalBundle;
        setCvVersions(sortCvVersionsDesc(modalBundle.cvVersions));
        setSelectedEmployee(modalBundle.employee);
        setDepartments(modalBundle.departments);
        setRoles(modalBundle.roles);
        setProjects(modalBundle.projects);
        setManagers(modalBundle.managers);
        setCpfLevels(modalBundle.cpfLevelsForRole);
        if (modalBundle.cpfLevelsForRole.length > 0) {
          skipInitialCpfFetchAfterModalBundleRef.current = true;
        }
        setEditMode(mode === "edit");
        setDialogOpen(true);
        return;
      }

      setCvVersions(result.cvVersions);
      setSelectedEmployee(result.employee);
      setEditMode(mode === "edit");
      setDialogOpen(true);
      await refetchDropdownData();
    } catch (err) {
      console.error("Error fetching employee details:", err);
      setSelectedEmployee(employee);
      setEditMode(mode === "edit");
      setDialogOpen(true);
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
    if (!dialogOpen || !selectedEmployee?.role?.name) return;
    if (skipInitialCpfFetchAfterModalBundleRef.current) {
      skipInitialCpfFetchAfterModalBundleRef.current = false;
      return;
    }
    void fetchCPFLevelsByRole(selectedEmployee.role.name);
  }, [dialogOpen, selectedEmployee?.role?.name, fetchCPFLevelsByRole]);

  useEffect(() => {
    if (!dialogOpen || !selectedEmployee) return;

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
  }, [dialogOpen, selectedEmployee, permissionBits, currentUserId]);

  const closeEmployeeDialog = () => {
    setDialogOpen(false);
    setSelectedEmployee(null);
    setEditMode(false);
    setSaveError(null);
    setSaveSuccess(false);
    const returnTo = sessionStorage.getItem("profiles_return_to");
    if (returnTo && onNavigate) {
      sessionStorage.removeItem("profiles_return_to");
      onNavigate(returnTo);
    }
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
    skipInitialCpfFetchAfterModalBundleRef.current = false;
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

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const updated = await employeeApi.updateEmployee(
        selectedEmployee.id,
        buildEmployeeUpdatePayload(selectedEmployee)
      );

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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save employee";
      setSaveError(errorMessage);
      toast.error(errorMessage, { position: "bottom-right" });
      console.error("Error saving employee:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Profiles
          </h1>
          <p className="text-gray-600">
            Manage employee information, roles, and professional development
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-zinc-200 focus:ring-zinc-500/10 focus:border-zinc-400 rounded-xl h-11"
              disabled={isLoading}
            />
          </div>
        </div>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-45 bg-white border-zinc-200 focus:ring-zinc-500/10 focus:border-zinc-400 rounded-xl h-11">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && employees.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No employees found</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && employees.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => {
                    const initials = employeeDisplayInitials(
                      employee.first_name,
                      employee.last_name
                    );

                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={employee.avatar}
                                alt={`${employee.first_name} ${employee.last_name}`}
                              />
                              <AvatarFallback className="text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </div>
                              {(employee.technology_tags?.length ?? 0) > 0 && (
                                <div className="mt-1 flex flex-wrap items-center">
                                  {employee
                                    .technology_tags!.slice(0, 3)
                                    .map((tag, idx) => (
                                      <Fragment key={tag.id}>
                                        {idx > 0 ? (
                                          <span
                                            className="mx-1.5 h-3 w-px shrink-0 self-center bg-zinc-200"
                                            aria-hidden
                                          />
                                        ) : null}
                                        <span
                                          className="inline-flex size-4 shrink-0 items-center justify-center leading-none"
                                          title={tag.name}
                                          aria-label={tag.name}
                                        >
                                          <TechIcon name={tag.name} size={16} />
                                        </span>
                                      </Fragment>
                                    ))}
                                  {employee.technology_tags!.length > 3 ? (
                                    <>
                                      <span
                                        className="mx-1.5 h-3 w-px shrink-0 self-center bg-zinc-200"
                                        aria-hidden
                                      />
                                      <span className="text-[10px] font-medium leading-none text-zinc-400 tabular-nums">
                                        +{employee.technology_tags!.length - 3}
                                      </span>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {employee.email}
                        </TableCell>
                        <TableCell>{employee.role?.name || "—"}</TableCell>
                        <TableCell>{employee.department || "—"}</TableCell>
                        <TableCell>{formatDate(employee.start_date)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              employee.is_active
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {employee.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEmployeeDialog(employee, "view")}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          {canEditAll && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openEmployeeDialog(employee, "edit")
                              }
                              className="gap-2 ml-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee View/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            const returnTo = sessionStorage.getItem("profiles_return_to");
            if (returnTo && onNavigate) {
              sessionStorage.removeItem("profiles_return_to");
              onNavigate(returnTo);
            }
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[92vh] flex flex-col rounded-2xl ring-1 ring-zinc-900/6">
          <DialogTitle className="sr-only">
            {selectedEmployee
              ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} Profile`
              : "Employee Profile"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Employee profile information{" "}
            {editMode ? "in edit mode" : "in view mode"}
          </DialogDescription>

          {isLoadingEmployee ? (
            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              {/* Loading skeleton ... */}
            </div>
          ) : selectedEmployee ? (
            <div className="flex-1 overflow-y-auto px-8 pt-8 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-50 hover:scrollbar-thumb-zinc-400 transition-colors">
              <div className="space-y-8">
                {/* Header with Profile Picture and Title */}
                <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
                  <Avatar className="h-24 w-24 shrink-0 shadow-sm border border-gray-100">
                    <AvatarImage src={selectedEmployee.avatar} alt="avatar" />
                    <AvatarFallback className="text-2xl font-bold bg-gray-100 text-teal-700 uppercase">
                      {`${selectedEmployee.first_name?.[0] || ""}${selectedEmployee.last_name?.[0] || ""}`}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        {selectedEmployee.first_name}{" "}
                        {selectedEmployee.last_name}
                      </h2>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase font-bold tracking-widest px-2 py-0 border-gray-200 text-gray-500 bg-gray-50"
                        )}
                      >
                        {editMode ? "Editing" : "Overview"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <span>{selectedEmployee.email}</span>
                      <span className="text-gray-300 mx-1">•</span>
                      <span className="font-semibold text-gray-700">
                        {selectedEmployee.role?.name || "Member"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Personal Information
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        SECTION 01
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <EditableInput
                        label="First Name"
                        value={selectedEmployee.first_name}
                        onChange={(value) =>
                          currentUserId === selectedEmployee.id &&
                          setSelectedEmployee({
                            ...selectedEmployee,
                            first_name: value,
                          })
                        }
                        disabled={currentUserId !== selectedEmployee.id}
                        isEditing={editMode}
                        placeholder="First name"
                      />
                      <EditableInput
                        label="Last Name"
                        value={selectedEmployee.last_name}
                        onChange={(value) =>
                          currentUserId === selectedEmployee.id &&
                          setSelectedEmployee({
                            ...selectedEmployee,
                            last_name: value,
                          })
                        }
                        disabled={currentUserId !== selectedEmployee.id}
                        isEditing={editMode}
                        placeholder="Last name"
                      />
                      <EditableInput
                        label="Email"
                        type="email"
                        value={selectedEmployee.email}
                        onChange={(value) =>
                          currentUserId === selectedEmployee.id &&
                          setSelectedEmployee({
                            ...selectedEmployee,
                            email: value,
                          })
                        }
                        disabled={currentUserId !== selectedEmployee.id}
                        isEditing={editMode}
                        placeholder="Email address"
                      />
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          Birth Date
                        </label>
                        {currentUserId === selectedEmployee.id && editMode ? (
                          <DatePicker
                            value={selectedEmployee.birth_date}
                            onChange={(date) =>
                              currentUserId === selectedEmployee.id &&
                              setSelectedEmployee({
                                ...selectedEmployee,
                                birth_date: date,
                              })
                            }
                            mode="single"
                            disabled={currentUserId !== selectedEmployee.id}
                            placeholder="Select your birth date"
                            disabledDates={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                          />
                        ) : (
                          <div className="py-1">
                            <p
                              className={cn(
                                "text-base font-medium transition-colors",
                                selectedEmployee.birth_date
                                  ? "text-gray-900"
                                  : "text-gray-400 italic"
                              )}
                            >
                              {selectedEmployee.birth_date
                                ? formatDate(selectedEmployee.birth_date)
                                : "Not provided"}
                            </p>
                          </div>
                        )}
                      </div>
                      {/* Address - Only show for own profile */}
                      {currentUserId === selectedEmployee.id && (
                        <div className="col-span-2">
                          <EditableInput
                            label="Address"
                            value={selectedEmployee.address || ""}
                            onChange={(value) =>
                              setSelectedEmployee({
                                ...selectedEmployee,
                                address: value,
                              })
                            }
                            isEditing={editMode}
                            placeholder="Your street address"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employment Information Section - Editable only if user has permission */}
                  <div className="space-y-6">
                    <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Employment Information
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        SECTION 02
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <EditableSelect
                        label="Department"
                        value={selectedEmployee.department || ""}
                        onChange={(value) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            department: value,
                          })
                        }
                        options={departments}
                        getOptionValue={(dept) => dept}
                        getOptionLabel={(dept) => dept}
                        disabled={!canEditAll}
                        isEditing={editMode}
                        placeholder="Select department"
                      />
                      <EditableSelect
                        label="Role"
                        value={selectedEmployee.role?.id?.toString() || ""}
                        onChange={(value) => {
                          const selectedRole = roles.find(
                            (r) => r.id.toString() === value
                          );
                          setSelectedEmployee({
                            ...selectedEmployee,
                            role: selectedRole,
                          });
                          // Fetch CPF levels for the selected role (by name)
                          if (selectedRole?.name) {
                            fetchCPFLevelsByRole(selectedRole.name);
                          }
                        }}
                        options={roles}
                        getOptionValue={(role) => role.id.toString()}
                        getOptionLabel={(role) => role.name}
                        disabled={!canEditAll}
                        isEditing={editMode}
                        placeholder="Select role"
                      />
                      <EditableMultiSelect
                        label="Assigned Projects"
                        selectedValues={projects.filter((p) =>
                          selectedEmployee.assigned_projects?.some(
                            (ap) => ap.project_id === p.id
                          )
                        )}
                        onChange={(newProjects) => {
                          // Keep assignments that are still selected
                          const keptAssignments = (
                            selectedEmployee.assigned_projects || []
                          ).filter((ap) =>
                            newProjects.some((p) => p.id === ap.project_id)
                          );

                          // Create new assignments for projects that weren't selected before
                          const newAssignments = newProjects
                            .filter(
                              (p) =>
                                !keptAssignments.some(
                                  (ap) => ap.project_id === p.id
                                )
                            )
                            .map((p) => ({
                              id: 0,
                              project_id: p.id,
                              project_name: p.name,
                              role: "",
                              start_date: new Date()
                                .toISOString()
                                .split("T")[0],
                              status: "active",
                            }));

                          const allAssignments = [
                            ...keptAssignments,
                            ...newAssignments,
                          ];

                          const updatedEmployee = {
                            ...selectedEmployee,
                            assigned_projects: allAssignments,
                          };

                          if (newProjects.length > 0) {
                            // Collect all unique leads from all selected projects
                            const allLeads: { id: number; name: string }[] = [];
                            const seenIds = new Set<number>();

                            newProjects.forEach((np) => {
                              if (np.leaders) {
                                np.leaders.forEach(
                                  (leader: { id: number; name: string }) => {
                                    if (!seenIds.has(leader.id)) {
                                      seenIds.add(leader.id);
                                      allLeads.push(leader);
                                    }
                                  }
                                );
                              }
                            });

                            if (allLeads.length > 0) {
                              updatedEmployee.manager_ids = allLeads.map(
                                (l) => l.id
                              );

                              toast.info(
                                `Managers automatically set to project leads: ${allLeads
                                  .map((l) => l.name)
                                  .join(", ")}`,
                                {
                                  position: "bottom-right",
                                }
                              );
                            }
                          } else {
                            // If no projects, clear managers
                            updatedEmployee.manager_ids = [];
                            toast.info(
                              "Projects cleared. Manager selection reset.",
                              {
                                position: "bottom-right",
                              }
                            );
                          }

                          setSelectedEmployee(updatedEmployee);
                        }}
                        allOptions={projects}
                        getOptionValue={(project) => project.id}
                        getOptionLabel={(project) => project.name}
                        disabled={!canEditAll}
                        isEditing={editMode}
                        colSpan="col-span-2"
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          Start Date
                        </label>
                        {canEditAll && editMode ? (
                          <div className="w-full">
                            <DatePicker
                              value={selectedEmployee.start_date}
                              onChange={(date) =>
                                setSelectedEmployee({
                                  ...selectedEmployee,
                                  start_date: date,
                                })
                              }
                              mode="single"
                              disabled={!editMode}
                              placeholder="Select start date"
                              disabledDates={(date) => date > new Date()}
                            />
                          </div>
                        ) : (
                          <div className="py-1">
                            <p
                              className={cn(
                                "text-base font-medium transition-colors",
                                selectedEmployee.start_date
                                  ? "text-gray-900"
                                  : "text-gray-400 italic"
                              )}
                            >
                              {selectedEmployee.start_date
                                ? formatDate(selectedEmployee.start_date)
                                : "Not started"}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider pb">
                          Employment Status
                        </label>
                        {canEditAll && editMode ? (
                          <Select
                            value={
                              selectedEmployee.employment_status || "active"
                            }
                            onValueChange={(value) =>
                              editMode &&
                              setSelectedEmployee({
                                ...selectedEmployee,
                                employment_status: value,
                              })
                            }
                            disabled={!editMode}
                          >
                            <SelectTrigger className="w-full mt-0.5 bg-white border-zinc-200 focus:ring-zinc-500/10 focus:border-zinc-400 transition-all rounded-xl h-14! shadow-sm">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="on_leave">On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="py-1">
                            <Badge
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter",
                                selectedEmployee.employment_status === "active"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : selectedEmployee.employment_status ===
                                      "on_leave"
                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                              )}
                            >
                              {selectedEmployee.employment_status || "Unknown"}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          CPF Level
                        </label>
                        {loadingCpfLevels ? (
                          <div className="py-1 flex items-center gap-2 text-gray-400 animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <p className="text-sm font-medium">
                              Optimizing CPF data...
                            </p>
                          </div>
                        ) : (
                          <EditableSelect
                            label=""
                            value={selectedEmployee.cpf_level || ""}
                            onChange={(value) =>
                              setSelectedEmployee({
                                ...selectedEmployee,
                                cpf_level: value,
                              })
                            }
                            options={cpfLevels}
                            getOptionValue={(level) => level}
                            getOptionLabel={(level) => level}
                            disabled={!canEditAll}
                            isEditing={editMode}
                            placeholder="Select CPF Level"
                            noDataMessage="No CPF levels available"
                            triggerClassName="h-11! !py-0"
                          />
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          Manager (Tech Lead)
                        </label>
                        {canEditAll ? (
                          <EditableMultiSelect
                            label=""
                            selectedValues={managers.filter((m) =>
                              selectedEmployee.manager_ids?.includes(m.id)
                            )}
                            onChange={(selectedManagers) =>
                              setSelectedEmployee({
                                ...selectedEmployee,
                                manager_ids: selectedManagers.map((m) => m.id),
                              })
                            }
                            allOptions={managers}
                            getOptionValue={(manager) => manager.id}
                            getOptionLabel={(manager) =>
                              `${manager.first_name} ${manager.last_name}`
                            }
                            disabled={!canEditAll}
                            isEditing={editMode}
                          />
                        ) : (
                          <div className="py-1">
                            <p
                              className={cn(
                                "text-base font-medium transition-colors",
                                selectedEmployee.manager_names
                                  ? "text-gray-900"
                                  : "text-gray-400 italic"
                              )}
                            >
                              {selectedEmployee.manager_names ||
                                "No manager assigned"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Technology Tags Section */}
                  <div className="space-y-6">
                    <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Technology & Skills
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        SECTION 03
                      </span>
                    </div>
                    <TechnologyTagInput
                      selectedTags={selectedEmployee.technology_tags ?? []}
                      allTags={allTechnologyTags}
                      isEditing={editMode}
                      disabled={
                        !canEditAll && currentUserId !== selectedEmployee.id
                      }
                      onTagAdded={(tag) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          technology_tags: [
                            ...(selectedEmployee.technology_tags ?? []),
                            tag,
                          ],
                        })
                      }
                      onTagRemoved={(tagId) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          technology_tags: (
                            selectedEmployee.technology_tags ?? []
                          ).filter((t) => t.id !== tagId),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        CV
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        SECTION 04
                      </span>
                    </div>
                    <div className="space-y-4">
                      {editMode && canUploadCV ? (
                        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            Add a CV version
                          </p>

                          <div
                            className="relative flex min-h-8 w-full rounded-lg border border-zinc-300/70 bg-zinc-200 p-1 shadow-inner"
                            role="tablist"
                            aria-label="CV source"
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "pointer-events-none absolute rounded-[6px] bg-white shadow-md ring-1 ring-black/[0.08] transition-[left,right] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                                cvAddMode === "file"
                                  ? "inset-y-1 left-1 right-1/2"
                                  : "inset-y-1 left-1/2 right-1"
                              )}
                            />
                            <button
                              type="button"
                              role="tab"
                              aria-selected={cvAddMode === "file"}
                              className={cn(
                                "relative z-10 flex-1 rounded-md py-1 text-xs font-medium transition-colors duration-200",
                                cvAddMode === "file"
                                  ? "text-zinc-900"
                                  : "text-zinc-500 hover:text-zinc-700"
                              )}
                              onClick={() => setCvAddMode("file")}
                            >
                              Upload file
                            </button>
                            <button
                              type="button"
                              role="tab"
                              aria-selected={cvAddMode === "link"}
                              className={cn(
                                "relative z-10 flex-1 rounded-md py-1 text-xs font-medium transition-colors duration-200",
                                cvAddMode === "link"
                                  ? "text-zinc-900"
                                  : "text-zinc-500 hover:text-zinc-700"
                              )}
                              onClick={() => setCvAddMode("link")}
                            >
                              Paste link
                            </button>
                          </div>

                          <div
                            key={cvAddMode}
                            className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5 pt-0.5"
                          >
                            {cvAddMode === "file" ? (
                              <>
                                <p className="text-[11px] leading-tight text-zinc-500">
                                  PDF, DOC or DOCX · max 10MB
                                </p>
                                <div>
                                  <input
                                    ref={cvFileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={handleCVFilePicked}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      cvFileInputRef.current?.click()
                                    }
                                    disabled={isUploadingCV}
                                    className="h-8 gap-2 px-3 text-xs"
                                  >
                                    {isUploadingCV ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-3.5 h-3.5" />
                                        Choose file
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-[11px] leading-tight text-zinc-500">
                                  Canva share URL or any https link
                                </p>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <Input
                                    type="url"
                                    placeholder="https://…"
                                    value={cvLinkDraft}
                                    onChange={(e) =>
                                      setCvLinkDraft(e.target.value)
                                    }
                                    className="h-8 bg-white text-sm sm:flex-1"
                                    disabled={isAddingCvLink}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 px-3 text-xs shrink-0 sm:w-auto w-full justify-center"
                                    onClick={() => void handleAddCvLink()}
                                    disabled={isAddingCvLink}
                                  >
                                    {isAddingCvLink ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Saving…
                                      </>
                                    ) : (
                                      <>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Save link
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : editMode && !canUploadCV ? (
                        <p className="text-xs text-zinc-500">
                          You don&apos;t have permission to add or remove CVs
                          for this profile.
                        </p>
                      ) : null}

                      {isLoadingCVs ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : cvVersions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">
                          No CV on file yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {cvVersions.map((cv) => (
                            <div
                              key={cv.id}
                              className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                                  <p className="truncate text-sm font-medium text-zinc-900">
                                    {cv.file_name ||
                                      (cv.provider === "canva"
                                        ? "Canva CV link"
                                        : "CV file")}
                                  </p>
                                  {cv.provider === "canva" ? (
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                      Canva
                                    </Badge>
                                  ) : null}
                                  {cv.is_current ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                      Current
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                  Uploaded {formatDate(cv.uploaded_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => handleCVAccess(cv)}
                                >
                                  {cv.source_type === "external_link" ? (
                                    <ExternalLink className="h-4 w-4" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                  {cv.source_type === "external_link"
                                    ? "Open link"
                                    : "Download"}
                                </Button>
                                {cvVersionSupportsEmbeddedPreview(cv) ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleCVPreview(cv)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    Preview
                                  </Button>
                                ) : null}
                                {canUploadCV && editMode ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteCV(cv)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Change History
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        SECTION 06
                      </span>
                    </div>
                    {isLoadingProfileHistory ? (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading change history...
                      </div>
                    ) : profileHistoryError ? (
                      <p className="text-sm text-red-600">
                        {profileHistoryError}
                      </p>
                    ) : profileChangeHistory.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        No tracked profile changes yet.
                      </p>
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
                            {profileChangeHistory.map((entry) => (
                              <TableRow key={String(entry.id)}>
                                <TableCell>
                                  {formatDate(entry.changed_at)}
                                </TableCell>
                                <TableCell>
                                  {profileHistoryFieldLabel(entry.field)}
                                </TableCell>
                                <TableCell className="text-zinc-600">
                                  {profileHistoryValueText(
                                    entry.field,
                                    entry.old_value
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-zinc-900">
                                  {profileHistoryValueText(
                                    entry.field,
                                    entry.new_value
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

                  {/* Emergency Contact Section - Editable only if user has permission */}
                  <div className="space-y-6">
                    <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Emergency Contact
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        SECTION 05
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <EditableInput
                        label="Contact Name"
                        value={selectedEmployee.emergency_contact_name}
                        onChange={(value) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            emergency_contact_name: value,
                          })
                        }
                        disabled={
                          !canEditAll && currentUserId !== selectedEmployee.id
                        }
                        isEditing={editMode}
                        placeholder="Full name"
                      />
                      <EditableInput
                        label="Contact Phone"
                        value={selectedEmployee.emergency_contact_phone}
                        onChange={(value) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            emergency_contact_phone: value.slice(0, 30),
                          })
                        }
                        disabled={
                          !canEditAll && currentUserId !== selectedEmployee.id
                        }
                        isEditing={editMode}
                        placeholder="+XXXXXXXXXXX"
                        maxLength={30}
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {saveError && editMode && (
                  <div className="rounded-md bg-red-50 p-4 border border-red-200 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-medium text-red-900">Error</h3>
                      <p className="text-sm text-red-700">{saveError}</p>
                    </div>
                  </div>
                )}

                {editMode ? (
                  <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 mt-6 bg-white sticky bottom-0 -mx-8 px-8 pb-8 z-40">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={closeEmployeeDialog}
                      disabled={isSaving}
                      className="text-gray-600 hover:text-zinc-900 font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleSaveEmployee()}
                      disabled={isSaving}
                      className="gap-2 bg-zinc-800 hover:bg-zinc-900 text-white border-none shadow-lg shadow-zinc-900/10 px-10 h-12 rounded-xl transition-all active:scale-95"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
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
    </div>
  );
}
