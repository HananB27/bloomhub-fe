import { useState, useRef, useCallback } from "react";
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
import {
  FileText,
  Plus,
  Filter,
  Download,
  Upload,
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
  FileIcon,
  Image,
  File,
  PenTool,
  Shield,
  Archive,
  Tag,
  History,
  ChevronDown,
  ExternalLink,
  Copy,
  Share,
  AlertTriangle,
  Users,
  Send,
  Paperclip,
  FolderOpen,
  Lock,
  Unlock,
} from "lucide-react";

type DocumentCategory =
  | "contracts"
  | "policies"
  | "agreements"
  | "compliance"
  | "onboarding"
  | "training"
  | "benefits"
  | "other";
type SignatureStatus =
  | "pending"
  | "signed"
  | "rejected"
  | "expired"
  | "not_required";
type DocumentType = "pdf" | "doc" | "docx" | "txt" | "image" | "other";

interface DocumentVersion {
  id: number;
  version: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  changes: string;
  isActive: boolean;
}

interface Document {
  id: number;
  name: string;
  category: DocumentCategory;
  type: DocumentType;
  description: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  expiryDate?: string;
  signatureStatus: SignatureStatus;
  signedBy?: string[];
  signedAt?: string;
  isConfidential: boolean;
  permissions: string[];
  tags: string[];
  versions: DocumentVersion[];
  currentVersion: string;
}

interface Signature {
  id: number;
  documentId: number;
  signerName: string;
  signerEmail: string;
  signedAt?: string;
  status: SignatureStatus;
  notes?: string;
}

