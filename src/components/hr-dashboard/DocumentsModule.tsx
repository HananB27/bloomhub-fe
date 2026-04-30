"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
  FileText,
  Download,
  Upload,
  Search,
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  Archive,
  ChevronDown,
  ChevronRight,
  History,
  Send,
  Lock,
  X,
  FolderOpen,
  AlertTriangle,
  PenTool,
  MoreVertical,
  Share,
} from "lucide-react";
import { formatDate } from "@/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

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

type FileType = "pdf" | "doc" | "img" | "file";

type SortKey = "modified" | "expiry" | "category";

type ExpiryBucket = "ok" | "soon" | "expired" | "none";

interface Signer {
  name: string;
  email: string;
  status: "signed" | "pending" | "notsent";
}

interface Document {
  id: number;
  name: string;
  category: DocumentCategory;
  fileType: FileType;
  description: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  expiryDate?: string | null;
  signatureStatus: SignatureStatus;
  isConfidential: boolean;
  allowedRoles: string[];
  tags: string[];
  currentVersion: string;
  versionCount: number;
  signers: Signer[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "contracts", label: "Contracts" },
  { value: "policies", label: "Policies" },
  { value: "agreements", label: "Agreements" },
  { value: "compliance", label: "Compliance" },
  { value: "onboarding", label: "Onboarding" },
  { value: "training", label: "Training" },
  { value: "benefits", label: "Benefits" },
  { value: "other", label: "Other" },
];

const CAT_COLORS: Record<DocumentCategory, string> = {
  contracts: "bg-purple-100 text-purple-800",
  policies: "bg-blue-100 text-blue-800",
  agreements: "bg-green-100 text-green-800",
  compliance: "bg-red-100 text-red-800",
  onboarding: "bg-orange-100 text-orange-800",
  training: "bg-indigo-100 text-indigo-800",
  benefits: "bg-emerald-100 text-emerald-800",
  other: "bg-gray-100 text-gray-700",
};

const today = new Date("2026-04-30");

