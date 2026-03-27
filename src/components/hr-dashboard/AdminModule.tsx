"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import {
  Users,
  Shield,
  Package,
  Settings,
  Search,
  Plus,
  Edit,
  Upload,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError, uploadRolePermissionsCsv } from "@/utils/api";
import { fetchEmployees, Employee } from "@/lib/api/employees";
import { useAdminAccess } from "@/hooks/useAdminAccess";

// Using Employee interface from API
type UserData = Employee;

interface RoleData {
  id: string;
  name: string;
  permissions: string[];
  userCount: number;
}

interface AssetData {
  id: string;
  name: string;
  type: string;
  assignedTo: string;
  status: "available" | "assigned" | "maintenance";
}

const INITIAL_ROLES: RoleData[] = [
  { id: "1", name: "Admin", permissions: ["all"], userCount: 2 },
  {
    id: "2",
    name: "HR Manager",
    permissions: ["read_profiles", "write_profiles", "manage_vacations"],
    userCount: 5,
  },
  {
    id: "3",
    name: "Employee",
    permissions: ["read_own_profile", "request_vacation"],
    userCount: 140,
  },
];

const INITIAL_ASSETS: AssetData[] = [
  {
    id: "1",
    name: "MacBook Pro 14",
    type: "Laptop",
    assignedTo: "Alex Thompson",
    status: "assigned",
  },
  {
    id: "2",
    name: 'Dell UltraSharp 27"',
    type: "Monitor",
    assignedTo: "Alex Thompson",
    status: "assigned",
  },
  {
    id: "3",
    name: "MacBook Air 13",
    type: "Laptop",
    assignedTo: "Sarah Johnson",
    status: "assigned",
  },
  {
    id: "4",
    name: "Logitech MX Master 3S",
    type: "Mouse",
    assignedTo: "",
    status: "available",
  },
];

const PERMISSIONS_LIST = [
  "read_profiles",
  "write_profiles",
  "delete_profiles",
  "manage_vacations",
  "manage_assets",
  "manage_reviews",
  "admin_access",
];

const TOKEN_STORAGE_KEY = "access";

