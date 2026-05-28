"use client";

import {
  Document as PdfDocument,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type {
  CompensationEmployee,
  CompensationOverview,
  SalaryBand,
} from "@/lib/api/compensation";

interface CompensationReportsTabProps {
  overview: CompensationOverview;
  bands: SalaryBand[];
  generatedAt: Date | null;
}

interface SummaryRow {
  label: string;
  value: string;
}

interface DepartmentRow {
  department: string;
  headcount: number;
  payroll: number;
  average: number;
  bonusAvg: number;
}

interface StatusRow {
  status: string;
  headcount: number;
  payroll: number;
}

const REPORT_TITLE = "BloomHub Compensation Report";
const INK = "#171717";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SOFT = "#f6f7f9";

function bam(value: number): string {
  return `BAM ${Math.round(value).toLocaleString("en-US")}`;
}

function pct(value: number): string {
  return `${Number(value).toFixed(2)}%`;
}

function money(value: number): string {
  return Number(value).toFixed(2);
}

function statusLabel(value: string): string {
  return value === "OnLeave" ? "On Leave" : value;
}

function reportDate(date: Date | null): string {
  return (date ?? new Date()).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvCell(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function getSummaryRows(overview: CompensationOverview): SummaryRow[] {
  const { stats } = overview;
  return [
    { label: "Total monthly payroll", value: bam(stats.totalMonthly) },
    { label: "Average salary", value: bam(stats.avgSalary) },
    { label: "Median salary", value: bam(stats.medianSalary) },
    { label: "Total employees", value: String(stats.totalEmployees) },
    { label: "Pending salary reviews", value: String(stats.pendingReviews) },
    { label: "Overdue salary reviews", value: String(stats.overdueReviews) },
    {
      label: "Payroll change vs last month",
      value: pct(stats.monthlyDeltaPct),
    },
    { label: "Average salary YoY", value: pct(stats.avgYoyPct) },
    { label: "Median salary QoQ", value: pct(stats.medianQoqPct) },
  ];
}

function getDepartmentRows(employees: CompensationEmployee[]): DepartmentRow[] {
  const map = new Map<string, CompensationEmployee[]>();
  for (const employee of employees) {
    const dept = employee.dept || "Unassigned";
    map.set(dept, [...(map.get(dept) ?? []), employee]);
  }
  return Array.from(map.entries())
    .map(([department, rows]) => {
      const payroll = rows.reduce((sum, row) => sum + row.salary, 0);
      const bonusAvg =
        rows.reduce((sum, row) => sum + row.bonus, 0) /
        Math.max(rows.length, 1);
      return {
        department,
        headcount: rows.length,
        payroll,
        average: payroll / Math.max(rows.length, 1),
        bonusAvg,
      };
    })
    .sort((a, b) => b.payroll - a.payroll);
}

function getStatusRows(employees: CompensationEmployee[]): StatusRow[] {
  const map = new Map<string, CompensationEmployee[]>();
  for (const employee of employees) {
    const status = statusLabel(employee.status);
    map.set(status, [...(map.get(status) ?? []), employee]);
  }
  return Array.from(map.entries())
    .map(([status, rows]) => ({
      status,
      headcount: rows.length,
      payroll: rows.reduce((sum, row) => sum + row.salary, 0),
    }))
    .sort((a, b) => b.headcount - a.headcount);
}

function rowLine(values: Array<string | number>): string {
  return values.map(csvCell).join(",");
}

function exportCsv(
  overview: CompensationOverview,
  bands: SalaryBand[],
  generatedAt: Date | null
): void {
  const deptRows = getDepartmentRows(overview.employees);
  const statusRows = getStatusRows(overview.employees);
  const lines: string[] = [
    REPORT_TITLE,
    `Generated,${csvCell(reportDate(generatedAt))}`,
    "",
    "Executive summary",
    rowLine(["Metric", "Value"]),
    ...getSummaryRows(overview).map((row) => rowLine([row.label, row.value])),
    "",
    "Department breakdown",
    rowLine([
      "Department",
      "Headcount",
      "Payroll",
      "Average salary",
      "Average bonus %",
    ]),
    ...deptRows.map((row) =>
      rowLine([
        row.department,
        row.headcount,
        money(row.payroll),
        money(row.average),
        pct(row.bonusAvg),
      ])
    ),
    "",
    "Status breakdown",
    rowLine(["Status", "Headcount", "Payroll"]),
    ...statusRows.map((row) =>
      rowLine([row.status, row.headcount, money(row.payroll)])
    ),
    "",
    "Salary distribution",
    rowLine(["Band", "Employees", "Percent"]),
    ...bands.map((band) => rowLine([band.label, band.count, pct(band.pct)])),
    "",
    "Compensation mix",
    rowLine(["Component", "Percent"]),
    ...overview.mix.map((item) => rowLine([item.name, pct(item.pct)])),
    "",
    "Employee detail",
    rowLine([
      "Employee",
      "Title",
      "Department",
      "Salary",
      "Bonus %",
      "Last review",
      "Next review",
      "Status",
    ]),
    ...overview.employees.map((employee) =>
      rowLine([
        employee.name,
        employee.title,
        employee.dept,
        money(employee.salary),
        pct(employee.bonus),
        employee.last || "",
        employee.next || "",
        statusLabel(employee.status),
      ])
    ),
  ];

  downloadBlob(
    new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" }),
    `bloomhub-compensation-report-${stamp()}.csv`
  );
}

function xmlEscape(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function docParagraph(
  text: string,
  options: {
    size?: number;
    bold?: boolean;
    color?: string;
    spacing?: number;
  } = {}
): string {
  const size = options.size ?? 22;
  const spacing = options.spacing ?? 80;
  const bold = options.bold ? "<w:b/>" : "";
  const color = options.color ? `<w:color w:val="${options.color}"/>` : "";
  return `<w:p><w:pPr><w:spacing w:after="${spacing}"/></w:pPr><w:r><w:rPr>${bold}${color}<w:sz w:val="${size}"/></w:rPr><w:t>${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function docTable(
  headers: string[],
  rows: Array<Array<string | number>>
): string {
  const cell = (value: string | number, header = false) =>
    `<w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="E5E7EB"/><w:left w:val="single" w:sz="4" w:color="E5E7EB"/><w:bottom w:val="single" w:sz="4" w:color="E5E7EB"/><w:right w:val="single" w:sz="4" w:color="E5E7EB"/></w:tcBorders>${header ? '<w:shd w:fill="F3F4F6"/>' : ""}</w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr>${header ? "<w:b/>" : ""}<w:sz w:val="18"/><w:color w:val="${header ? "374151" : "111827"}"/></w:rPr><w:t>${xmlEscape(value)}</w:t></w:r></w:p></w:tc>`;
  const rowPr = "<w:trPr><w:cantSplit/></w:trPr>";
  const headerRow = `<w:tr>${rowPr}${headers.map((header) => cell(header, true)).join("")}</w:tr>`;
  const dataRows = rows
    .map(
      (row) =>
        `<w:tr>${rowPr}${row.map((value) => cell(value)).join("")}</w:tr>`
    )
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="E5E7EB"/><w:left w:val="single" w:sz="4" w:color="E5E7EB"/><w:bottom w:val="single" w:sz="4" w:color="E5E7EB"/><w:right w:val="single" w:sz="4" w:color="E5E7EB"/><w:insideH w:val="single" w:sz="4" w:color="E5E7EB"/><w:insideV w:val="single" w:sz="4" w:color="E5E7EB"/></w:tblBorders><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>${headerRow}${dataRows}</w:tbl>`;
}

function docSection(title: string): string {
  return docParagraph(title, {
    size: 24,
    bold: true,
    color: "111827",
    spacing: 60,
  });
}

const pdfStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: INK,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 14,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    color: MUTED,
    fontSize: 8,
  },
  badge: {
    backgroundColor: INK,
    color: "#ffffff",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: "bold",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  summaryCard: {
    width: "31.6%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    backgroundColor: "#fbfbfc",
    padding: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  summaryLabel: {
    color: MUTED,
    fontSize: 7,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: "bold",
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    marginBottom: 10,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f2",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeader: {
    backgroundColor: SOFT,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 5,
    fontSize: 7,
  },
  cellHeader: {
    color: "#374151",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: 6.5,
  },
  employeeCell: {
    fontSize: 6.5,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
    color: MUTED,
    fontSize: 7,
  },
});

function PdfTable({
  title,
  headers,
  rows,
  widths,
  compact = false,
  keepTogether = true,
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  widths?: number[];
  compact?: boolean;
  keepTogether?: boolean;
}) {
  return (
    <View wrap={keepTogether ? false : true} minPresenceAhead={120}>
      <Text style={pdfStyles.sectionTitle} minPresenceAhead={90}>
        {title}
      </Text>
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          {headers.map((header, index) => (
            <Text
              key={`${title}-header-${header}`}
              style={[
                pdfStyles.cell,
                pdfStyles.cellHeader,
                ...(compact ? [pdfStyles.employeeCell] : []),
                ...(widths?.[index] ? [{ flex: widths[index] }] : []),
              ]}
            >
              {header}
            </Text>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View
            key={`${title}-row-${rowIndex}`}
            wrap={false}
            style={[
              pdfStyles.tableRow,
              ...(rowIndex === rows.length - 1 ? [pdfStyles.tableRowLast] : []),
            ]}
          >
            {row.map((cell, cellIndex) => (
              <Text
                key={`${title}-cell-${rowIndex}-${cellIndex}`}
                style={[
                  pdfStyles.cell,
                  ...(compact ? [pdfStyles.employeeCell] : []),
                  ...(widths?.[cellIndex] ? [{ flex: widths[cellIndex] }] : []),
                ]}
              >
                {String(cell)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function PdfReportDocument({
  overview,
  bands,
  generatedAt,
}: CompensationReportsTabProps) {
  const departmentRows = getDepartmentRows(overview.employees);
  const statusRows = getStatusRows(overview.employees);

  return (
    <PdfDocument title={REPORT_TITLE}>
      <Page size="A4" style={pdfStyles.page} wrap>
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.title}>{REPORT_TITLE}</Text>
            <Text style={pdfStyles.subtitle}>
              Generated {reportDate(generatedAt)}
            </Text>
          </View>
          <Text style={pdfStyles.badge}>Confidential</Text>
        </View>

        <View style={pdfStyles.summaryGrid}>
          {getSummaryRows(overview).map((row) => (
            <View key={row.label} style={pdfStyles.summaryCard} wrap={false}>
              <Text style={pdfStyles.summaryLabel}>{row.label}</Text>
              <Text style={pdfStyles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <PdfTable
          title="Department breakdown"
          headers={[
            "Department",
            "Headcount",
            "Payroll",
            "Average salary",
            "Bonus",
          ]}
          rows={departmentRows.map((row) => [
            row.department,
            row.headcount,
            bam(row.payroll),
            bam(row.average),
            pct(row.bonusAvg),
          ])}
          widths={[1.7, 0.8, 1, 1.1, 0.8]}
        />

        <PdfTable
          title="Status breakdown"
          headers={["Status", "Headcount", "Payroll"]}
          rows={statusRows.map((row) => [
            row.status,
            row.headcount,
            bam(row.payroll),
          ])}
          widths={[1.5, 1, 1.2]}
        />

        <PdfTable
          title="Salary distribution"
          headers={["Band", "Employees", "Percent"]}
          rows={bands.map((band) => [band.label, band.count, pct(band.pct)])}
          widths={[1.5, 1, 1]}
        />

        <PdfTable
          title="Compensation mix"
          headers={["Component", "Percent"]}
          rows={overview.mix.map((item) => [item.name, pct(item.pct)])}
          widths={[1.8, 1]}
        />

        <PdfTable
          title="Employee detail"
          headers={[
            "Employee",
            "Title",
            "Department",
            "Salary",
            "Bonus",
            "Status",
          ]}
          rows={overview.employees.map((employee) => [
            employee.name,
            employee.title,
            employee.dept,
            bam(employee.salary),
            pct(employee.bonus),
            statusLabel(employee.status),
          ])}
          widths={[1.4, 1.8, 1.2, 0.9, 0.7, 0.9]}
          compact
          keepTogether={false}
        />

        <Text
          style={pdfStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `${REPORT_TITLE} | Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </PdfDocument>
  );
}

async function exportDocx(
  overview: CompensationOverview,
  bands: SalaryBand[],
  generatedAt: Date | null
): Promise<void> {
  const [{ default: JSZip }] = await Promise.all([import("jszip")]);
  const zip = new JSZip();
  const deptRows = getDepartmentRows(overview.employees);
  const statusRows = getStatusRows(overview.employees);

  const body = [
    docParagraph(REPORT_TITLE, {
      size: 36,
      bold: true,
      color: "111827",
      spacing: 40,
    }),
    docParagraph(`Generated: ${reportDate(generatedAt)}`, {
      size: 18,
      color: "6B7280",
      spacing: 180,
    }),
    docSection("Executive summary"),
    docTable(
      ["Metric", "Value"],
      getSummaryRows(overview).map((row) => [row.label, row.value])
    ),
    docSection("Department breakdown"),
    docTable(
      ["Department", "Headcount", "Payroll", "Average salary", "Average bonus"],
      deptRows.map((row) => [
        row.department,
        row.headcount,
        bam(row.payroll),
        bam(row.average),
        pct(row.bonusAvg),
      ])
    ),
    docSection("Status breakdown"),
    docTable(
      ["Status", "Headcount", "Payroll"],
      statusRows.map((row) => [row.status, row.headcount, bam(row.payroll)])
    ),
    docSection("Salary distribution"),
    docTable(
      ["Band", "Employees", "Percent"],
      bands.map((band) => [band.label, band.count, pct(band.pct)])
    ),
    docSection("Compensation mix"),
    docTable(
      ["Component", "Percent"],
      overview.mix.map((item) => [item.name, pct(item.pct)])
    ),
    docSection("Employee detail"),
    docTable(
      ["Employee", "Title", "Department", "Salary", "Bonus", "Status"],
      overview.employees.map((employee) => [
        employee.name,
        employee.title,
        employee.dept,
        bam(employee.salary),
        pct(employee.bonus),
        statusLabel(employee.status),
      ])
    ),
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>',
  ].join("");

  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  );
  zip
    .folder("_rels")
    ?.file(
      ".rels",
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
    );
  zip
    .folder("word")
    ?.file(
      "document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`
    );
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  downloadBlob(blob, `bloomhub-compensation-report-${stamp()}.docx`);
}

async function exportPdf(
  overview: CompensationOverview,
  bands: SalaryBand[],
  generatedAt: Date | null
): Promise<void> {
  const blob = await pdf(
    <PdfReportDocument
      overview={overview}
      bands={bands}
      generatedAt={generatedAt}
    />
  ).toBlob();
  downloadBlob(blob, `bloomhub-compensation-report-${stamp()}.pdf`);
}

export function CompensationReportsTab({
  overview,
  bands,
  generatedAt,
}: CompensationReportsTabProps) {
  const departmentRows = getDepartmentRows(overview.employees);
  const statusRows = getStatusRows(overview.employees);

  const handleExport = async (type: "csv" | "pdf" | "docx") => {
    try {
      if (type === "csv") exportCsv(overview, bands, generatedAt);
      if (type === "pdf") await exportPdf(overview, bands, generatedAt);
      if (type === "docx") await exportDocx(overview, bands, generatedAt);
      toast.success(`Report exported as ${type.toUpperCase()}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export report"
      );
    }
  };

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#171717]">
            Detailed compensation report
          </h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Complete payroll, salary distribution, mix, department, status, and
            employee-level compensation detail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["csv", "pdf", "docx"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleExport(type)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-3 text-sm font-medium text-[#171717] hover:bg-[#f3f4f6]"
            >
              <Download className="h-4 w-4" />
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {getSummaryRows(overview)
          .slice(0, 6)
          .map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-[#e5e7eb] p-4"
            >
              <div className="text-xs font-medium text-[#6b7280]">
                {row.label}
              </div>
              <div className="mt-1 text-xl font-semibold text-[#171717]">
                {row.value}
              </div>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ReportTable
          title="Department breakdown"
          headers={["Department", "Headcount", "Payroll", "Average", "Bonus"]}
          rows={departmentRows.map((row) => [
            row.department,
            row.headcount,
            bam(row.payroll),
            bam(row.average),
            pct(row.bonusAvg),
          ])}
        />
        <ReportTable
          title="Status breakdown"
          headers={["Status", "Headcount", "Payroll"]}
          rows={statusRows.map((row) => [
            row.status,
            row.headcount,
            bam(row.payroll),
          ])}
        />
        <ReportTable
          title="Salary distribution"
          headers={["Band", "Employees", "Percent"]}
          rows={bands.map((band) => [band.label, band.count, pct(band.pct)])}
        />
        <ReportTable
          title="Compensation mix"
          headers={["Component", "Percent"]}
          rows={overview.mix.map((item) => [item.name, pct(item.pct)])}
        />
      </div>

      <ReportTable
        title="Employee detail"
        headers={[
          "Employee",
          "Title",
          "Department",
          "Salary",
          "Bonus",
          "Status",
        ]}
        rows={overview.employees.map((employee) => [
          employee.name,
          employee.title,
          employee.dept,
          bam(employee.salary),
          pct(employee.bonus),
          statusLabel(employee.status),
        ])}
        className="mt-4"
      />
    </div>
  );
}

function ReportTable({
  title,
  headers,
  rows,
  className = "",
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[#e5e7eb] ${className}`}
    >
      <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm font-semibold text-[#171717]">
        {title}
      </div>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-white">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="border-b border-[#e5e7eb] px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#6b7280]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${title}-${index}`}
                className="border-b border-[#f3f4f6]"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 text-[#374151]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
