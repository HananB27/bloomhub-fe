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
  Building,
  Users,
  Shield,
  Package,
  Settings,
  Search,
  Plus,
  Edit,
  Upload,
  Trash2,
  Loader2,
  Briefcase,
  Wallet,
  X,
} from "lucide-react";
import { AdminDepartmentsTab } from "./AdminDepartmentsTab";
import { AdminCompensationTab } from "./admin/AdminCompensationTab";
import { DiscordAnnouncementChannelsTab } from "./admin/DiscordAnnouncementChannelsTab";
import { toast } from "sonner";
import { ApiError, uploadRolePermissionsCsv } from "@/utils/api";
import { fetchEmployees, type Employee } from "@/lib/api/employees";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  addProjectClient,
  getProjectClients,
  getProjectDefaults,
  removeProjectClient,
  renameProjectClient,
  setProjectDefaults,
  type ProjectAdminDefaults,
} from "@/lib/projects/adminSettings";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  department: string;
}

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

export const PERMISSIONS_LIST = [
  "read_profiles",
  "write_profiles",
  "delete_profiles",
  "manage_vacations",
  "manage_assets",
  "manage_reviews",
  "admin_access",
];

const TOKEN_STORAGE_KEY = "access";

function getInitialAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const tokenKeys = ["access", "accessToken", "token", "authToken", "jwt"];
  return (
    tokenKeys
      .map((key) => window.localStorage.getItem(key))
      .find((token) => Boolean(token)) ?? ""
  );
}

function mapEmployeeToUserData(employee: Employee): UserData {
  return {
    id: employee.employee_id || String(employee.id),
    name:
      employee.full_name?.trim() ||
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      employee.username,
    email: employee.email || employee.email_address || "",
    role: employee.role_name || String(employee.role || ""),
    status:
      employee.employment_status ||
      (employee.is_active ? "active" : "inactive"),
    department: employee.department || "Unassigned",
  };
}

