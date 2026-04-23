import { Fragment } from "react";
import { Eye, Edit2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { formatDate } from "@/utils";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { employeeDisplayInitials } from "./profilesModuleHelpers";
import { TechIcon } from "./tech-icons";

interface EmployeesTableSectionProps {
  isLoading: boolean;
  employees: EmployeeProfileData[];
  canEditAll: boolean;
  onOpenEmployee: (
    employee: EmployeeProfileData,
    mode: "view" | "edit"
  ) => void;
}

export function EmployeesTableSection({
  isLoading,
  employees,
  canEditAll,
  onOpenEmployee,
}: EmployeesTableSectionProps) {
  if (isLoading) {
    return (
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
    );
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No employees found</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                          {(employee.technology_tags?.length ?? 0) > 0 ? (
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
                          ) : null}
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
                        onClick={() => onOpenEmployee(employee, "view")}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      {canEditAll ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenEmployee(employee, "edit")}
                          className="gap-2 ml-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
