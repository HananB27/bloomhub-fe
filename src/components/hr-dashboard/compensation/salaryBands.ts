import type { CompensationEmployee, SalaryBand } from "@/lib/api/compensation";

export const BAND_COUNT = 6;

/** Effective monthly compensation = base salary + (base * bonus%/12)/100. */
export function effectiveSalary(employee: CompensationEmployee): number {
  return employee.salary + (employee.salary * (employee.bonus ?? 0)) / 100;
}

/** Round a BAM amount to nearest 100 for clean band edges. */
function roundEdge(n: number): number {
  return Math.round(n / 100) * 100;
}

/** "BAM 2.3k", "BAM 850", "BAM 6k". Stays compact for chart labels. */
export function formatBamCompact(n: number): string {
  if (n >= 1000) {
    const k = (n / 1000).toFixed(1).replace(/\.0$/, "");
    return `BAM ${k}k`;
  }
  return `BAM ${Math.round(n).toLocaleString("en-US")}`;
}

export function formatBamFull(n: number): string {
  return `BAM ${Math.round(n).toLocaleString("en-US")}`;
}

export interface DynamicBandDef {
  label: string;
  min: number;
  max: number; // POSITIVE_INFINITY for top bucket
}

/**
 * Build N equal-width bands across the salary range. Bottom band starts at the
 * minimum effective salary; top band is open-ended (min .. ∞). Edges rounded
 * to nearest 100 BAM for readable labels.
 *
 * Edge cases:
 *  - empty input → empty array
 *  - single value → 1 band containing that value, 5 empty placeholder bands
 *  - all equal values → same as above
 */
export function buildDynamicBandDefs(
  values: number[],
  count: number = BAND_COUNT
): DynamicBandDef[] {
  const filtered = values.filter((v) => Number.isFinite(v) && v > 0);
  if (filtered.length === 0) return [];

  const min = roundEdge(Math.min(...filtered));
  const max = Math.max(...filtered);

  if (max <= min) {
    const defs: DynamicBandDef[] = [];
    for (let i = 0; i < count; i++) {
      defs.push({
        label: i === 0 ? `${formatBamCompact(min)} +` : "—",
        min: i === 0 ? min : Number.POSITIVE_INFINITY,
        max: Number.POSITIVE_INFINITY,
      });
    }
    return defs;
  }

  // Equal-width across [min, roundedMax]. Top edge is open-ended so anyone
  // above sits in the last bucket regardless of rounding.
  const roundedMax = roundEdge(max);
  const step = Math.max(100, roundEdge((roundedMax - min) / count));

  const defs: DynamicBandDef[] = [];
  for (let i = 0; i < count; i++) {
    const lo = min + step * i;
    const hi =
      i === count - 1 ? Number.POSITIVE_INFINITY : min + step * (i + 1);
    defs.push({
      label:
        i === count - 1
          ? `${formatBamCompact(lo)} +`
          : `${formatBamCompact(lo)}–${formatBamCompact(hi)}`,
      min: lo,
      max: hi,
    });
  }
  return defs;
}

export interface DynamicBand extends DynamicBandDef {
  count: number;
  pct: number;
}

export function computeSalaryBands(
  employees: CompensationEmployee[],
  count: number = BAND_COUNT
): DynamicBand[] {
  const values = employees.map(effectiveSalary);
  const defs = buildDynamicBandDefs(values, count);
  if (defs.length === 0) return [];
  const total = values.filter((v) => v > 0).length || 1;
  return defs.map((def) => {
    const inBand = values.filter((v) => v >= def.min && v < def.max).length;
    return {
      ...def,
      count: inBand,
      pct: Number(((inBand / total) * 100).toFixed(2)),
    };
  });
}

/** Backwards-compatible projection to legacy SalaryBand shape (for panels). */
export function toLegacyBands(bands: DynamicBand[]): SalaryBand[] {
  return bands.map((b) => ({ label: b.label, count: b.count, pct: b.pct }));
}
