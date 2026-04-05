"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Loader2,
  AlertCircle,
  Plus,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/hr-dashboard/ui/card";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Input } from "@/components/hr-dashboard/ui/input";
import { Badge } from "@/components/hr-dashboard/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/hr-dashboard/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/hr-dashboard/ui/select";
import { employeeApi, EmployeeProfileData } from "@/lib/api/employees";
import { formatDate } from "@/utils";

export default function EmployeesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [employees, setEmployees] = useState<EmployeeProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!session) return;

      try {
        setIsLoading(true);
        setError(null);

        const params = {
          is_active: true,
          page_size: 100,
          ...(searchTerm && { search: searchTerm }),
          ...(departmentFilter && { department: departmentFilter }),
        };

        const result = await employeeApi.listEmployees(params);
        setEmployees(result.results || []);

        // Extract unique departments
        const uniqueDepts = Array.from(
          new Set(result.results.map((emp) => emp.department).filter(Boolean))
        ) as string[];
        setDepartments(uniqueDepts);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load employees";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (session) {
        fetchEmployees();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [session, searchTerm, departmentFilter]);

  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/employee/${employeeId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">
            View and manage employee profiles and information
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-50">
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10"
            disabled={isLoading}
          />
        </div>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
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

      {/* Employees Grid */}
      {employees.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No employees found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => {
            const initials =
              `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

            return (
              <Card
                key={employee.id}
                className="hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleEmployeeClick(employee.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header with Avatar */}
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={employee.avatar}
                          alt={`${employee.first_name} ${employee.last_name}`}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
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

                    {/* Employee Details */}
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-500">Employee ID</p>
                        <p className="text-gray-900 font-medium">
                          {employee.employee_id}
                        </p>
                      </div>

                      {employee.email && (
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p className="text-gray-900 truncate">
                            {employee.email}
                          </p>
                        </div>
                      )}

                      {employee.department && (
                        <div>
                          <p className="text-gray-500">Department</p>
                          <p className="text-gray-900">{employee.department}</p>
                        </div>
                      )}

                      {employee.start_date && (
                        <div>
                          <p className="text-gray-500">Started</p>
                          <p className="text-gray-900">
                            {formatDate(employee.start_date)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* View Profile Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmployeeClick(employee.id);
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