export function AdminModule() {
  const router = useRouter();
  const { data: session } = useSession();
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
  const [accessToken, setAccessToken] = useState(getInitialAccessToken);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check admin access and redirect if not admin
  useEffect(() => {
    if (isCheckingAdmin) return;

    if (!isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
    }
  }, [isAdmin, isCheckingAdmin, router]);

  useEffect(() => {
    const token = (session as { accessToken?: string } | null)?.accessToken;

    if (!isAdmin) return;

    if (!token) {
      setUsers([]);
      setEmployeesError("No access token found");
      setIsLoadingEmployees(false);
      return;
    }

    let isMounted = true;

    const loadEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        setEmployeesError(null);
        const employees = await fetchEmployees({ accessToken: token });
        if (!isMounted) return;
        setUsers(employees.map(mapEmployeeToUserData));
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : "Failed to load employees";
        setUsers([]);
        setEmployeesError(message);
        toast.error("Failed to load employees");
      } finally {
        if (isMounted) {
          setIsLoadingEmployees(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, session]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
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
  if (isCheckingAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You do not have permission to access the Admin Panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
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
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="compensation" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Compensation
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
              {isLoadingEmployees ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : employeesError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {employeesError}
                </div>
              ) : (
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
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "active" ? "success" : "secondary"
                            }
                            className="capitalize"
                          >
                            {user.status}
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
              )}
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

        <TabsContent value="projects">
          <ProjectsAdminTab />
        </TabsContent>

        <TabsContent value="compensation">
          <AdminCompensationTab />
        </TabsContent>

        <TabsContent value="departments">
          <AdminDepartmentsTab />
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

            <DiscordAnnouncementChannelsTab />
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
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(val) =>
                      setEditingUser({ ...editingUser, role: val })
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
                    value={editingUser.status}
                    onValueChange={(val: "active" | "inactive") =>
                      setEditingUser({ ...editingUser, status: val })
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

function ProjectsAdminTab() {
  const [clients, setClients] = useState<string[]>([]);
  const [defaults, setDefaults] = useState<ProjectAdminDefaults>({
    default_status: "active",
    default_project_type: "client",
    default_app_stack: "",
    require_lead: true,
  });
  const [newClient, setNewClient] = useState("");
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState("");

  useEffect(() => {
    setClients(getProjectClients());
    setDefaults(getProjectDefaults());
  }, []);

  const handleAddClient = () => {
    const trimmed = newClient.trim();
    if (!trimmed) return;
    if (clients.includes(trimmed)) {
      toast.error("Client already exists");
      return;
    }
    setClients(addProjectClient(trimmed));
    setNewClient("");
    toast.success(`Added client "${trimmed}"`);
  };

  const handleRemoveClient = (name: string) => {
    setClients(removeProjectClient(name));
    toast.success(`Removed client "${name}"`);
  };

  const handleStartEdit = (name: string) => {
    setEditingClient(name);
    setEditClientName(name);
  };

  const handleSaveEdit = () => {
    if (!editingClient) return;
    const trimmed = editClientName.trim();
    if (!trimmed || trimmed === editingClient) {
      setEditingClient(null);
      return;
    }
    setClients(renameProjectClient(editingClient, trimmed));
    setEditingClient(null);
    toast.success("Client renamed");
  };

  const updateDefault = <K extends keyof ProjectAdminDefaults>(
    key: K,
    value: ProjectAdminDefaults[K]
  ) => {
    const next = { ...defaults, [key]: value };
    setDefaults(next);
    setProjectDefaults(next);
    toast.success("Project defaults saved");
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project Clients</CardTitle>
          <CardDescription>
            Manage the client list shown in the project create dialog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="admin-new-client">Add client</Label>
              <Input
                id="admin-new-client"
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="e.g. Globex Industries"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddClient();
                  }
                }}
              />
            </div>
            <Button onClick={handleAddClient} disabled={!newClient.trim()}>
              <Plus className="mr-1.5 h-4 w-4" /> Add
            </Button>
          </div>
          <Separator />
          {clients.length === 0 ? (
            <p className="text-sm text-gray-500">No clients yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {clients.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
                  {editingClient === name ? (
                    <>
                      <Input
                        value={editClientName}
                        onChange={(e) => setEditClientName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEdit();
                          } else if (e.key === "Escape") {
                            setEditingClient(null);
                          }
                        }}
                        autoFocus
                        className="h-8 flex-1"
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingClient(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm text-gray-900">
                        {name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(name)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleRemoveClient(name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Defaults</CardTitle>
          <CardDescription>
            Defaults applied when creating a new project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label>Default status</Label>
              <p className="text-sm text-gray-500">
                Starting status for new projects
              </p>
            </div>
            <Select
              value={defaults.default_status}
              onValueChange={(v) =>
                updateDefault(
                  "default_status",
                  v as ProjectAdminDefaults["default_status"]
                )
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label>Default project type</Label>
              <p className="text-sm text-gray-500">Client or Internal</p>
            </div>
            <Select
              value={defaults.default_project_type}
              onValueChange={(v) =>
                updateDefault(
                  "default_project_type",
                  v as ProjectAdminDefaults["default_project_type"]
                )
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="admin-default-stack">Default app stack</Label>
            <p className="text-sm text-gray-500">
              Pre-fills the technologies field on new projects (comma
              separated).
            </p>
            <Input
              id="admin-default-stack"
              value={defaults.default_app_stack}
              onChange={(e) =>
                setDefaults((d) => ({
                  ...d,
                  default_app_stack: e.target.value,
                }))
              }
              onBlur={() =>
                updateDefault("default_app_stack", defaults.default_app_stack)
              }
              placeholder="React, Django, PostgreSQL"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label>Require project lead</Label>
              <p className="text-sm text-gray-500">
                Block project creation unless a lead is selected
              </p>
            </div>
            <Switch
              checked={defaults.require_lead}
              onCheckedChange={(checked) =>
                updateDefault("require_lead", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
