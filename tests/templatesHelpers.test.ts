import { describe, expect, it } from "vitest";
import {
  mergeTemplateFieldsFromPlaceholders,
  TemplateFieldType,
  displayLabelForPlaceholder,
  extractPlaceholders,
  generateFieldId,
  labelToKey,
  type TemplateField,
} from "@/lib/templates/templatesHelpers";

describe("displayLabelForPlaceholder", () => {
  it("humanizes snake_case placeholder inner text", () => {
    expect(
      displayLabelForPlaceholder({
        key: "signatory_name",
        label: "signatory_name",
      })
    ).toBe("Signatory Name");
  });

  it("preserves spaced phrases", () => {
    expect(
      displayLabelForPlaceholder({
        key: "employee_name",
        label: "Employee Name",
      })
    ).toBe("Employee Name");
  });
});

describe("mergeTemplateFieldsFromPlaceholders", () => {
  it("adds fields for placeholders missing from state", () => {
    const html = "<p>{{signatory_name}}</p><p>{{signatory_title}}</p>";
    const merged = mergeTemplateFieldsFromPlaceholders([], html);
    expect(merged).toHaveLength(2);
    expect(merged.map((f) => f.key).sort()).toEqual([
      "signatory_name",
      "signatory_title",
    ]);
    expect(merged[0].type).toBe(TemplateFieldType.Text);
  });

  it("does not duplicate existing keys", () => {
    const existing: TemplateField[] = [
      {
        id: "a",
        key: "signatory_name",
        label: "Signer",
        type: TemplateFieldType.Text,
        placeholder: "",
        required: false,
        defaultValue: "",
        options: "",
      },
    ];
    const html = "<p>{{signatory_name}}</p><p>{{signatory_title}}</p>";
    const merged = mergeTemplateFieldsFromPlaceholders(existing, html);
    expect(merged).toHaveLength(2);
    expect(merged.find((f) => f.key === "signatory_name")?.label).toBe(
      "Signer"
    );
  });

  it("returns same array reference when nothing new", () => {
    const field: TemplateField = {
      id: generateFieldId(),
      key: "signatory_name",
      label: "Signer",
      type: TemplateFieldType.Text,
      placeholder: "",
      required: false,
      defaultValue: "",
      options: "",
    };
    const html = `<span data-field-key="${field.key}" class="tpl-field">{{${field.key}}}</span>`;
    const fields = [field];
    const merged = mergeTemplateFieldsFromPlaceholders(fields, html);
    expect(merged).toBe(fields);
    expect(merged).toHaveLength(1);
  });
});

describe("extractPlaceholders + labelToKey", () => {
  it("extracts keys from typed brace syntax matching snippets", () => {
    const html =
      "<p>Sincerely,</p><p>{{signatory_name}}<br>{{signatory_title}}</p>";
    const ph = extractPlaceholders(html);
    expect(ph.map((p) => p.key)).toContain(labelToKey("signatory_name"));
    expect(ph.map((p) => p.key)).toContain(labelToKey("signatory_title"));
  });
});
