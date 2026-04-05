import { useState, useEffect, useCallback } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { AlertCircle, Search, Loader2, Eye, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils";
import { cn } from "../ui/utils";
import { employeeApi, EmployeeProfileData } from "@/lib/api/employees";
import { departmentsApi } from "@/lib/api/departments";
import { cpfLevelsApi } from "@/lib/api/cpf-levels";
import { managersApi, type Manager } from "@/lib/api/managers";
import { getUserPermissions, getStoredUser } from "@/lib/api/tokens";
import { PERMISSION_REQUIREMENTS } from "@/lib/api/permissions";
import { DatePicker } from "../DatePicker";
import {
  EditableInput,
  EditableSelect,
  EditableMultiSelect,
} from "../ui/editable-form";

export default function ProfilesModule() {
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);

  // New states for dropdown data
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<
    { id: number; name: string; leaders?: { id: number; name: string }[] }[]
  >([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [cpfLevels, setCpfLevels] = useState<string[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loadingCpfLevels, setLoadingCpfLevels] = useState(false);

  // Fetch employees and permissions on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user ID
        const user = getStoredUser();
        if (user && typeof user.id === "number") {
          setCurrentUserId(user.id);
        }

        // Check permissions
        const permBits = await getUserPermissions();

        const hasEditAll =
          PERMISSION_REQUIREMENTS.canUpdateAnyProfile(permBits);
        setCanEditAll(hasEditAll);

        // Fetch employees
        const data = await employeeApi.listEmployees();
        setEmployees(data.results || []);

        // Fetch departments from dedicated API
        try {
          const departmentsData =
            await departmentsApi.getDepartmentsAsStrings();
          setDepartments(departmentsData);
        } catch (deptErr) {
          console.error("Error fetching departments:", deptErr);
          // Fallback: extract from employees
          const uniqueDepts = Array.from(
            new Set(
              (data.results || [])
                .map((emp: EmployeeProfileData) => emp.department)
                .filter(Boolean)
            )
          ) as string[];
          setDepartments(uniqueDepts);
        }

        // Fetch dropdown data with individual error handling
        setLoadingDropdowns(true);
        try {
          try {
            const rolesData = await employeeApi.getRoles();
            setRoles(rolesData);
          } catch {
            setRoles([]);
          }

          try {
            const projectsData = await employeeApi.getProjects();
            setProjects(projectsData);
          } catch {
            setProjects([]);
          }

          try {
            const cpfLevelsData = await employeeApi.getCPFLevels();
            setCpfLevels(cpfLevelsData);
          } catch {
            setCpfLevels([]);
          }

          // Fetch managers once with standard roles
          try {
            const managersData = await managersApi.getManagersByRole();
            setManagers(managersData);
          } catch (managersErr) {
            console.error("Error fetching managers:", managersErr);
            setManagers([]);
          }
        } catch {
        } finally {
          setLoadingDropdowns(false);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load employees"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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

  // Refetch dropdown data
  const refetchDropdownData = useCallback(async () => {
    try {
      setLoadingDropdowns(true);

      try {
        const departmentsData = await departmentsApi.getDepartmentsAsStrings();
        setDepartments(departmentsData);
      } catch (deptErr) {
        console.error("Error fetching departments:", deptErr);
        setDepartments([]);
      }

      try {
        const rolesData = await employeeApi.getRoles();
        setRoles(rolesData);
      } catch {
        setRoles([]);
      }

      try {
        const projectsData = await employeeApi.getProjects();
        setProjects(projectsData);
      } catch {
        setProjects([]);
      }

      // Fetch managers once with standard roles
      try {
        const managersData = await managersApi.getManagersByRole();
        setManagers(managersData);
      } catch (managersErr) {
        console.error("Error fetching managers:", managersErr);
        setManagers([]);
      }

      // Fetch CPF levels for the currently selected employee's role
      // This will be updated when role selection changes
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
      // Fetch fresh employee data
      const freshEmployee = await employeeApi.getEmployee(employee.id);
      setSelectedEmployee(freshEmployee);
      setEditMode(mode === "edit");
      setDialogOpen(true);
      // Refetch dropdown data whenever opening the modal
      refetchDropdownData();
    } catch (err) {
      console.error("Error fetching employee details:", err);
      // Fallback to the employee passed in
      setSelectedEmployee(employee);
      setEditMode(mode === "edit");
      setDialogOpen(true);
      refetchDropdownData();
    } finally {
      setIsLoadingEmployee(false);
    }
  };

  // Refetch employees and dropdown data when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      refetchDropdownData();

      // Refetch all employees to get latest data
      const refetchEmployees = async () => {
        try {
          const data = await employeeApi.listEmployees();
          setEmployees(data.results || []);
        } catch (err) {
          console.error("Error refetching employees:", err);
        }
      };

      refetchEmployees();

      // Fetch CPF levels for the currently selected employee's role
      if (selectedEmployee?.role?.name) {
        fetchCPFLevelsByRole(selectedEmployee.role.name);
      }
    }
  }, [
    dialogOpen,
    refetchDropdownData,
    selectedEmployee?.role?.name,
    fetchCPFLevelsByRole,
  ]);

  const closeEmployeeDialog = () => {
    setDialogOpen(false);
    setSelectedEmployee(null);
    setEditMode(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      // Prepare update data according to bulk-update endpoint spec
      const updateData: Record<string, unknown> = {
        first_name: selectedEmployee.first_name,
        last_name: selectedEmployee.last_name,
        email_address: selectedEmployee.email,
        phone_number: selectedEmployee.phone_number,
        address: selectedEmployee.address,
        birthday: selectedEmployee.birth_date,
        start_date: selectedEmployee.start_date,
        employment_status: selectedEmployee.employment_status,
        department: selectedEmployee.department,
        role: selectedEmployee.role?.id,
        manager_ids: selectedEmployee.manager_ids,
        managers: selectedEmployee.manager_ids,
        assigned_projects:
          selectedEmployee.assigned_projects?.map((p) => ({
            project_id: p.project_id || p.id,
            role: p.role || "",
            start_date: p.start_date || new Date().toISOString().split("T")[0],
            end_date: p.end_date || null,
            status: p.status || "active",
          })) || [],
      };

      // Add optional fields if they exist
      if (selectedEmployee.career_level) {
        updateData.career_level = selectedEmployee.career_level;
      }
      if (selectedEmployee.cpf_level) {
        updateData.cpf_level = selectedEmployee.cpf_level;
      }
      if (selectedEmployee.emergency_contact_name) {
        updateData.emergency_contact_name =
          selectedEmployee.emergency_contact_name;
      }
      if (selectedEmployee.emergency_contact_phone) {
        updateData.emergency_contact_phone =
          selectedEmployee.emergency_contact_phone;
      }

      // Call API to update employee
      const updated = await employeeApi.updateEmployee(
        selectedEmployee.id,
        updateData
      );

      // Update the employees list with the new data
      setEmployees(
        employees.map((emp) => (emp.id === updated.id ? updated : emp))
      );

      // Refetch all employees to ensure we have the latest data
      try {
        const data = await employeeApi.listEmployees();
        setEmployees(data.results || []);

        // Update the selectedEmployee with the latest data from the server
        if (data.results) {
          const updatedEmployee = data.results.find(
            (emp) => emp.id === selectedEmployee.id
          );
          if (updatedEmployee) {
            setSelectedEmployee(updatedEmployee);
          }
        }
      } catch (err) {
        console.error("Error refetching employees:", err);
      }

      // Show success toast with bottom-right position
      toast.success(
        `${selectedEmployee.first_name} ${selectedEmployee.last_name} has been updated successfully`,
        {
          position: "bottom-right",
        }
      );

      // Exit edit mode to show read-only view with updated data
      setEditMode(false);

      // Don't close dialog - keep it open so user can see the updated data
      // User can close manually by clicking X or Cancel
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save employee";
      setSaveError(errorMessage);
      toast.error(errorMessage, {
        position: "bottom-right",
      });
      console.error("Error saving employee:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Profiles
          </h1>
          <p className="text-gray-600">
            Manage employee information, roles, and professional development
          </p>
        </div>
        {/* Export button can be re-added here if needed, but only one Dialog should be open at a time */}
      </div>

      {/* Search and Filters */}
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

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
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

      {/* Empty State */}
      {!isLoading && employees.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No employees found</p>
          </CardContent>
        </Card>
      )}

      {/* Employees Table */}
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
                    const initials =
                      `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

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
                            <div className="font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[92vh] flex flex-col">
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
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-50 hover:scrollbar-thumb-zinc-400 transition-colors">
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

                  {/* Emergency Contact Section - Editable only if user has permission */}
                  <div className="space-y-6">
                    <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Emergency Contact
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        SECTION 03
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

                {/* Action Buttons - Show for users editing their own profile OR HR editing any profile */}
                {/* Save Button Placeholder */}
                <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 mt-6 bg-white sticky bottom-0 -mx-8 px-8 pb-8 z-40">
                  <Button
                    variant="ghost"
                    onClick={closeEmployeeDialog}
                    disabled={isSaving}
                    className="text-gray-400 hover:text-zinc-600 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEmployee}
                    disabled={isSaving}
                    className="gap-2 bg-zinc-800 hover:bg-zinc-900 text-white border-none shadow-lg shadow-zinc-900/10 px-10 h-12 rounded-xl transition-all active:scale-95"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editMode ? "Save Changes" : "Confirm Changes"}</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
