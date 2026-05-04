"use client";

import React from "react";
import {
  Type,
  Calendar,
  Hash,
  ChevronDown,
  CheckSquare,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DatePicker } from "../DatePicker";
import {
  TemplateFieldType,
  TEMPLATE_FIELD_TYPE_LABELS,
  type TemplateField,
} from "@/lib/templates/templatesHelpers";

// ─── Shared prop type ─────────────────────────────────────────────────────────

export interface FieldInputProps {
  field: TemplateField;
  value: string | boolean | number;
  onChange: (value: string | boolean | number) => void;
  disabled?: boolean;
}

// ─── Label helper ─────────────────────────────────────────────────────────────

function FieldLabel({ field }: { field: TemplateField }) {
  const typeLabel = TEMPLATE_FIELD_TYPE_LABELS[field.type] ?? field.type;
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <label className="text-[12px] font-medium text-gray-800">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <span className="text-[10.5px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
        {`{{${field.key}}}`}
      </span>
      <span className="text-[10.5px] font-medium text-gray-400">
        · {typeLabel}
      </span>
    </div>
  );
}

function FieldHint({ field }: { field: TemplateField }) {
  if (!field.placeholder) return null;
  return <p className="text-[11px] text-gray-400 mt-1">{field.placeholder}</p>;
}

function fieldIsEmpty(
  field: TemplateField,
  value: string | boolean | number
): boolean {
  if (field.type === TemplateFieldType.Checkbox) return false;
  return String(value ?? "").trim() === "";
}

// ─── Individual field components ──────────────────────────────────────────────

export function TextFieldInput({
  field,
  value,
  onChange,
  disabled,
}: FieldInputProps) {
  const isEmpty = field.required && fieldIsEmpty(field, value);
  return (
    <div>
      <FieldLabel field={field} />
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder || field.label}
        className={`h-9 w-full px-3 text-[13px] text-gray-900 placeholder:text-gray-400 border rounded-md bg-white outline-none transition-colors disabled:opacity-50 disabled:bg-gray-50 ${isEmpty ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-gray-400"}`}
      />
      <FieldHint field={field} />
      {isEmpty && (
        <p className="text-[11px] text-red-500 mt-1">This field is required</p>
      )}
    </div>
  );
}

export function DateFieldInput({
  field,
  value,
  onChange,
  disabled,
}: FieldInputProps) {
  const isEmpty = field.required && fieldIsEmpty(field, value);
  return (
    <div>
      <FieldLabel field={field} />
      <DatePicker
        mode="single"
        value={String(value ?? "")}
        onChange={(date) => onChange(date)}
        disabled={disabled}
        placeholder={field.placeholder || "Pick a date…"}
      />
      <FieldHint field={field} />
      {isEmpty && (
        <p className="text-[11px] text-red-500 mt-1">This field is required</p>
      )}
    </div>
  );
}

export function NumberFieldInput({
  field,
  value,
  onChange,
  disabled,
}: FieldInputProps) {
  const isEmpty = field.required && fieldIsEmpty(field, value);
  return (
    <div>
      <FieldLabel field={field} />
      <input
        type="number"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder || "0"}
        className={`h-9 w-full px-3 text-[13px] text-gray-900 placeholder:text-gray-400 border rounded-md bg-white outline-none transition-colors disabled:opacity-50 disabled:bg-gray-50 ${isEmpty ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-gray-400"}`}
      />
      <FieldHint field={field} />
      {isEmpty && (
        <p className="text-[11px] text-red-500 mt-1">This field is required</p>
      )}
    </div>
  );
}

export function DropdownFieldInput({
  field,
  value,
  onChange,
  disabled,
}: FieldInputProps) {
  const options = field.options
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);
  const isEmpty = field.required && fieldIsEmpty(field, value);
  return (
    <div>
      <FieldLabel field={field} />
      <Select
        value={String(value ?? "")}
        onValueChange={(v) => onChange(v)}
        disabled={disabled}
      >
        <SelectTrigger
          className={`h-9 w-full text-[13px] font-medium text-gray-900 bg-white ${isEmpty ? "border-red-300" : "border-gray-200"}`}
        >
          <SelectValue
            placeholder={field.placeholder || `Select ${field.label}…`}
          />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldHint field={field} />
      {isEmpty && (
        <p className="text-[11px] text-red-500 mt-1">This field is required</p>
      )}
    </div>
  );
}

export function CheckboxFieldInput({
  field,
  value,
  onChange,
  disabled,
}: FieldInputProps) {
  const checked = value === true || value === "true";
  return (
    <div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0 ${checked ? "bg-gray-800 border-gray-800" : "bg-white border-gray-300"}`}
        >
          {checked && (
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
        <label
          className="text-[13px] font-medium text-gray-800 cursor-pointer"
          onClick={() => !disabled && onChange(!checked)}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <span className="text-[10.5px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {`{{${field.key}}}`}
        </span>
        <span className="text-[10.5px] font-medium text-gray-400">
          · Checkbox
        </span>
      </div>
      {field.placeholder && (
        <p className="text-[11px] text-gray-400 mt-1 ml-6">
          {field.placeholder}
        </p>
      )}
    </div>
  );
}

export function UserSelectFieldInput({
  field,
  value,
  onChange,
  disabled,
}: FieldInputProps) {
  const isEmpty = field.required && fieldIsEmpty(field, value);
  return (
    <div>
      <FieldLabel field={field} />
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder || "Enter user name or email…"}
        className={`h-9 w-full px-3 text-[13px] text-gray-900 placeholder:text-gray-400 border rounded-md bg-white outline-none transition-colors disabled:opacity-50 disabled:bg-gray-50 ${isEmpty ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-gray-400"}`}
      />
      <p className="text-[11px] text-gray-400 mt-1">User lookup coming soon</p>
      {isEmpty && (
        <p className="text-[11px] text-red-500 mt-0.5">
          This field is required
        </p>
      )}
    </div>
  );
}

// ─── FieldRenderer ────────────────────────────────────────────────────────────

const FIELD_COMPONENT_MAP: Record<
  TemplateFieldType,
  React.ComponentType<FieldInputProps>
> = {
  [TemplateFieldType.Text]: TextFieldInput,
  [TemplateFieldType.Date]: DateFieldInput,
  [TemplateFieldType.Number]: NumberFieldInput,
  [TemplateFieldType.Dropdown]: DropdownFieldInput,
  [TemplateFieldType.Checkbox]: CheckboxFieldInput,
  [TemplateFieldType.UserSelect]: UserSelectFieldInput,
};

export function FieldRenderer(props: FieldInputProps) {
  const Component = FIELD_COMPONENT_MAP[props.field.type] ?? TextFieldInput;
  return <Component {...props} />;
}

// ─── FieldTypeIcon ────────────────────────────────────────────────────────────

const FIELD_TYPE_ICON_MAP: Record<
  TemplateFieldType,
  React.ComponentType<{ className?: string }>
> = {
  [TemplateFieldType.Text]: Type,
  [TemplateFieldType.Date]: Calendar,
  [TemplateFieldType.Number]: Hash,
  [TemplateFieldType.Dropdown]: ChevronDown,
  [TemplateFieldType.Checkbox]: CheckSquare,
  [TemplateFieldType.UserSelect]: User,
};

export function FieldTypeIcon({
  type,
  className,
}: {
  type: TemplateFieldType;
  className?: string;
}) {
  const Icon = FIELD_TYPE_ICON_MAP[type] ?? Type;
  return <Icon className={className ?? "w-3.5 h-3.5"} />;
}