function daysFromNow(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

const MOCK_DOCS: Document[] = [
  {
    id: 1,
    name: "Employment Agreement — Hanan Bajramović",
    description: "Full-time engineering role, signed counterparts",
    category: "contracts",
    fileType: "pdf",
    fileName: "employment-agreement-hanan.pdf",
    fileSize: "1.2 MB",
    uploadedBy: "Aida Salihović",
    uploadedAt: daysFromNow(-148),
    lastModified: daysFromNow(-12),
    expiryDate: daysFromNow(580),
    signatureStatus: "signed",
    signers: [
      {
        name: "Hanan Bajramović",
        email: "hanan@bloomteq.com",
        status: "signed",
      },
      { name: "Aida Salihović", email: "aida@bloomteq.com", status: "signed" },
    ],
    isConfidential: true,
    allowedRoles: ["hr", "admin"],
    tags: ["fte", "2026", "sarajevo"],
    currentVersion: "2.1",
    versionCount: 3,
  },
  {
    id: 2,
    name: "Information Security Policy",
    description: "Annual policy update — review required",
    category: "policies",
    fileType: "pdf",
    fileName: "infosec-policy-2026.pdf",
    fileSize: "420 KB",
    uploadedBy: "IT Compliance",
    uploadedAt: daysFromNow(-22),
    lastModified: daysFromNow(-3),
    expiryDate: daysFromNow(7),
    signatureStatus: "pending",
    signers: [
      {
        name: "Tarik Mujanović",
        email: "tarik@bloomteq.com",
        status: "signed",
      },
      { name: "Asmin Bašić", email: "asmin@bloomteq.com", status: "pending" },
      { name: "Ahmed Burić", email: "ahmed@bloomteq.com", status: "pending" },
      {
        name: "Hanan Bajramović",
        email: "hanan@bloomteq.com",
        status: "signed",
      },
    ],
    isConfidential: false,
    allowedRoles: ["employee"],
    tags: ["annual", "all-staff"],
    currentVersion: "5.0",
    versionCount: 5,
  },
  {
    id: 3,
    name: "NDA — Project Atlas",
    description: "Mutual NDA with external partner",
    category: "agreements",
    fileType: "pdf",
    fileName: "nda-atlas.pdf",
    fileSize: "180 KB",
    uploadedBy: "Hanan Bajramović",
    uploadedAt: daysFromNow(-3),
    lastModified: daysFromNow(-3),
    expiryDate: daysFromNow(365),
    signatureStatus: "pending",
    signers: [
      {
        name: "Hanan Bajramović",
        email: "hanan@bloomteq.com",
        status: "signed",
      },
      { name: "External Counsel", email: "legal@atlas.io", status: "notsent" },
    ],
    isConfidential: true,
    allowedRoles: ["hr", "admin", "manager"],
    tags: ["nda", "external"],
    currentVersion: "1.0",
    versionCount: 1,
  },
  {
    id: 4,
    name: "GDPR Data Processing Addendum",
    description: "EU data processing terms — expires soon",
    category: "compliance",
    fileType: "pdf",
    fileName: "gdpr-dpa.pdf",
    fileSize: "640 KB",
    uploadedBy: "Aida Salihović",
    uploadedAt: daysFromNow(-340),
    lastModified: daysFromNow(-90),
    expiryDate: daysFromNow(-4),
    signatureStatus: "signed",
    signers: [
      { name: "Aida Salihović", email: "aida@bloomteq.com", status: "signed" },
    ],
    isConfidential: false,
    allowedRoles: ["employee"],
    tags: ["gdpr", "compliance"],
    currentVersion: "1.2",
    versionCount: 2,
  },
  {
    id: 5,
    name: "Onboarding Handbook 2026",
    description: "New-hire welcome packet — Q1/Q2 cohort",
    category: "onboarding",
    fileType: "doc",
    fileName: "onboarding-2026.docx",
    fileSize: "2.4 MB",
    uploadedBy: "Aida Salihović",
    uploadedAt: daysFromNow(-30),
    lastModified: daysFromNow(-8),
    expiryDate: null,
    signatureStatus: "not_required",
    signers: [],
    isConfidential: false,
    allowedRoles: ["employee"],
    tags: ["handbook", "newhires"],
    currentVersion: "3.0",
    versionCount: 3,
  },
  {
    id: 6,
    name: "AWS Certified Solutions Architect — Tarik",
    description: "Certificate of completion",
    category: "training",
    fileType: "pdf",
    fileName: "aws-csa-tarik.pdf",
    fileSize: "320 KB",
    uploadedBy: "Tarik Mujanović",
    uploadedAt: daysFromNow(-60),
    lastModified: daysFromNow(-60),
    expiryDate: daysFromNow(700),
    signatureStatus: "not_required",
    signers: [],
    isConfidential: false,
    allowedRoles: ["employee"],
    tags: ["aws", "cert"],
    currentVersion: "1.0",
    versionCount: 1,
  },
  {
    id: 7,
    name: "Salary Adjustment — Q1 2026",
    description: "Compensation review outcomes",
    category: "contracts",
    fileType: "pdf",
    fileName: "salary-q1-2026.pdf",
    fileSize: "95 KB",
    uploadedBy: "Aida Salihović",
    uploadedAt: daysFromNow(-45),
    lastModified: daysFromNow(-45),
    expiryDate: null,
    signatureStatus: "signed",
    signers: [
      { name: "Aida Salihović", email: "aida@bloomteq.com", status: "signed" },
    ],
    isConfidential: true,
    allowedRoles: ["hr", "admin"],
    tags: ["confidential", "q1"],
    currentVersion: "1.0",
    versionCount: 1,
  },
  {
    id: 8,
    name: "Health Benefits Enrollment 2026",
    description: "Annual benefits selection form",
    category: "benefits",
    fileType: "pdf",
    fileName: "benefits-2026.pdf",
    fileSize: "210 KB",
    uploadedBy: "Aida Salihović",
    uploadedAt: daysFromNow(-110),
    lastModified: daysFromNow(-30),
    expiryDate: daysFromNow(28),
    signatureStatus: "pending",
    signers: [
      {
        name: "Tarik Mujanović",
        email: "tarik@bloomteq.com",
        status: "pending",
      },
      { name: "Asmin Bašić", email: "asmin@bloomteq.com", status: "pending" },
    ],
    isConfidential: false,
    allowedRoles: ["employee"],
    tags: ["benefits", "2026"],
    currentVersion: "1.1",
    versionCount: 2,
  },
  {
    id: 9,
    name: "Code of Conduct",
    description: "Company code of conduct — current version",
    category: "policies",
    fileType: "pdf",
    fileName: "code-of-conduct.pdf",
    fileSize: "300 KB",
    uploadedBy: "Aida Salihović",
    uploadedAt: daysFromNow(-280),
    lastModified: daysFromNow(-50),
    expiryDate: null,
    signatureStatus: "signed",
    signers: [],
    isConfidential: false,
    allowedRoles: ["employee"],
    tags: ["policy", "all-staff"],
    currentVersion: "4.2",
    versionCount: 4,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - today.getTime();
  return Math.round(ms / 86400000);
}

function expiryBucket(iso?: string | null): ExpiryBucket {
  const d = daysUntil(iso);
  if (d === null) return "none";
  if (d < 0) return "expired";
  if (d <= 30) return "soon";
  return "ok";
}

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  return formatDate(iso);
}

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-emerald-600",
  "bg-indigo-600",
  "bg-rose-600",
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── FileTile ─────────────────────────────────────────────────────────────────

function FileTile({
  type,
  compact = false,
}: {
  type: FileType;
  compact?: boolean;
}) {
  const colorMap: Record<FileType, string> = {
    pdf: "border-red-200 text-red-700 bg-red-50",
    doc: "border-blue-200 text-blue-700 bg-blue-50",
    img: "border-emerald-200 text-emerald-700 bg-emerald-50",
    file: "border-gray-200 text-gray-500 bg-white",
  };
  const label = type.toUpperCase();
  const w = compact ? "w-7 h-9" : "w-9 h-11";
  return (
    <div
      className={`${w} flex-shrink-0 rounded border flex items-end justify-center pb-1 font-mono text-[8px] font-semibold relative ${colorMap[type]}`}
    >
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[6px] border-b-[6px] border-l-transparent border-b-current opacity-20" />
      {label}
    </div>
  );
}

// ─── StatStrip ────────────────────────────────────────────────────────────────

function StatStrip({ docs, isHR }: { docs: Document[]; isHR: boolean }) {
  const total = docs.length;
  const pending = docs.filter((d) => d.signatureStatus === "pending").length;
  const expSoon = docs.filter((d) => {
    const b = expiryBucket(d.expiryDate);
    return b === "soon" || b === "expired";
  }).length;
  const expired = docs.filter(
    (d) => expiryBucket(d.expiryDate) === "expired"
  ).length;
  const conf = docs.filter((d) => d.isConfidential).length;

  return (
    <div className="grid grid-cols-4 divide-x divide-gray-200 bg-white border border-gray-200 rounded-lg mb-4">
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          <FileText className="w-3 h-3" />
          Total documents
        </div>
        <div className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1.5 tabular-nums">
          {total}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          across 8 categories
        </div>
      </div>
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          <PenTool className="w-3 h-3" />
          Pending signatures
        </div>
        <div className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1.5 tabular-nums">
          {pending}
        </div>
        <div
          className={`text-[11px] mt-0.5 ${pending > 0 ? "text-amber-600 font-medium" : "text-gray-400"}`}
        >
          {pending > 0 ? "awaiting action" : "all clear"}
        </div>
      </div>
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          <AlertTriangle className="w-3 h-3" />
          Expiring &lt; 30d
        </div>
        <div className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1.5 tabular-nums">
          {expSoon}
        </div>
        <div
          className={`text-[11px] mt-0.5 ${expSoon > 0 ? "text-amber-600 font-medium" : "text-gray-400"}`}
        >
          {expired > 0
            ? `${expired} already expired`
            : expSoon > 0
              ? `${expSoon} approaching`
              : "none"}
        </div>
      </div>
      {isHR && (
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            <Shield className="w-3 h-3" />
            Confidential
          </div>
          <div className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1.5 tabular-nums">
            {conf}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            HR / admin only
          </div>
        </div>
      )}
      {!isHR && <div className="px-4 py-3.5" />}
    </div>
  );
}

// ─── AttentionStrips ──────────────────────────────────────────────────────────

function AttentionStrips({
  docs,
  onJump,
}: {
  docs: Document[];
  onJump: (k: "pending" | "expiring") => void;
}) {
  const pending = docs.filter((d) => d.signatureStatus === "pending");
  const expiring = docs.filter((d) => {
    const b = expiryBucket(d.expiryDate);
    return b === "soon" || b === "expired";
  });
  if (pending.length === 0 && expiring.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {pending.length > 0 && (
        <button
          type="button"
          onClick={() => onJump("pending")}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-3 text-left hover:border-gray-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <PenTool className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-medium text-gray-900">
              Pending your action
              <span className="font-mono text-[11px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                {pending.length}
              </span>
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5 truncate">
              {pending
                .slice(0, 2)
                .map((p) => p.name)
                .join(" · ")}
              {pending.length > 2 ? ` +${pending.length - 2} more` : ""}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      )}
      {expiring.length > 0 && (
        <button
          type="button"
          onClick={() => onJump("expiring")}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-3 text-left hover:border-gray-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-medium text-gray-900">
              Expiring or expired
              <span className="font-mono text-[11px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                {expiring.length}
              </span>
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5 truncate">
              {expiring
                .slice(0, 2)
                .map((p) => p.name)
                .join(" · ")}
              {expiring.length > 2 ? ` +${expiring.length - 2} more` : ""}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      )}
    </div>
  );
}

// ─── ExpiryCell ───────────────────────────────────────────────────────────────

function ExpiryCell({ expiryDate }: { expiryDate?: string | null }) {
  const bucket = expiryBucket(expiryDate);
  const d = daysUntil(expiryDate);
  if (bucket === "none") {
    return <span className="text-[12px] text-gray-400 italic">No expiry</span>;
  }
  const dotColor =
    bucket === "expired"
      ? "bg-red-500"
      : bucket === "soon"
        ? "bg-amber-500"
        : "bg-gray-300";
  const textColor =
    bucket === "expired"
      ? "text-red-600 font-medium"
      : bucket === "soon"
        ? "text-amber-600 font-medium"
        : "text-gray-900";
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-[12.5px] ${textColor}`}>
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`}
        />
        {fmtDate(expiryDate)}
      </div>
      <div className="text-[11px] text-gray-400 mt-0.5 pl-3">
        {bucket === "expired" ? `${Math.abs(d!)} days ago` : `in ${d} days`}
      </div>
    </div>
  );
}

