"use client";

import React, { useState } from "react";
import { Award, Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import { formatDate } from "@/utils";
import type { Certificate } from "@/types/certificates";
import { certificatesApi } from "@/lib/api/modules/certificates";
import { toast } from "sonner";

interface CertificateListProps {
  certificates: Certificate[];
  isLoading?: boolean;
  onDelete?: (certificate: Certificate) => void;
  isDeleting?: Record<number, boolean>;
  canDelete?: boolean;
}

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-emerald-600",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-sky-600",
];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const GRID = "minmax(0,1.7fr) 180px 140px 120px 110px 90px";

export function CertificateList({
  certificates,
  isLoading = false,
  onDelete,
  isDeleting = {},
  canDelete = true,
}: CertificateListProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (certificate: Certificate) => {
    setDownloadingId(certificate.id);
    try {
      const url = await certificatesApi.getDownloadUrl(certificate.id);
      if (!url) {
        toast.error("Download URL is unavailable");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
          <p className="text-sm text-gray-400">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-14 text-center">
        <h3 className="mb-1.5 text-base font-semibold text-gray-900">
          No certificates yet
        </h3>
        <p className="text-sm text-gray-500">
          Upload PDF or image files to keep employee certifications in one
          place.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="grid items-center gap-4 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
        style={{ gridTemplateColumns: GRID }}
      >
        <div role="columnheader">Certificate</div>
        <div role="columnheader">Employee</div>
        <div role="columnheader">Issued</div>
        <div role="columnheader">Expiration</div>
        <div role="columnheader">Status</div>
        <div role="columnheader" />
      </div>

      <div className="rounded-b-lg border border-gray-200 bg-white">
        {certificates.map((cert, idx) => {
          const showBorder = idx < certificates.length - 1;
          const statusClass = cert.isExpired
            ? "bg-red-50 text-red-700"
            : cert.expirationDate
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-600";
          const statusLabel = cert.isExpired
            ? "Expired"
            : cert.expirationDate
              ? "Valid"
              : "No expiry";

          return (
            <div
              key={cert.id}
              className={`grid items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50/70 ${
                showBorder ? "border-b border-gray-200" : ""
              }`}
              style={{ gridTemplateColumns: GRID }}
            >
              {/* Title + Issuer */}
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Award className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-gray-900">
                    {cert.title}
                  </p>
                  {cert.issuer && (
                    <p className="truncate text-[12px] text-gray-500">
                      {cert.issuer}
                    </p>
                  )}
                </div>
              </div>

              {/* Employee */}
              <div className="flex min-w-0 items-center gap-2.5">
                {cert.employeeName ? (
                  <>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${getAvatarColor(cert.employeeName)}`}
                    >
                      {getInitials(cert.employeeName)}
                    </div>
                    <span className="truncate text-[13px] font-medium text-gray-800">
                      {cert.employeeName}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>

              {/* Issued */}
              <div className="text-[12.5px] text-gray-900">
                {formatDate(cert.issuedDate)}
              </div>

              {/* Expiration */}
              <div className="text-[12.5px] text-gray-900">
                {cert.expirationDate ? formatDate(cert.expirationDate) : "—"}
              </div>

              {/* Status */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${statusClass}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(cert)}
                  disabled={downloadingId === cert.id}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                  title="Download"
                >
                  {downloadingId === cert.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
                {canDelete && onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(cert)}
                    disabled={isDeleting[cert.id]}
                    className="h-7 w-7 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    {isDeleting[cert.id] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
