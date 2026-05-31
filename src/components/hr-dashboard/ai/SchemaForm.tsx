"use client";

import { useMemo } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import type {
  RJSFSchema,
  UiSchema,
  WidgetProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  RegistryWidgetsType,
} from "@rjsf/utils";
import { PERMISSIONS_LIST } from "@/components/hr-dashboard/AdminModule";
import { detectRelationKind, humanizeKey } from "@/lib/ai/schema";
import type { JsonValue } from "@/lib/api/aiChat";

type AnySchema = RJSFSchema;

// ---------- Widgets ----------

function TextWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    onChange,
    placeholder,
    schema,
  } = props;
  const isMultiline =
    (schema as { multiline?: boolean }).multiline === true ||
    (schema.description ?? "").length > 120;
  if (isMultiline) {
    return (
      <textarea
        id={id}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
        value={value ?? ""}
        required={required}
        disabled={disabled || readonly}
        placeholder={placeholder}
        rows={3}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    );
  }
  return (
    <input
      id={id}
      type="text"
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
      value={value ?? ""}
      required={required}
      disabled={disabled || readonly}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  );
}

function NumberWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange, schema } = props;
  return (
    <input
      id={id}
      type="number"
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
      value={value ?? ""}
      required={required}
      disabled={disabled || readonly}
      min={(schema as { minimum?: number }).minimum}
      max={(schema as { maximum?: number }).maximum}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : Number(e.target.value))
      }
    />
  );
}

function CheckboxWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, onChange, label } = props;
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300"
        checked={Boolean(value)}
        disabled={disabled || readonly}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-gray-700 dark:text-gray-200">{label}</span>
    </label>
  );
}

function SelectWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange, options } = props;
  const enumOptions = (options.enumOptions ?? []) as {
    value: unknown;
    label: string;
  }[];
  return (
    <select
      id={id}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
      value={value ?? ""}
      required={required}
      disabled={disabled || readonly}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">— select —</option>
      {enumOptions.map((opt, i) => (
        <option key={i} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function DateWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange } = props;
  return (
    <input
      id={id}
      type="date"
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
      value={value ?? ""}
      required={required}
      disabled={disabled || readonly}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  );
}

function PermissionMultiPicker(props: WidgetProps) {
  // permission_ids on server is array of int; on client we keep array of strings (permission codes)
  // adapted to backend by mapping code -> index+1 (1-based) for now; safer: keep as codes the BE accepts.
  const { value, onChange, disabled, readonly } = props;
  const selected: string[] = Array.isArray(value) ? value.map(String) : [];
  const toggle = (code: string) => {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {PERMISSIONS_LIST.map((code) => {
        const on = selected.includes(code);
        return (
          <button
            type="button"
            key={code}
            disabled={disabled || readonly}
            onClick={() => toggle(code)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              on
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Templates ----------

function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    classNames,
    style,
    label,
    help,
    required,
    description,
    errors,
    children,
    schema,
    displayLabel,
  } = props;
  const isObjectRoot = schema.type === "object" && id === "root";
  if (isObjectRoot) return <>{children}</>;
  return (
    <div className={`${classNames ?? ""} space-y-1`} style={style}>
      {displayLabel && label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-gray-700 dark:text-gray-200"
        >
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </label>
      )}
      {description}
      {children}
      {errors}
      {help}
    </div>
  );
}

function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {props.properties.map((p) => (
        <div key={p.name} className={spanForField(p.name)}>
          {p.content}
        </div>
      ))}
    </div>
  );
}

function spanForField(name: string): string {
  const n = name.toLowerCase();
  if (
    n === "description" ||
    n === "reason" ||
    n === "notes" ||
    n === "permission_ids" ||
    n === "employee_ids"
  )
    return "sm:col-span-2";
  return "sm:col-span-1";
}

// ---------- UI schema builder ----------

function buildUiSchema(schema: AnySchema): UiSchema {
  const ui: UiSchema = {};
  const props = (schema.properties ?? {}) as Record<string, AnySchema>;
  for (const [key, prop] of Object.entries(props)) {
    const rel = detectRelationKind(key, prop as Record<string, JsonValue>);
    const fieldUi: Record<string, unknown> = {
      "ui:title": (prop as { title?: string }).title ?? humanizeKey(key),
    };
    if (rel === "permission_ids") {
      fieldUi["ui:widget"] = "permissionMulti";
    } else if (
      (prop as { format?: string }).format === "date" ||
      /(_date|_at|date_from|date_to|start_date|end_date)$/i.test(key)
    ) {
      fieldUi["ui:widget"] = "date";
    } else if (
      key === "description" ||
      key === "reason" ||
      key === "notes" ||
      (prop as { multiline?: boolean }).multiline
    ) {
      fieldUi["ui:options"] = { multiline: true };
    }
    ui[key] = fieldUi;
  }
  return ui;
}

const widgets: RegistryWidgetsType = {
  TextWidget: TextWidget,
  EmailWidget: TextWidget,
  URLWidget: TextWidget,
  TextareaWidget: TextWidget,
  CheckboxWidget: CheckboxWidget,
  SelectWidget: SelectWidget,
  UpDownWidget: NumberWidget,
  RangeWidget: NumberWidget,
  DateWidget: DateWidget,
  permissionMulti: PermissionMultiPicker,
};

export interface SchemaFormProps {
  schema: AnySchema;
  formData: Record<string, JsonValue>;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  missingFields?: string[];
  onChange: (data: Record<string, JsonValue>) => void;
  onSubmit: (data: Record<string, JsonValue>) => void;
  formId?: string;
}

export function SchemaForm({
  schema,
  formData,
  disabled,
  fieldErrors,
  missingFields,
  onChange,
  onSubmit,
  formId,
}: SchemaFormProps) {
  const mergedSchema = useMemo(() => {
    if (!missingFields || missingFields.length === 0) return schema;
    const existing = Array.isArray(schema.required) ? schema.required : [];
    const merged = Array.from(new Set([...existing, ...missingFields]));
    return { ...schema, required: merged };
  }, [schema, missingFields]);
  const uiSchema = useMemo(() => buildUiSchema(mergedSchema), [mergedSchema]);

  // Merge backend field errors as extraErrors
  const extraErrors = useMemo(() => {
    if (!fieldErrors) return undefined;
    const out: Record<string, { __errors: string[] }> = {};
    for (const [k, v] of Object.entries(fieldErrors)) {
      out[k] = { __errors: [v] };
    }
    return out as unknown as Record<string, unknown>;
  }, [fieldErrors]);

  return (
    <Form
      id={formId}
      schema={mergedSchema}
      uiSchema={uiSchema}
      formData={formData}
      disabled={disabled}
      validator={validator}
      widgets={widgets}
      templates={{ FieldTemplate, ObjectFieldTemplate }}
      extraErrors={extraErrors as never}
      onChange={(e) => onChange(e.formData as Record<string, JsonValue>)}
      onSubmit={(e) => onSubmit(e.formData as Record<string, JsonValue>)}
      showErrorList={false}
      noHtml5Validate
    >
      {/* Hidden submit so caller drives via form id */}
      <button type="submit" style={{ display: "none" }} aria-hidden />
    </Form>
  );
}
