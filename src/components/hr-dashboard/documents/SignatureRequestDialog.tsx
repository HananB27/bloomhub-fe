"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronsUpDown, UserPlus, X } from "lucide-react";
import type { EmployeeDocument } from "@/lib/api/modules/documents";
import { documentsApi } from "@/lib/api/modules/documents";
import { employeeApi } from "@/lib/api/modules/employees";
import type { EmployeeProfileData } from "@/lib/api/helpers/transformers";
import { employeeDisplayInitials } from "../employee-profiles/profilesModuleHelpers";
import { Alert, AlertDescription } from "../ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

function SignerAvatar({
  signer,
  size = "md",
}: {
  signer: {
    name: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
  };
  size?: "sm" | "md";
}) {
  const initials =
    employeeDisplayInitials(signer.firstName, signer.lastName) ||
    signer.name.slice(0, 2).toUpperCase();
  const dim = size === "sm" ? "h-6 w-6" : "h-9 w-9";
  return (
    <Avatar className={dim}>
      <AvatarImage src={signer.avatar} alt={signer.name} />
      <AvatarFallback className="bg-indigo-100 text-[11px] font-semibold text-indigo-700">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

interface SignatureRequestDialogProps {
  document: EmployeeDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (document: EmployeeDocument) => void;
}

interface SelectedSigner {
  id: number;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

function buildEmployeeDisplayName(employee: EmployeeProfileData): string {
  const full =
    `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
  return full || employee.username || employee.email;
}

function toSelectedSigner(employee: EmployeeProfileData): SelectedSigner {
  return {
    id: employee.id,
    name: buildEmployeeDisplayName(employee),
    email: employee.email.trim().toLowerCase(),
    firstName: employee.first_name,
    lastName: employee.last_name,
    avatar: employee.avatar,
  };
}

export function validateSelectedSigners(
  signers: SelectedSigner[]
): string | null {
  if (signers.length === 0) {
    return "Select at least one signer.";
  }
  if (signers.some((s) => !s.email)) {
    return "Selected employee is missing an email address.";
  }
  return null;
}

export function SignatureRequestDialog({
  document,
  open,
  onOpenChange,
  onSuccess,
}: SignatureRequestDialogProps) {
  const [employees, setEmployees] = useState<EmployeeProfileData[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedSigner[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelected(
      document?.signers.length
        ? document.signers.map((signer, index) => ({
            id: -(index + 1),
            name: signer.name,
            email: signer.email,
          }))
        : []
    );
  }, [document, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingEmployees(true);
    setEmployeesError(null);
    employeeApi
      .listEmployees({ is_active: true, page_size: 500 })
      .then(({ results }) => {
        if (cancelled) return;
        setEmployees(results.filter((employee) => Boolean(employee.email)));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setEmployeesError(
          err instanceof Error ? err.message : "Failed to load employees"
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployees(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedEmailSet = useMemo(
    () => new Set(selected.map((signer) => signer.email)),
    [selected]
  );

  const availableEmployees = useMemo(
    () =>
      employees.filter(
        (employee) => !selectedEmailSet.has(employee.email.trim().toLowerCase())
      ),
    [employees, selectedEmailSet]
  );

  const handleAddEmployee = (employee: EmployeeProfileData) => {
    setSelected((prev) => [...prev, toSelectedSigner(employee)]);
    setPickerOpen(false);
  };

  const handleRemoveSigner = (email: string) => {
    setSelected((prev) => prev.filter((signer) => signer.email !== email));
  };

  const handleSubmit = async () => {
    if (!document) return;
    const nextError = validateSelectedSigners(selected);
    if (nextError) {
      setError(nextError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await documentsApi.requestSignature(
        document.id,
        selected.map((signer) => ({ name: signer.name, email: signer.email }))
      );
      onSuccess(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signature request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle>Request signatures</DialogTitle>
          <DialogDescription>
            Select the people who need to sign{" "}
            {document ? `"${document.name}"` : "this document"}. Only active
            company employees can be requested.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Signers</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  aria-label="Add employee as signer"
                  className="w-full justify-between text-gray-700"
                  disabled={submitting || loadingEmployees}
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="size-4 text-gray-500" />
                    {loadingEmployees
                      ? "Loading employees..."
                      : "Add employee as signer"}
                  </span>
                  <ChevronsUpDown className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="z-[140] w-[min(32rem,calc(100vw-2rem))] p-0 shadow-lg"
                align="start"
                sideOffset={6}
              >
                <Command className="bg-white">
                  <CommandInput
                    placeholder="Search by name or email..."
                    aria-label="Search employees"
                  />
                  <CommandList className="max-h-72">
                    <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                      No employees found.
                    </CommandEmpty>
                    <CommandGroup>
                      {availableEmployees.map((employee) => {
                        const displayName = buildEmployeeDisplayName(employee);
                        return (
                          <CommandItem
                            key={employee.id}
                            value={`${displayName} ${employee.email}`}
                            onSelect={() => handleAddEmployee(employee)}
                            className="flex items-center gap-3 px-3 py-2.5 data-[selected=true]:bg-indigo-50"
                          >
                            <SignerAvatar
                              signer={{
                                name: displayName,
                                firstName: employee.first_name,
                                lastName: employee.last_name,
                                avatar: employee.avatar,
                              }}
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-semibold text-gray-900">
                                {displayName}
                              </span>
                              <span className="truncate text-xs text-gray-500">
                                {employee.email}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {employeesError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{employeesError}</AlertDescription>
            </Alert>
          )}

          <div
            role="list"
            aria-label="Selected signers"
            className="flex flex-col gap-2"
          >
            {selected.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
                No signers selected yet.
              </p>
            ) : (
              selected.map((signer) => (
                <div
                  key={signer.email}
                  role="listitem"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xs"
                >
                  <SignerAvatar signer={signer} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-gray-900">
                      {signer.name}
                    </span>
                    <span className="truncate text-xs text-gray-500">
                      {signer.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSigner(signer.email)}
                    disabled={submitting}
                    aria-label={`Remove ${signer.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || selected.length === 0}
          >
            {submitting ? "Requesting..." : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
