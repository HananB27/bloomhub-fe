"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  History,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/hr-dashboard/ui/card";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Input } from "@/components/hr-dashboard/ui/input";
import { Label } from "@/components/hr-dashboard/ui/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/hr-dashboard/ui/avatar";
import { Badge } from "@/components/hr-dashboard/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/hr-dashboard/ui/table";
import {
  employeeApi,
  EmployeeProfileData,
  EmployeeProfileChangeHistoryItem,
  SalaryHistoryItem,
} from "@/lib/api/employees";
import {
  profileHistoryFieldLabel,
  filterTrackedProfileHistoryEntries,
  profileHistoryValueText,
} from "@/lib/profileHistory/helpers";
import { formatDate, formatCurrency } from "@/utils";
import {
  buildFormDataFromEmployee,
  buildProfileUpdatePayload,
  getEditableFields,
  isHrRole,
  isOwnProfileById,
  validateProfileForm,
  type EditableField,
  type EmployeeProfileFormData as FormData,
  type ProfileFieldErrors as FieldError,
} from "./profilePageHelpers";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const employeeIdParam = params.id;
  const employeeId = Array.isArray(employeeIdParam)
    ? employeeIdParam[0]
    : employeeIdParam;

  const [employee, setEmployee] = useState<EmployeeProfileData | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryItem[]>([]);
  const [profileChangeHistory, setProfileChangeHistory] = useState<
    EmployeeProfileChangeHistoryItem[]
  >([]);
  const [isLoadingProfileHistory, setIsLoadingProfileHistory] = useState(false);
  const [profileHistoryError, setProfileHistoryError] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [showSalaryHistory, setShowSalaryHistory] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    birth_date: "",
  });

  const isHRUser = isHrRole((session?.user as { role?: string })?.role);
  const sessionUserIdNumber = Number(
    (session?.user as { id?: string | number })?.id
  );
  const isOwnProfile = isOwnProfileById(sessionUserIdNumber, employee?.id);
  const editableFields = getEditableFields(isHRUser, isOwnProfile);

  const loadProfileHistory = useCallback(
    async (
      targetEmployeeId: number | string,
      targetEmployeeNumericId: number
    ) => {
      const canViewHistory =
        isHRUser ||
        (Number.isFinite(sessionUserIdNumber) &&
          sessionUserIdNumber === targetEmployeeNumericId);

      if (!canViewHistory) {
        setProfileChangeHistory([]);
        setProfileHistoryError(null);
        return;
      }

      try {
        setIsLoadingProfileHistory(true);
        setProfileHistoryError(null);
        const history =
          await employeeApi.getProfileChangeHistory(targetEmployeeId);
        setProfileChangeHistory(filterTrackedProfileHistoryEntries(history));
      } catch (historyErr) {
        setProfileHistoryError(
          historyErr instanceof Error
            ? historyErr.message
            : "Failed to load history"
        );
      } finally {
        setIsLoadingProfileHistory(false);
      }
    },
    [isHRUser, sessionUserIdNumber]
  );

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) return;

      try {
        setIsLoading(true);
        setError(null);

        const data = await employeeApi.getEmployee(employeeId);
        setEmployee(data);
        setProfileChangeHistory([]);
        setProfileHistoryError(null);

        setFormData(buildFormDataFromEmployee(data));

        if (isHRUser) {
          try {
            const history = await employeeApi.getSalaryHistory(employeeId);
            setSalaryHistory(history);
          } catch (err) {
            console.warn("Could not fetch salary history:", err);
          }
        }

        await loadProfileHistory(employeeId, data.id);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load employee profile";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) fetchEmployee();
  }, [employeeId, isHRUser, session, loadProfileHistory]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FormData
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors = validateProfileForm(formData);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please fix the validation errors");
      return;
    }

    if (!employee) return;

    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      const updatePayload = buildProfileUpdatePayload(
        employee,
        formData,
        editableFields
      );

      if (Object.keys(updatePayload).length === 0) {
        setSuccess("No changes to save");
        setIsEditMode(false);
        return;
      }

      const updated = await employeeApi.updateEmployee(
        employee.id,
        updatePayload
      );

      setEmployee(updated);
      setFormData(buildFormDataFromEmployee(updated));

      setSuccess("Profile updated successfully");
      await loadProfileHistory(employee.id, updated.id);
      setIsEditMode(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (employee) {
      setFormData(buildFormDataFromEmployee(employee));
    }
    setFieldErrors({});
    setIsEditMode(false);
  };

  const renderField = (
    label: string,
    field: keyof FormData,
    icon: React.ReactNode,
    type: string = "text",
    readOnly: boolean = false
  ) => {
    const isEditable = editableFields.includes(field as EditableField);
    const isReadOnly =
      readOnly || (isEditMode && !isEditable) || (!isEditMode && true);

    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </Label>
        <Input
          type={type}
          value={formData[field]}
          onChange={(e) => handleInputChange(e, field)}
          readOnly={isReadOnly}
          disabled={isUpdating}
          className={`${
            isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""
          } ${fieldErrors[field] ? "border-red-500" : ""}`}
        />
        {fieldErrors[field] && (
          <p className="text-sm text-red-500">{fieldErrors[field]}</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="p-8">
        <Button
          variant="outline"
          size="sm"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">
                  Error Loading Profile
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  const initials =
    `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {editableFields.length > 0 && !isEditMode && (
          <Button onClick={() => setIsEditMode(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        )}

        {isEditMode && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUpdating}
              className="gap-2"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200 flex gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-green-900">Success</h3>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={employee.avatar}
                alt={`${employee.first_name} ${employee.last_name}`}
              />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {employee.first_name} {employee.last_name}
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    {employee.role?.name || "Employee"}
                  </p>
                </div>
                <Badge
                  className={
                    employee.is_active
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }
                >
                  {employee.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="h-4 w-4" />
                  Employee ID: {employee.employee_id}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Started: {formatDate(employee.start_date)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          {editableFields.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {isEditMode
                ? `You can edit: ${editableFields.map((f) => f.replace(/_/g, " ")).join(", ")}`
                : "Click Edit Profile to make changes"}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderField(
                "First Name",
                "first_name",
                <User className="h-4 w-4" />
              )}
              {renderField(
                "Last Name",
                "last_name",
                <User className="h-4 w-4" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderField(
                "Email",
                "email",
                <Mail className="h-4 w-4" />,
                "email",
                true
              )}
              {renderField(
                "Phone Number",
                "phone_number",
                <Phone className="h-4 w-4" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderField(
                "Address",
                "address",
                <MapPin className="h-4 w-4" />
              )}
              {renderField(
                "Birth Date",
                "birth_date",
                <Calendar className="h-4 w-4" />,
                "date",
                true
              )}
            </div>

            {isEditMode && editableFields.length > 0 && (
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating} className="gap-2">
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Professional Information (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-gray-500">
                Department
              </Label>
              <p className="text-gray-900 mt-1">{employee.department || "—"}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500">
                Employment Status
              </Label>
              <p className="text-gray-900 mt-1">
                {employee.employment_status || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(isHRUser || isOwnProfile) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Profile Change History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProfileHistory ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading history...
              </div>
            ) : profileHistoryError ? (
              <p className="text-sm text-red-600">{profileHistoryError}</p>
            ) : profileChangeHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No tracked changes yet.</p>
            ) : (
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
                      <TableCell>{formatDate(entry.changed_at)}</TableCell>
                      <TableCell>
                        {profileHistoryFieldLabel(entry.field)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {profileHistoryValueText(
                          entry.field,
                          entry.old_value,
                          employee.currency || "USD"
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {profileHistoryValueText(
                          entry.field,
                          entry.new_value,
                          employee.currency || "USD"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {entry.changed_by_name ||
                          entry.changed_by_email ||
                          "System"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Salary Information (HR Only) */}
      {isHRUser && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Salary Information
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSalaryHistory(!showSalaryHistory)}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Current Salary
                  </Label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(
                      employee.salary || 0,
                      employee.currency || "USD"
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Currency
                  </Label>
                  <p className="text-gray-900 mt-1">
                    {employee.currency || "USD"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary History */}
          {showSalaryHistory && salaryHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Salary History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Approved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {formatDate(entry.effective_date)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(entry.amount, entry.currency)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {entry.notes || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {entry.approved_by || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