export function DocumentsModule() {
  const [activeTab, setActiveTab] = useState("documents");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isHRUser] = useState(true); // Mock HR permission
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: "",
    category: "" as DocumentCategory,
    description: "",
    expiryDate: "",
    isConfidential: false,
    tags: "",
    file: null as File | null,
  });

  // Mock documents data
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 1,
      name: "Employee Handbook 2025",
      category: "policies",
      type: "pdf",
      description:
        "Updated employee handbook with new policies and procedures for 2025",
      fileName: "employee_handbook_2025.pdf",
      fileSize: "2.4 MB",
      uploadedBy: "Sarah Johnson",
      uploadedAt: "2025-01-15",
      lastModified: "2025-01-15",
      expiryDate: "2025-12-31",
      signatureStatus: "not_required",
      isConfidential: false,
      permissions: ["all_employees"],
      tags: ["policies", "handbook", "2025"],
      versions: [
        {
          id: 1,
          version: "1.0",
          fileName: "employee_handbook_2025.pdf",
          uploadedBy: "Sarah Johnson",
          uploadedAt: "2025-01-15",
          fileSize: "2.4 MB",
          changes: "Initial version for 2025",
          isActive: true,
        },
      ],
      currentVersion: "1.0",
    },
    {
      id: 2,
      name: "Software License Agreement",
      category: "agreements",
      type: "pdf",
      description:
        "Software licensing agreement for development tools and platforms",
      fileName: "software_license_agreement.pdf",
      fileSize: "1.8 MB",
      uploadedBy: "Michael Chen",
      uploadedAt: "2025-07-20",
      lastModified: "2025-07-25",
      expiryDate: "2026-07-20",
      signatureStatus: "pending",
      isConfidential: true,
      permissions: ["hr", "legal", "engineering_leads"],
      tags: ["license", "software", "legal"],
      versions: [
        {
          id: 2,
          version: "2.1",
          fileName: "software_license_agreement_v2.1.pdf",
          uploadedBy: "Legal Team",
          uploadedAt: "2025-07-25",
          fileSize: "1.8 MB",
          changes: "Updated terms and pricing structure",
          isActive: true,
        },
        {
          id: 3,
          version: "2.0",
          fileName: "software_license_agreement_v2.0.pdf",
          uploadedBy: "Michael Chen",
          uploadedAt: "2025-07-20",
          fileSize: "1.7 MB",
          changes: "Major revision with new vendor terms",
          isActive: false,
        },
      ],
      currentVersion: "2.1",
    },
    {
      id: 3,
      name: "NDA Template",
      category: "contracts",
      type: "docx",
      description:
        "Standard non-disclosure agreement template for new hires and contractors",
      fileName: "nda_template.docx",
      fileSize: "156 KB",
      uploadedBy: "Emily Rodriguez",
      uploadedAt: "2025-06-10",
      lastModified: "2025-06-10",
      signatureStatus: "signed",
      signedBy: ["Alex Thompson", "Lisa Wong", "David Kim"],
      signedAt: "2025-06-15",
      isConfidential: true,
      permissions: ["hr", "legal"],
      tags: ["nda", "confidentiality", "template"],
      versions: [
        {
          id: 4,
          version: "1.2",
          fileName: "nda_template_v1.2.docx",
          uploadedBy: "Emily Rodriguez",
          uploadedAt: "2025-06-10",
          fileSize: "156 KB",
          changes: "Updated clauses for remote work",
          isActive: true,
        },
      ],
      currentVersion: "1.2",
    },
    {
      id: 4,
      name: "Benefits Overview 2025",
      category: "benefits",
      type: "pdf",
      description:
        "Comprehensive overview of employee benefits including health, dental, and retirement plans",
      fileName: "benefits_overview_2025.pdf",
      fileSize: "3.2 MB",
      uploadedBy: "HR Department",
      uploadedAt: "2025-01-01",
      lastModified: "2025-03-15",
      expiryDate: "2025-12-31",
      signatureStatus: "not_required",
      isConfidential: false,
      permissions: ["all_employees"],
      tags: ["benefits", "health", "retirement"],
      versions: [
        {
          id: 5,
          version: "1.1",
          fileName: "benefits_overview_2025_v1.1.pdf",
          uploadedBy: "HR Department",
          uploadedAt: "2025-03-15",
          fileSize: "3.2 MB",
          changes: "Updated dental plan options",
          isActive: true,
        },
      ],
      currentVersion: "1.1",
    },
    {
      id: 5,
      name: "Code of Conduct",
      category: "compliance",
      type: "pdf",
      description: "Company code of conduct and ethics policy",
      fileName: "code_of_conduct.pdf",
      fileSize: "1.1 MB",
      uploadedBy: "Legal Team",
      uploadedAt: "2024-12-01",
      lastModified: "2024-12-01",
      expiryDate: "2026-12-01",
      signatureStatus: "expired",
      isConfidential: false,
      permissions: ["all_employees"],
      tags: ["ethics", "conduct", "compliance"],
      versions: [
        {
          id: 6,
          version: "3.0",
          fileName: "code_of_conduct_v3.0.pdf",
          uploadedBy: "Legal Team",
          uploadedAt: "2024-12-01",
          fileSize: "1.1 MB",
          changes: "Annual review and updates",
          isActive: true,
        },
      ],
      currentVersion: "3.0",
    },
  ]);

  // Mock signatures data
  const [signatures, setSignatures] = useState<Signature[]>([
    {
      id: 1,
      documentId: 2,
      signerName: "Alex Thompson",
      signerEmail: "alex@bloomteq.com",
      status: "pending",
      notes: "Awaiting signature from Engineering Lead",
    },
    {
      id: 2,
      documentId: 2,
      signerName: "Sarah Johnson",
      signerEmail: "sarah@bloomteq.com",
      status: "signed",
      signedAt: "2025-07-25T14:30:00Z",
    },
    {
      id: 3,
      documentId: 3,
      signerName: "Alex Thompson",
      signerEmail: "alex@bloomteq.com",
      status: "signed",
      signedAt: "2025-06-15T10:15:00Z",
    },
  ]);

  const categories: { value: DocumentCategory; label: string }[] = [
    { value: "contracts", label: "Contracts" },
    { value: "policies", label: "Policies" },
    { value: "agreements", label: "Agreements" },
    { value: "compliance", label: "Compliance" },
    { value: "onboarding", label: "Onboarding" },
    { value: "training", label: "Training" },
    { value: "benefits", label: "Benefits" },
    { value: "other", label: "Other" },
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      categoryFilter === "all" || doc.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || doc.signatureStatus === statusFilter;

    let matchesExpiry = true;
    if (expiryFilter === "expiring_soon" && doc.expiryDate) {
      const expiryDate = new Date(doc.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      matchesExpiry = expiryDate <= thirtyDaysFromNow;
    } else if (expiryFilter === "expired" && doc.expiryDate) {
      const expiryDate = new Date(doc.expiryDate);
      matchesExpiry = expiryDate < new Date();
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesExpiry;
  });

  const getStatusColor = (status: SignatureStatus) => {
    switch (status) {
      case "signed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-slate-100 text-slate-800";
      case "not_required":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: SignatureStatus) => {
    switch (status) {
      case "signed":
        return CheckCircle;
      case "pending":
        return Clock;
      case "rejected":
        return XCircle;
      case "expired":
        return AlertTriangle;
      case "not_required":
        return FileText;
      default:
        return FileIcon;
    }
  };

  const getCategoryColor = (category: DocumentCategory) => {
    switch (category) {
      case "contracts":
        return "bg-purple-100 text-purple-800";
      case "policies":
        return "bg-blue-100 text-blue-800";
      case "agreements":
        return "bg-green-100 text-green-800";
      case "compliance":
        return "bg-red-100 text-red-800";
      case "onboarding":
        return "bg-amber-100 text-amber-800";
      case "training":
        return "bg-indigo-100 text-indigo-800";
      case "benefits":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getFileIcon = (type: DocumentType) => {
    switch (type) {
      case "pdf":
        return FileText;
      case "doc":
      case "docx":
        return FileIcon;
      case "image":
        return Image;
      default:
        return File;
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setUploadForm((prev) => ({
        ...prev,
        file,
        name: file.name.split(".")[0],
      }));
      setIsUploadDialogOpen(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm((prev) => ({
        ...prev,
        file,
        name: file.name.split(".")[0],
      }));
      setIsUploadDialogOpen(true);
    }
  };

  const uploadDocument = () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.category) return;

    const newDocument: Document = {
      id: Date.now(),
      name: uploadForm.name,
      category: uploadForm.category,
      type:
        (uploadForm.file.name
          .split(".")
          .pop()
          ?.toLowerCase() as DocumentType) || "other",
      description: uploadForm.description,
      fileName: uploadForm.file.name,
      fileSize: `${(uploadForm.file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedBy: "John Doe", // Current user
      uploadedAt: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
      expiryDate: uploadForm.expiryDate || undefined,
      signatureStatus: "not_required",
      isConfidential: uploadForm.isConfidential,
      permissions: uploadForm.isConfidential ? ["hr"] : ["all_employees"],
      tags: uploadForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      versions: [
        {
          id: Date.now() + 1,
          version: "1.0",
          fileName: uploadForm.file.name,
          uploadedBy: "John Doe",
          uploadedAt: new Date().toISOString().split("T")[0],
          fileSize: `${(uploadForm.file.size / 1024 / 1024).toFixed(1)} MB`,
          changes: "Initial upload",
          isActive: true,
        },
      ],
      currentVersion: "1.0",
    };

    setDocuments((prev) => [newDocument, ...prev]);

    // Reset form and close dialog
    setUploadForm({
      name: "",
      category: "" as DocumentCategory,
      description: "",
      expiryDate: "",
      isConfidential: false,
      tags: "",
      file: null,
    });
    setIsUploadDialogOpen(false);
  };

  const deleteDocument = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const updateSignatureStatus = (
    documentId: number,
    newStatus: SignatureStatus
  ) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              signatureStatus: newStatus,
              signedAt:
                newStatus === "signed" ? new Date().toISOString() : undefined,
            }
          : doc
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpiringNext30Days = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Documents & Agreements
            </h1>
            <p className="text-slate-600 mt-1">
              Manage company documents, contracts, and signature workflows
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
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Total Documents</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {documents.length}
            </p>
            <p className="text-xs text-slate-500">All categories</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Pending Signatures</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {
                documents.filter((doc) => doc.signatureStatus === "pending")
                  .length
              }
            </p>
            <p className="text-xs text-slate-500">Require attention</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Expiring Soon</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {
                documents.filter((doc) => isExpiringNext30Days(doc.expiryDate))
                  .length
              }
            </p>
            <p className="text-xs text-slate-500">Next 30 days</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Confidential</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {documents.filter((doc) => doc.isConfidential).length}
            </p>
            <p className="text-xs text-slate-500">Restricted access</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="signatures">Signatures</TabsTrigger>
                  <TabsTrigger value="upload">Upload Zone</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="documents" className="space-y-6 mt-0">
                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search documents..."
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
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="not_required">
                          No Signature
                        </SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={expiryFilter}
                      onValueChange={setExpiryFilter}
                    >
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder="Expiry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="expiring_soon">
                          Expiring Soon
                        </SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Documents Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Document</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Modified</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead>Signature Status</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocuments.map((document) => {
                          const FileIcon = getFileIcon(document.type);
                          const StatusIcon = getStatusIcon(
                            document.signatureStatus
                          );

                          return (
                            <TableRow
                              key={document.id}
                              className="hover:bg-slate-50"
                            >
                              <TableCell>
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileIcon className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-slate-900">
                                        {document.name}
                                      </p>
                                      {document.isConfidential && (
                                        <Lock className="w-3 h-3 text-amber-600" />
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                      {document.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-slate-400">
                                        {document.fileSize}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        •
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        by {document.uploadedBy}
                                      </span>
                                    </div>
                                    {document.tags.length > 0 && (
                                      <div className="flex gap-1 mt-1">
                                        {document.tags
                                          .slice(0, 2)
                                          .map((tag) => (
                                            <Badge
                                              key={tag}
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {tag}
                                            </Badge>
                                          ))}
                                        {document.tags.length > 2 && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            +{document.tags.length - 2}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getCategoryColor(
                                    document.category
                                  )}
                                >
                                  {
                                    categories.find(
                                      (c) => c.value === document.category
                                    )?.label
                                  }
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm text-slate-900">
                                    {formatDate(document.lastModified)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Uploaded {formatDate(document.uploadedAt)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {document.expiryDate ? (
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`text-sm ${
                                        isExpired(document.expiryDate)
                                          ? "text-red-600"
                                          : isExpiringNext30Days(
                                                document.expiryDate
                                              )
                                            ? "text-amber-600"
                                            : "text-slate-900"
                                      }`}
                                    >
                                      {formatDate(document.expiryDate)}
                                    </span>
                                    {(isExpired(document.expiryDate) ||
                                      isExpiringNext30Days(
                                        document.expiryDate
                                      )) && (
                                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-400">
                                    No expiry
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(
                                    document.signatureStatus
                                  )}
                                >
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {document.signatureStatus.replace("_", " ")}
                                </Badge>
                                {document.signedBy &&
                                  document.signedBy.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      {document.signedBy.length} signers
                                    </p>
                                  )}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 gap-1"
                                    >
                                      <History className="w-3 h-3" />v
                                      {document.currentVersion}
                                      <ChevronDown className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-64"
                                  >
                                    <DropdownMenuLabel>
                                      Version History
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {document.versions.map((version) => (
                                      <DropdownMenuItem
                                        key={version.id}
                                        className="flex-col items-start p-3"
                                      >
                                        <div className="flex items-center gap-2 w-full mb-1">
                                          <span className="font-medium">
                                            v{version.version}
                                          </span>
                                          {version.isActive && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Current
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500 mb-1">
                                          {version.changes}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                          <span>
                                            {formatDate(version.uploadedAt)}
                                          </span>
                                          <span>•</span>
                                          <span>{version.uploadedBy}</span>
                                          <span>•</span>
                                          <span>{version.fileSize}</span>
                                        </div>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Share className="w-4 h-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy Link
                                    </DropdownMenuItem>
                                    {document.signatureStatus === "pending" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() =>
                                            updateSignatureStatus(
                                              document.id,
                                              "signed"
                                            )
                                          }
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Mark as Signed
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {isHRUser && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                          <Edit3 className="w-4 h-4 mr-2" />
                                          Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() =>
                                            deleteDocument(document.id)
                                          }
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
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

                  {filteredDocuments.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">
                        No documents found
                      </h3>
                      <p className="text-slate-600">
                        Try adjusting your search criteria or upload a new
                        document.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="signatures" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">
                      Signature Tracking
                    </h3>

                    {/* Pending Signatures */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">
                        Pending Signatures
                      </h4>
                      {signatures
                        .filter((sig) => sig.status === "pending")
                        .map((signature) => {
                          const document = documents.find(
                            (doc) => doc.id === signature.documentId
                          );

                          return (
                            <Card
                              key={signature.id}
                              className="border-amber-200 bg-amber-50"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-slate-900">
                                      {document?.name}
                                    </h4>
                                    <p className="text-sm text-slate-600 mb-2">
                                      Awaiting signature from{" "}
                                      {signature.signerName}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                      <span>{signature.signerEmail}</span>
                                      {signature.notes && (
                                        <>
                                          <span>•</span>
                                          <span>{signature.notes}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      <Send className="w-4 h-4 mr-2" />
                                      Reminder
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <PenTool className="w-4 h-4 mr-2" />
                                      Sign Now
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>

                    {/* Recent Signatures */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">
                        Recent Signatures
                      </h4>
                      {signatures
                        .filter((sig) => sig.status === "signed")
                        .map((signature) => {
                          const document = documents.find(
                            (doc) => doc.id === signature.documentId
                          );

                          return (
                            <div
                              key={signature.id}
                              className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {document?.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Signed by {signature.signerName} on{" "}
                                    {signature.signedAt
                                      ? formatDate(signature.signedAt)
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-6 mt-0">
                  {/* Drag and Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Drop files here to upload
                    </h3>
                    <p className="text-slate-600 mb-4">
                      or click to browse your computer
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    />

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Select Files
                    </Button>

                    <p className="text-xs text-slate-500 mt-4">
                      Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG (max
                      50MB)
                    </p>
                  </div>

                  {/* Recent Uploads */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">
                      Recent Uploads
                    </h3>
                    <div className="space-y-2">
                      {documents.slice(0, 5).map((document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {document.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {document.fileSize} • Uploaded{" "}
                                {formatDate(document.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={getStatusColor(document.signatureStatus)}
                          >
                            {document.signatureStatus.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <PenTool className="w-4 h-4" />
                Request Signature
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <FolderOpen className="w-4 h-4" />
                Browse Templates
              </Button>
              {isHRUser && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Compliance Check
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archive Old Docs
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Categories Overview */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map((category) => {
                const count = documents.filter(
                  (doc) => doc.category === category.value
                ).length;
                return (
                  <div
                    key={category.value}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-700">
                      {category.label}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
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
                    Documents Expiring
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {
                      documents.filter((doc) =>
                        isExpiringNext30Days(doc.expiryDate)
                      ).length
                    }{" "}
                    documents expire in the next 30 days
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">Document signed</p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">
                      New document uploaded
                    </p>
                    <p className="text-xs text-slate-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">
                      Signature reminder sent
                    </p>
                    <p className="text-xs text-slate-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to the system with proper categorization and
              metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Preview */}
            {uploadForm.file && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {uploadForm.file.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {(uploadForm.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Document Name *</Label>
                  <Input
                    id="doc-name"
                    value={uploadForm.name}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter document name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-category">Category *</Label>
                  <Select
                    value={uploadForm.category}
                    onValueChange={(value) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        category: value as DocumentCategory,
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

              <div className="space-y-2">
                <Label htmlFor="doc-description">Description</Label>
                <Textarea
                  id="doc-description"
                  placeholder="Brief description of the document..."
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-expiry">Expiry Date</Label>
                  <Input
                    id="doc-expiry"
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-tags">Tags</Label>
                  <Input
                    id="doc-tags"
                    placeholder="tag1, tag2, tag3"
                    value={uploadForm.tags}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        tags: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confidential"
                  checked={uploadForm.isConfidential}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      isConfidential: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300"
                />
                <Label
                  htmlFor="confidential"
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Mark as confidential (restricted access)
                </Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={uploadDocument}
                disabled={
                  !uploadForm.file || !uploadForm.name || !uploadForm.category
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
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