// ─── SigCell ──────────────────────────────────────────────────────────────────

function SigCell({ doc }: { doc: Document }) {
  const { signatureStatus, signers } = doc;
  const signedCount = signers.filter((s) => s.status === "signed").length;
  const total = signers.length;

  if (signatureStatus === "signed") {
    return (
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-700">
        <CheckCircle className="w-3.5 h-3.5" />
        Signed
      </div>
    );
  }
  if (signatureStatus === "pending") {
    return (
      <div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-amber-600">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </div>
        {total > 0 && (
          <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
            {signedCount}/{total}
          </div>
        )}
      </div>
    );
  }
  if (signatureStatus === "rejected") {
    return (
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-red-600">
        <XCircle className="w-3.5 h-3.5" />
        Rejected
      </div>
    );
  }
  return <span className="text-[12px] text-gray-400">No signature</span>;
}

// ─── DocRow ───────────────────────────────────────────────────────────────────

function DocRow({
  doc,
  selected,
  onSelect,
  onOpen,
}: {
  doc: Document;
  selected: boolean;
  onSelect: () => void;
  onOpen: (d: Document) => void;
}) {
  const cat = CATEGORIES.find((c) => c.value === doc.category);

  return (
    <div
      className={`grid items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0 transition-colors relative ${
        selected ? "bg-gray-50/80" : "hover:bg-gray-50/60"
      } ${doc.isConfidential ? "shadow-[inset_3px_0_0_#d97706]" : ""}`}
      style={{
        gridTemplateColumns: "28px 1fr 140px 130px 130px 150px 80px 36px",
      }}
    >
      {/* Checkbox */}
      <div>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded border-gray-300 accent-gray-800 cursor-pointer"
        />
      </div>

      {/* Document name cell */}
      <div
        className="flex items-start gap-3 min-w-0 cursor-pointer"
        onClick={() => onOpen(doc)}
      >
        <FileTile type={doc.fileType} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-gray-900 leading-snug">
            <span className="truncate">{doc.name}</span>
            {doc.isConfidential && (
              <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="text-[12px] text-gray-500 mt-0.5 truncate leading-snug">
            {doc.description}
          </div>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className="text-[11px] text-gray-400">{doc.fileSize}</span>
            <span className="text-[11px] text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">{doc.uploadedBy}</span>
            {doc.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-[10.5px] font-medium px-1.5 py-px rounded bg-gray-100 text-gray-500"
              >
                {t}
              </span>
            ))}
            {doc.tags.length > 2 && (
              <span className="text-[10.5px] font-medium px-1.5 py-px rounded bg-gray-100 text-gray-500">
                +{doc.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:opacity-50 ${CAT_COLORS[doc.category]}`}
        >
          {cat?.label}
        </span>
      </div>

      {/* Modified */}
      <div>
        <div className="text-[12.5px] text-gray-900">
          {fmtDate(doc.lastModified)}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          by {doc.uploadedBy.split(" ")[0]}
        </div>
      </div>

      {/* Expiry */}
      <div>
        <ExpiryCell expiryDate={doc.expiryDate} />
      </div>

      {/* Signature */}
      <div>
        <SigCell doc={doc} />
      </div>

      {/* Version */}
      <div>
        <button className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors">
          <History className="w-2.5 h-2.5" />v{doc.currentVersion}
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onOpen(doc)}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function Drawer({
  doc,
  onClose,
  isHR,
}: {
  doc: Document | null;
  onClose: () => void;
  isHR: boolean;
}) {
  const open = !!doc;
  const bucket = open ? expiryBucket(doc!.expiryDate) : "none";
  const d = open ? daysUntil(doc!.expiryDate) : null;
  const cat = open ? CATEGORIES.find((c) => c.value === doc!.category) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/30 z-50 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[480px] max-w-full bg-white shadow-2xl z-60 flex flex-col transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ zIndex: 60 }}
      >
        {open && doc && (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-semibold text-gray-900 leading-snug">
                  {doc.name}
                </h2>
                <div className="text-[12px] text-gray-500 mt-1 flex items-center gap-1 flex-wrap">
                  {cat?.label}
                  <span className="text-gray-300">·</span>v{doc.currentVersion}
                  <span className="text-gray-300">·</span>
                  {doc.fileSize}
                  {doc.isConfidential && (
                    <span className="ml-1 text-amber-600 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Confidential
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Description
                </h4>
                <p className="text-[13px] text-gray-800 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              {/* Uploaded + Expiry grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Uploaded
                  </h4>
                  <div className="text-[13px] text-gray-800">
                    {fmtDate(doc.uploadedAt)}
                  </div>
                  <div className="text-[12px] text-gray-500">
                    by {doc.uploadedBy}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Expiry
                  </h4>
                  {doc.expiryDate ? (
                    <>
                      <div
                        className={`flex items-center gap-1.5 text-[13px] ${bucket === "expired" ? "text-red-600 font-medium" : bucket === "soon" ? "text-amber-600 font-medium" : "text-gray-800"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${bucket === "expired" ? "bg-red-500" : bucket === "soon" ? "bg-amber-500" : "bg-gray-300"}`}
                        />
                        {fmtDate(doc.expiryDate)}
                      </div>
                      <div className="text-[12px] text-gray-500 mt-0.5">
                        {bucket === "expired"
                          ? `Expired ${Math.abs(d!)} days ago`
                          : `${d} days remaining`}
                      </div>
                    </>
                  ) : (
                    <span className="text-[13px] text-gray-400 italic">
                      No expiry
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11.5px] font-medium px-2 py-1 rounded bg-gray-100 text-gray-600"
                    >
                      {t}
                    </span>
                  ))}
                  {doc.tags.length === 0 && (
                    <span className="text-[12px] text-gray-400">No tags</span>
                  )}
                </div>
              </div>

              {/* Access roles */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Access · roles
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {doc.allowedRoles.map((r) => (
                    <span
                      key={r}
                      className="text-[11.5px] font-medium px-2 py-1 rounded bg-blue-50 text-blue-700 capitalize"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Signers */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Signatures ·{" "}
                  {doc.signers.filter((s) => s.status === "signed").length} of{" "}
                  {doc.signers.length}
                </h4>
                {doc.signers.length === 0 && (
                  <p className="text-[12px] text-gray-400">
                    No signature required for this document.
                  </p>
                )}
                <div className="space-y-2">
                  {doc.signers.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-lg"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                      >
                        {initials(s.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-gray-900 truncate">
                          {s.name}
                        </div>
                        <div className="text-[11.5px] text-gray-500 truncate">
                          {s.email}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-1 rounded flex-shrink-0 ${s.status === "signed" ? "bg-emerald-50 text-emerald-700" : s.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {s.status === "signed"
                          ? "✓ Signed"
                          : s.status === "pending"
                            ? "Pending"
                            : "Not sent"}
                      </span>
                    </div>
                  ))}
                </div>
                {doc.signatureStatus === "pending" && (
                  <button className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                    <Send className="w-3 h-3" /> Send reminder to pending
                    signers
                  </button>
                )}
              </div>

              {/* Version history */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Version history · {doc.versionCount}
                </h4>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                  <History className="w-3.5 h-3.5 text-gray-500" />
                  <div className="text-[12px] text-gray-800 flex-1">
                    v{doc.currentVersion}{" "}
                    <span className="text-gray-400">· current</span>
                  </div>
                  <button className="text-[11px] font-medium text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                    View all
                  </button>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors">
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors">
                <Share className="w-3.5 h-3.5" /> Share
              </button>
              {isHR && (
                <button className="ml-auto flex items-center gap-1.5 text-[13px] font-medium text-red-600 border border-transparent rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── UploadModal ──────────────────────────────────────────────────────────────

interface UploadForm {
  name: string;
  category: DocumentCategory | "";
  description: string;
  expiryDate: string;
  noExpiry: boolean;
  isConfidential: boolean;
  requestSig: boolean;
  tags: string;
  file: File | null;
}

function UploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const modalFileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [form, setForm] = useState<UploadForm>({
    name: "",
    category: "",
    description: "",
    expiryDate: "",
    noExpiry: false,
    isConfidential: false,
    requestSig: false,
    tags: "",
    file: null,
  });

  const set = <K extends keyof UploadForm>(k: K, v: UploadForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) set("file", f);
  }, []);

  if (!open) return null;

  const canSubmit = !!form.file && !!form.name && !!form.category;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[540px] max-h-[calc(100vh-48px)] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900">
            Upload document
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Add a file with category, expiry, and access rules.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg px-5 py-6 text-center transition-colors ${over ? "border-gray-700 bg-gray-50" : "border-gray-300"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={handleFileDrop}
            onClick={() => modalFileRef.current?.click()}
          >
            {form.file ? (
              <div
                className="flex items-center gap-3 text-left bg-gray-100 rounded-lg px-3 py-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="w-5 h-5 text-gray-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">
                    {form.file.name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {(form.file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("file", null)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="cursor-pointer">
                <Upload className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <div className="text-[13px] font-medium text-gray-800">
                  <strong>Drop file here</strong> or click to browse
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  PDF, DOC, DOCX, PNG up to 25 MB
                </div>
              </div>
            )}
          </div>
          <input
            ref={modalFileRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) set("file", f);
            }}
          />

          {/* Document name */}
          <div>
            <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
              Document name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Employment Agreement — Hanan"
              className="w-full px-2.5 py-2 text-[13px] border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Category + Tags grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  set("category", e.target.value as DocumentCategory)
                }
                className="w-full px-2.5 py-2 text-[13px] border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors"
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="2026, fte"
                className="w-full px-2.5 py-2 text-[13px] border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this document for?"
              rows={3}
              className="w-full px-2.5 py-2 text-[13px] border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors resize-y"
            />
          </div>

          {/* Expiry + no-expiry */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Expiry date
              </label>
              <input
                type="date"
                value={form.expiryDate}
                disabled={form.noExpiry}
                onChange={(e) => set("expiryDate", e.target.value)}
                className="w-full px-2.5 py-2 text-[13px] border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors disabled:opacity-50"
              />
            </div>
            <label className="flex items-center gap-2 pb-2 cursor-pointer text-[13px] text-gray-700">
              <input
                type="checkbox"
                checked={form.noExpiry}
                onChange={(e) => set("noExpiry", e.target.checked)}
                className="rounded border-gray-300 accent-gray-800"
              />
              Does not expire
            </label>
          </div>

          {/* Confidential toggle */}
          <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg">
            <Shield className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-gray-800">
                Confidential — HR &amp; Admin only
              </div>
              <div className="text-[11.5px] text-gray-500">
                Hides this document from employee and manager views
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isConfidential}
              onClick={() => set("isConfidential", !form.isConfidential)}
              className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-150 ${form.isConfidential ? "bg-gray-800" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${form.isConfidential ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Request sig toggle */}
          <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg">
            <PenTool className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-gray-800">
                Request signatures on upload
              </div>
              <div className="text-[11.5px] text-gray-500">
                You&apos;ll choose signers next
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.requestSig}
              onClick={() => set("requestSig", !form.requestSig)}
              className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-150 ${form.requestSig ? "bg-gray-800" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${form.requestSig ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onClose}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-gray-800 rounded-lg px-4 py-2 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="w-3.5 h-3.5" /> Upload document
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DocumentsModule ──────────────────────────────────────────────────────────

export function DocumentsModule() {
  const isHR = true; // would come from session role in production

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<Document[]>(MOCK_DOCS);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<DocumentCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("modified");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawerDoc, setDrawerDoc] = useState<Document | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const filtered = useMemo(() => {
    let out = docs;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeCat !== "all") out = out.filter((d) => d.category === activeCat);
    if (statusFilter === "pending")
      out = out.filter((d) => d.signatureStatus === "pending");
    else if (statusFilter === "signed")
      out = out.filter((d) => d.signatureStatus === "signed");
    else if (statusFilter === "rejected")
      out = out.filter((d) => d.signatureStatus === "rejected");
    else if (statusFilter === "not_required")
      out = out.filter((d) => d.signatureStatus === "not_required");
    if (expiryFilter === "soon")
      out = out.filter((d) => expiryBucket(d.expiryDate) === "soon");
    else if (expiryFilter === "expired")
      out = out.filter((d) => expiryBucket(d.expiryDate) === "expired");
    out = [...out].sort((a, b) => {
      if (sortBy === "modified")
        return (
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
        );
      if (sortBy === "expiry")
        return (
          new Date(a.expiryDate || "2999").getTime() -
          new Date(b.expiryDate || "2999").getTime()
        );
      return a.category.localeCompare(b.category);
    });
    return out;
  }, [docs, search, activeCat, statusFilter, expiryFilter, sortBy]);

  const catCounts = useMemo(() => {
    const c: Record<string, number> = { all: docs.length };
    CATEGORIES.forEach((cat) => {
      c[cat.value] = docs.filter((d) => d.category === cat.value).length;
    });
    return c;
  }, [docs]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((d) => d.id)));
  };

  const bulkDelete = () => {
    setDocs((prev) => prev.filter((d) => !selected.has(d.id)));
    setSelected(new Set());
  };

  const activeChips: { label: string; clear: () => void }[] = [];
  if (expiryFilter !== "all")
    activeChips.push({
      label: expiryFilter === "soon" ? "Expiring soon" : "Expired",
      clear: () => setExpiryFilter("all"),
    });
  if (statusFilter !== "all")
    activeChips.push({
      label: `Status: ${statusFilter.replace("_", " ")}`,
      clear: () => setStatusFilter("all"),
    });

  return (
    <div
      className="space-y-0"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.[0]) setUploadOpen(true);
      }}
    >
      {/* Page header */}
      <div className="flex items-start justify-between gap-6 mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-gray-900 leading-tight">
            Documents &amp; Agreements
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Manage company documents, contracts, and signature workflows
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <FolderOpen className="w-3.5 h-3.5" /> Templates
          </button>
          {isHR && (
            <button className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          )}
          <button className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium text-white bg-gray-800 border border-gray-800 hover:bg-gray-900 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Upload document
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files?.[0]) setUploadOpen(true);
            }}
          />
        </div>
      </div>

      {/* Stat strip */}
      <StatStrip docs={docs} isHR={isHR} />

      {/* Attention strips */}
      <AttentionStrips
        docs={docs}
        onJump={(k) => {
          if (k === "pending") setStatusFilter("pending");
          if (k === "expiring") setExpiryFilter("soon");
        }}
      />

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
        {/* Filter row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, description, or tag…"
              className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 pr-7 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg bg-white outline-none hover:bg-gray-50 cursor-pointer min-w-[130px]"
          >
            <option value="all">All statuses</option>
            <option value="signed">Signed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="not_required">No signature</option>
          </select>
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="h-9 px-2.5 pr-7 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg bg-white outline-none hover:bg-gray-50 cursor-pointer min-w-[130px]"
          >
            <option value="all">All expiries</option>
            <option value="soon">Expiring &lt; 30d</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="h-9 px-2.5 pr-7 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg bg-white outline-none hover:bg-gray-50 cursor-pointer min-w-[130px]"
          >
            <option value="modified">Sort: Modified</option>
            <option value="expiry">Sort: Expiry</option>
            <option value="category">Sort: Category</option>
          </select>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button
            type="button"
            onClick={() => setActiveCat("all")}
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium border transition-colors ${activeCat === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
          >
            All{" "}
            <span
              className={`font-mono text-[10px] ${activeCat === "all" ? "text-gray-300" : "text-gray-400"}`}
            >
              {catCounts.all}
            </span>
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCat(cat.value)}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium border transition-colors ${activeCat === cat.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
            >
              {cat.label}{" "}
              <span
                className={`font-mono text-[10px] ${activeCat === cat.value ? "text-gray-300" : "text-gray-400"}`}
              >
                {catCounts[cat.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest mr-1">
              Active filters
            </span>
            {activeChips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-gray-100 text-[12px] font-medium text-gray-700"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.clear}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                setExpiryFilter("all");
                setStatusFilter("all");
              }}
              className="h-6 px-2 rounded text-[12px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-3.5 py-2.5 mb-3 bg-gray-800 text-white rounded-lg">
          <input
            type="checkbox"
            checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-500 accent-white cursor-pointer"
          />
          <span className="text-[13px] font-medium">
            {selected.size} selected
          </span>
          <div className="flex gap-1.5 ml-auto">
            <button className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-gray-200 border border-gray-600 hover:bg-gray-700 transition-colors">
              <PenTool className="w-3 h-3" /> Request signature
            </button>
            <button className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-gray-200 border border-gray-600 hover:bg-gray-700 transition-colors">
              <Archive className="w-3 h-3" /> Archive
            </button>
            <button className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-gray-200 border border-gray-600 hover:bg-gray-700 transition-colors">
              <Download className="w-3 h-3" /> Download
            </button>
            <button
              type="button"
              onClick={bulkDelete}
              className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-red-300 border border-gray-600 hover:bg-red-900/40 hover:border-red-700 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Document list / empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center">
          <h3 className="text-[16px] font-semibold text-gray-900 mb-1.5">
            No documents found
          </h3>
          <p className="text-[13px] text-gray-500 mb-5">
            {search || activeCat !== "all" || expiryFilter !== "all"
              ? "Try adjusting your filters, or upload a new document below."
              : "Drop a file to get started, or click upload."}
          </p>
          <div
            className={`mx-auto max-w-[460px] border-2 border-dashed rounded-lg px-5 py-8 transition-colors cursor-pointer ${dragOver ? "border-gray-700 bg-gray-50" : "border-gray-300"}`}
            onClick={() => setUploadOpen(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-[14px] font-medium text-gray-800">
              Drop file here
            </div>
            <div className="text-[12px] text-gray-400 mt-1 mb-4">
              or click to browse
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUploadOpen(true);
              }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-gray-800 rounded-lg px-3 py-1.5 mx-auto hover:bg-gray-900 transition-colors"
            >
              <Upload className="w-3 h-3" /> Upload document
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* List header */}
          <div
            className="grid items-center gap-4 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-t-lg text-[11px] font-semibold text-gray-500 uppercase tracking-widest"
            style={{
              gridTemplateColumns: "28px 1fr 140px 130px 130px 150px 80px 36px",
            }}
          >
            <div>
              <input
                type="checkbox"
                checked={
                  selected.size === filtered.length && filtered.length > 0
                }
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 accent-gray-800 cursor-pointer"
              />
            </div>
            <div>Document</div>
            <div>
              <button
                type="button"
                onClick={() => setSortBy("category")}
                className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
              >
                Category{" "}
                {sortBy === "category" && (
                  <ChevronDown className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setSortBy("modified")}
                className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
              >
                Modified{" "}
                {sortBy === "modified" && (
                  <ChevronDown className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setSortBy("expiry")}
                className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
              >
                Expiry{" "}
                {sortBy === "expiry" && <ChevronDown className="w-2.5 h-2.5" />}
              </button>
            </div>
            <div>Signature</div>
            <div>Version</div>
            <div />
          </div>

          {/* Rows */}
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
            {filtered.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                selected={selected.has(doc.id)}
                onSelect={() => toggleSelect(doc.id)}
                onOpen={setDrawerDoc}
              />
            ))}
          </div>
        </>
      )}

      {/* Drawer */}
      <Drawer doc={drawerDoc} onClose={() => setDrawerDoc(null)} isHR={isHR} />

      {/* Upload modal */}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
