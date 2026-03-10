import { useState } from "react";
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
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Checkbox } from "./ui/checkbox";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Package,
  Plus,
  Filter,
  Download,
  Search,
  Calendar,
  User,
  Clock,
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
  Users,
  TrendingUp,
  AlertTriangle,
  Shield,
  FileText,
  QrCode,
  Barcode,
  Settings,
  History,
  ArrowRight,
  Building,
  UserCheck,
  Package2,
  Zap,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/utils";
import type { LucideIcon } from "lucide-react";

type AssetStatus =
  | "active"
  | "available"
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
}

interface Assignment {
  id: number;
  assetId: number;
  employeeId: string;
  employeeName: string;
  assignedDate: string;
  returnedDate?: string;
  assignedBy: string;
  notes: string;
  condition: AssetCondition;
  isActive: boolean;
}

interface ReturnChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
  notes?: string;
}

export function AssetsModule() {
  const [activeTab, setActiveTab] = useState("assets");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [isHRUser] = useState(true); // Mock HR permission

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

  // TODO: Implement - fetch assets from API
  const [assets, setAssets] = useState<Asset[]>([]);

  // TODO: Implement - fetch assignment history from API
  const [assignments, setAssignments] = useState<Assignment[]>([]);

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
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || asset.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || asset.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const assignAsset = (
    assetId: number,
    employeeId: string,
    employeeName: string
  ) => {
    const newAssignment: Assignment = {
      id: Date.now(),
      assetId,
      employeeId,
      employeeName,
      assignedDate: new Date().toISOString().split("T")[0],
      assignedBy: "John Doe", // Current user
      notes: "Asset assigned",
      condition: "good",
      isActive: true,
    };

    setAssignments((prev) => [...prev, newAssignment]);
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              status: "active",
              assignedTo: employeeId,
              assignedEmployeeName: employeeName,
              assignedDate: new Date().toISOString().split("T")[0],
            }
          : asset
      )
    );
  };

  const returnAsset = () => {
    if (!selectedAsset) return;

    const allRequiredChecked = returnChecklist
      .filter((item) => item.required)
      .every((item) => item.checked);

    if (!allRequiredChecked) {
      alert(
        "Please complete all required checklist items before returning the asset."
      );
      return;
    }

    // Update assignment to mark as returned
    setAssignments((prev) =>
      prev.map((assignment) =>
        assignment.assetId === selectedAsset.id && assignment.isActive
          ? {
              ...assignment,
              returnedDate: new Date().toISOString().split("T")[0],
              isActive: false,
              notes:
                assignment.notes +
                (returnNotes ? ` | Return notes: ${returnNotes}` : ""),
            }
          : assignment
      )
    );

    // Update asset status
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === selectedAsset.id
          ? {
              ...asset,
              status: "available",
              assignedTo: undefined,
              assignedEmployeeName: undefined,
              assignedDate: undefined,
              location: "IT Storage Room",
            }
          : asset
      )
    );

    // Reset form and close dialog
    setReturnChecklist((prev) =>
      prev.map((item) => ({ ...item, checked: false, notes: "" }))
    );
    setReturnNotes("");
    setIsReturnDialogOpen(false);
    setSelectedAsset(null);
  };

  const addNewAsset = () => {
    if (!newAsset.name || !newAsset.category || !newAsset.serialNumber) return;

    const asset: Asset = {
      id: Date.now(),
      name: newAsset.name,
      category: newAsset.category,
      serialNumber: newAsset.serialNumber,
      assetTag: newAsset.assetTag || `AT-${Date.now()}`,
      brand: newAsset.brand,
      model: newAsset.model,
      description: newAsset.description,
      image:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
      purchaseDate: newAsset.purchaseDate,
      purchasePrice: parseFloat(newAsset.purchasePrice) || 0,
      warranty: newAsset.warranty,
      status: "available",
      condition: "excellent",
      location: newAsset.location || "IT Storage Room",
      specifications: newAsset.specifications
        ? JSON.parse(newAsset.specifications)
        : {},
    };

    setAssets((prev) => [asset, ...prev]);

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

  const updateAssetStatus = (assetId: number, newStatus: AssetStatus) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId ? { ...asset, status: newStatus } : asset
      )
    );
  };

  const deleteAsset = (assetId: number) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    setAssignments((prev) =>
      prev.filter((assignment) => assignment.assetId !== assetId)
    );
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
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
            {isHRUser && (
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
      </div>

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
                  <div className="flex flex-col md:flex-row gap-4">
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
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Asset Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssets.map((asset) => {
                      const StatusIcon = getStatusIcon(asset.status);
                      const CategoryIcon = getCategoryIcon(asset.category);

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

                                {asset.assignedTo && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Assigned to:
                                    </span>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {asset.assignedEmployeeName}
                                    </span>
                                  </div>
                                )}

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
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                {asset.status === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setIsReturnDialogOpen(true);
                                    }}
                                  >
                                    Return
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Edit3 className="w-4 h-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    {asset.status === "available" && (
                                      <DropdownMenuItem>
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
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => deleteAsset(asset.id)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Asset
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
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
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Assignment History
                    </h3>

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
                          {assignments.map((assignment) => {
                            const asset = assets.find(
                              (a) => a.id === assignment.assetId
                            );
                            const duration = assignment.returnedDate
                              ? Math.ceil(
                                  (new Date(assignment.returnedDate).getTime() -
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
                                        {asset?.name}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {asset?.assetTag}
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
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Assignment Form
                                      </DropdownMenuItem>
                                      {assignment.isActive && (
                                        <DropdownMenuItem>
                                          <RefreshCw className="w-4 h-4 mr-2" />
                                          Process Return
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

                    {assignments.length === 0 && (
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

                    {assets.filter((asset) => asset.nextMaintenance).length ===
                      0 && (
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
              />
              <QuickActionButton
                label="Scan QR Code"
                icon={QrCode}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Assign Asset"
                icon={UserCheck}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Schedule Maintenance"
                icon={Wrench}
                onClick={() => {}}
              />
              {isHRUser && (
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
                          asset.status === "lost" || asset.status === "damaged"
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

      {/* Return Checklist Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Asset - {selectedAsset?.name}</DialogTitle>
            <DialogDescription>
              Complete the return checklist to process the asset return for{" "}
              {selectedAsset?.assignedEmployeeName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Asset Info */}
            {selectedAsset && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={selectedAsset.image}
                    alt={selectedAsset.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedAsset.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedAsset.assetTag} • {selectedAsset.serialNumber}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Assigned to {selectedAsset.assignedEmployeeName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Return Checklist */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Return Checklist
              </h4>
              <div className="space-y-3">
                {returnChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
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
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                          className="mt-2"
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
              <Label htmlFor="return-notes">Additional Return Notes</Label>
              <Textarea
                id="return-notes"
                placeholder="Any additional notes about the asset condition or return process..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
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
                onClick={returnAsset}
                variant="primary"
                disabled={
                  !returnChecklist
                    .filter((item) => item.required)
                    .every((item) => item.checked)
                }
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Return
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
        <DialogContent className="max-w-2xl">
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  value={newAsset.purchaseDate}
                  onChange={(e) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      purchaseDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase-price">Purchase Price</Label>
                <Input
                  id="purchase-price"
                  type="number"
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
              <div className="space-y-2">
                <Label htmlFor="warranty">Warranty Until</Label>
                <Input
                  id="warranty"
                  type="date"
                  value={newAsset.warranty}
                  onChange={(e) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      warranty: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
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
                onClick={addNewAsset}
                disabled={
                  !newAsset.name || !newAsset.category || !newAsset.serialNumber
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
    </div>
  );
}