// Extend session type to include accessToken
interface ExtendedSession {
  accessToken?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export function AdminModule() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isAdmin, isLoading: isCheckingAdmin } = useAdminAccess();

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleData[]>(INITIAL_ROLES);
  const [assets] = useState<AssetData[]>(INITIAL_ASSETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check admin access and redirect if not admin
  useEffect(() => {
    if (isCheckingAdmin) return;

    if (!isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
    }
  }, [isAdmin, isCheckingAdmin, router]);

  // Fetch employees from backend
  useEffect(() => {
    async function loadEmployees() {
      const token = (session as ExtendedSession)?.accessToken;

      if (!token) {
        setEmployeesError("No access token found");
        setIsLoadingEmployees(false);
        return;
      }

      try {
        setIsLoadingEmployees(true);
        setEmployeesError(null);
        const employees = await fetchEmployees({ accessToken: token });
        setUsers(employees);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployeesError(
          error instanceof Error ? error.message : "Failed to load employees"
        );
        toast.error("Failed to load employees");
      } finally {
        setIsLoadingEmployees(false);
      }
    }

    if ((session as ExtendedSession)?.accessToken && isAdmin) {
      loadEmployees();
    }
  }, [session, isAdmin]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const tokenKeys = ["access", "accessToken", "token", "authToken", "jwt"];
    const storedToken =
      tokenKeys
        .map((key) => window.localStorage.getItem(key))
        .find((token) => Boolean(token)) ?? "";

    setAccessToken(storedToken);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditUser = (user: UserData) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)));
      setIsEditDialogOpen(false);
      toast.success("User updated successfully");
    }
  };

  const handleBulkUpdateClick = () => {
    if (!accessToken.trim()) {
      toast.error("Set and save a JWT access token before uploading CSV.");
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploadingCsv(true);

      try {
        const result = await uploadRolePermissionsCsv(file, accessToken.trim());
        toast.success(result.message || "Bulk update completed successfully");
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            toast.error(
              "Authentication required. Please sign in and provide a valid access token."
            );
          } else if (error.status === 403) {
            toast.error("Admin access required for this action.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error("Error processing CSV file");
        }
      } finally {
        event.target.value = "";
        setIsUploadingCsv(false);
      }
    }
  };

  const handleSaveToken = () => {
    const token = accessToken.trim();

    if (!token) {
      toast.error("Enter a valid JWT access token before saving.");
      return;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAccessToken(token);
    toast.success("Access token saved for admin CSV uploads.");
  };

  const handleClearToken = () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAccessToken("");
    toast.success("Saved access token removed.");
  };

  const togglePermission = (roleId: string, permission: string) => {
    setRoles(
      roles.map((r) => {
        if (r.id === roleId) {
          const newPermissions = r.permissions.includes(permission)
            ? r.permissions.filter((p) => p !== permission)
            : [...r.permissions, permission];
          return { ...r, permissions: newPermissions };
        }
        return r;
      })
    );
    toast.success("Permission updated");
  };

  // Show loading state while checking admin access
  if (isCheckingAdmin || isLoadingEmployees) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">
            {isCheckingAdmin
              ? "Verifying admin access..."
              : "Loading employees..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error if not admin
  if (!isAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-sm text-gray-500 max-w-md">
            You don&apos;t have permission to access the admin panel. Only
            administrators can view this page.
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show error if employees failed to load
  if (employeesError && users.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Failed to Load Data</h2>
          <p className="text-sm text-gray-500 max-w-md">{employeesError}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-auto p-1">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Admin Panel
          </h1>
          <p className="text-sm text-gray-500">
            Manage your organization&apos;s users, roles, and settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkUpdateClick}
            className="h-9"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploadingCsv ? "Uploading..." : "Bulk Update (CSV)"}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <Button
            size="sm"
            className="h-9 bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Total {users.length} users in the system
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name ||
                          `${user.first_name} ${user.last_name}`}
                      </TableCell>
                      <TableCell>{user.email || user.email_address}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {user.role_name || `Role ${user.role}`}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.employment_status === "active" ||
                            user.is_active
                              ? "success"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {user.employment_status ||
                            (user.is_active ? "active" : "inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <CardDescription>
                    {role.userCount} users assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Permissions</div>
                    <div className="flex flex-wrap gap-2">
                      {PERMISSIONS_LIST.map((permission) => (
                        <Badge
                          key={permission}
                          variant={
                            role.permissions.includes(permission) ||
                            role.permissions.includes("all")
                              ? "primary"
                              : "outline"
                          }
                          className="cursor-pointer capitalize"
                          onClick={() => togglePermission(role.id, permission)}
                        >
                          {permission.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="flex cursor-pointer items-center justify-center border-dashed border-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900">
              <div className="text-center p-6">
                <Plus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium">Create New Role</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Asset Inventory</CardTitle>
              <CardDescription>
                Manage company equipment and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        {asset.name}
                      </TableCell>
                      <TableCell>{asset.type}</TableCell>
                      <TableCell>{asset.assignedTo || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            asset.status === "available"
                              ? "success"
                              : asset.status === "assigned"
                                ? "primary"
                                : "secondary"
                          }
                        >
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure authentication and access control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">
                      Require 2FA for all admin users
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-gray-500">
                      Auto logout after inactivity
                    </p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 mins</SelectItem>
                      <SelectItem value="30">30 mins</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Access Token</CardTitle>
                <CardDescription>
                  Paste a backend JWT access token used for role permission CSV
                  uploads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="admin-access-token">JWT Access Token</Label>
                <Input
                  id="admin-access-token"
                  type="password"
                  placeholder="Paste access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" onClick={handleSaveToken}>
                    Save Token
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleClearToken}
                  >
                    Clear Token
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  The token is stored in this browser and sent as{" "}
                  <code>Authorization: Bearer ...</code> during upload.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Notifications</CardTitle>
                <CardDescription>
                  Manage how admins receive system alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Critical system events
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-gray-500">
                      Log all administrative actions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and access level.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editingUser.full_name || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      full_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email || editingUser.email_address || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      email: e.target.value,
                      email_address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={editingUser.role_name || ""}
                    onValueChange={(val) =>
                      setEditingUser({ ...editingUser, role_name: val })
                    }
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editingUser.employment_status || ""}
                    onValueChange={(val: "active" | "inactive") =>
                      setEditingUser({ ...editingUser, employment_status: val })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
