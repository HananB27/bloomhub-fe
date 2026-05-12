"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, PenTool, Shield, Upload, X } from "lucide-react";
import {
  documentsApi,
  type EmployeeDocument,
  type UploadEmployeeDocumentPayload,
} from "@/lib/api/modules/documents";
import {
  DOCUMENT_CATEGORIES,
  DocumentAccessRole,
  DocumentCategory,
  parseDocumentTags,
} from "@/lib/documents/documentsHelpers";
import {
  DOCUMENT_CATEGORY_DEFAULT_PRESET,
  visibilityFromPreset,
  type DocumentVisibilitySettings,
} from "@/lib/documents/documentVisibilityPresets";
import {
  NotificationMessages,
  notifyApiError,
  notifySuccess,
} from "@/utils/notificationHelpers";
import { DatePicker } from "../DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DocumentVisibilitySelector } from "./DocumentVisibilitySelector";

interface UploadForm {
  name: string;
  category: DocumentCategory | "";
  description: string;
  expiryDate: string;
  noExpiry: boolean;
  visibility: DocumentVisibilitySettings;
  userTouchedVisibility: boolean;
  requestSig: boolean;
  tags: string;
  file: File | null;
}

const DEFAULT_UPLOAD_VISIBILITY: DocumentVisibilitySettings =
  visibilityFromPreset("everyone");

const EMPTY_UPLOAD_FORM: UploadForm = {
  name: "",
  category: "",
  description: "",
  expiryDate: "",
  noExpiry: false,
  visibility: DEFAULT_UPLOAD_VISIBILITY,
  userTouchedVisibility: false,
  requestSig: false,
  tags: "",
  file: null,
};

export function DocumentUploadModal({
  open,
  onClose,
  onSuccess,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (doc: EmployeeDocument) => void;
  initialValues?: Partial<UploadForm>;
}) {
  const modalFileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState<UploadForm>(EMPTY_UPLOAD_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        initialValues
          ? { ...EMPTY_UPLOAD_FORM, ...initialValues }
          : EMPTY_UPLOAD_FORM
      );
    }
  }, [initialValues, open]);

  const set = <K extends keyof UploadForm>(k: K, v: UploadForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) set("file", f);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.file || !form.name || !form.category) return;

    setIsUploading(true);
    try {
      const payload: UploadEmployeeDocumentPayload = {
        file: form.file,
        name: form.name,
        category: form.category as DocumentCategory,
        description: form.description,
        expiryDate: form.noExpiry ? undefined : form.expiryDate || undefined,
        isConfidential:
          form.visibility.scope !== "roles" ||
          !form.visibility.allowedRoles.includes(DocumentAccessRole.Employee),
        tags: parseDocumentTags(form.tags),
        allowedRoles: form.visibility.allowedRoles,
        visibilityScope: form.visibility.scope,
        requestSignatures: form.requestSig,
      };
      const newDoc = await documentsApi.upload(payload);
      notifySuccess(NotificationMessages.UPLOADED_SUCCESS);
      onSuccess(newDoc);
      setForm(EMPTY_UPLOAD_FORM);
      onClose();
    } catch (e) {
      notifyApiError(e as Error);
    } finally {
      setIsUploading(false);
    }
  }, [form, onClose, onSuccess]);

  if (!open) return null;

  const canSubmit =
    !!form.file && !!form.name && !!form.category && !isUploading;

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

          <div>
            <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
              Document name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Employment Agreement"
              className="h-10 w-full px-3 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Category
              </label>
              <Select
                value={form.category || undefined}
                onValueChange={(value) => {
                  const nextCategory = value as DocumentCategory;
                  setForm((prev) => {
                    const shouldPrefill = !prev.userTouchedVisibility;
                    return {
                      ...prev,
                      category: nextCategory,
                      visibility: shouldPrefill
                        ? visibilityFromPreset(
                            DOCUMENT_CATEGORY_DEFAULT_PRESET[nextCategory]
                          )
                        : prev.visibility,
                    };
                  });
                }}
              >
                <SelectTrigger className="h-10 w-full text-[13px] font-medium text-gray-900 bg-white border-gray-200">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="z-[130] bg-white border-gray-200">
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="Add tags (e.g. Tax, HR, 2024)"
                className="h-10 w-full px-3 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this document for?"
              rows={5}
              className="w-full min-h-[80px] px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-gray-400 transition-colors resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Expiry date
              </label>
              <DatePicker
                mode="single"
                value={form.expiryDate}
                onChange={(date) => set("expiryDate", date)}
                disabled={form.noExpiry}
                placeholder="Pick expiry date"
                size="compact"
              />
            </div>
            <label className="flex items-center gap-2 pt-5 cursor-pointer text-[13px] text-gray-700">
              <input
                type="checkbox"
                checked={form.noExpiry}
                onChange={(e) => set("noExpiry", e.target.checked)}
                className="rounded border-gray-300 accent-gray-800"
              />
              Does not expire
            </label>
          </div>

          <div className="px-3 py-3 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[13px] font-medium text-gray-800">
                  Visibility
                </div>
                <div className="text-[11.5px] text-gray-500">
                  Who can see this document. Defaults follow the chosen
                  category.
                </div>
              </div>
            </div>
            <DocumentVisibilitySelector
              value={form.visibility}
              onChange={(visibility) =>
                setForm((prev) => ({
                  ...prev,
                  visibility,
                  userTouchedVisibility: true,
                }))
              }
            />
          </div>

          <div className="flex items-center gap-3 px-3 py-3 border border-gray-200 rounded-lg">
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
            disabled={isUploading}
            className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-gray-800 rounded-lg px-4 py-2 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? "Uploading..." : "Upload document"}
          </button>
        </div>
      </div>
    </div>
  );
}
