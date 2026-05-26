"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { bonusApi, type BonusRecord } from "@/lib/api/compensation";

interface ProfileBonusesBlockProps {
  employeeId: number;
}

const TYPE_PILL_STYLES: Record<string, string> = {
  performance: "bg-[#dcfce7] text-[#15803d]",
  retention: "bg-[#e0e7ff] text-[#4338ca]",
  referral: "bg-[#ffe4e6] text-[#be123c]",
  project: "bg-[#ffedd5] text-[#c2410c]",
  education: "bg-[#fef3c7] text-[#b45309]",
  spot: "bg-[#f3f4f6] text-[#4b5563]",
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtAmount(amount: string | number, currency: string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return `${currency} —`;
  return `${currency} ${n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

export function ProfileBonusesBlock({ employeeId }: ProfileBonusesBlockProps) {
  const [bonuses, setBonuses] = useState<BonusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await bonusApi.listForEmployee(employeeId);
        if (cancelled) return;
        setBonuses(data);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load bonuses";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const totalAmount = bonuses.reduce(
    (sum, b) => sum + (parseFloat(b.amount) || 0),
    0
  );
  const currency = bonuses[0]?.currency ?? "BAM";

  return (
    <div className="col-span-12 mt-2 border-t border-[#e5e7eb] pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold tracking-tight text-[#171717]">
            Bonuses
          </h3>
          <p className="mt-0.5 text-[11px] text-[#6b7280]">
            All bonus payments recorded for this employee.
          </p>
        </div>
        {!loading && !error && bonuses.length > 0 ? (
          <div className="text-[11px] font-medium text-[#4b5563]">
            <span className="text-[#6b7280]">Total: </span>
            <strong className="font-mono font-semibold text-[#171717]">
              {currency} {totalAmount.toLocaleString("en-US")}
            </strong>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded bg-[#f3f4f6]" />
          <div className="h-10 animate-pulse rounded bg-[#f3f4f6]" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#b91c1c]">
          {error}
        </div>
      ) : bonuses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-[#e5e7eb] bg-[#fafaf9] py-6 text-center">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#f3f4f6] text-[#6b7280]">
            <Wallet className="h-4 w-4" />
          </div>
          <p className="text-[12px] font-medium text-[#171717]">
            No bonuses recorded
          </p>
          <p className="text-[11px] text-[#6b7280]">
            Bonuses logged for this employee appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#fafaf9] text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b7280]">
                <th scope="col" className="px-3 py-2">
                  Type
                </th>
                <th scope="col" className="px-3 py-2">
                  Amount
                </th>
                <th scope="col" className="px-3 py-2">
                  Effective date
                </th>
                <th scope="col" className="px-3 py-2">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {bonuses.map((b) => (
                <tr key={b.id} className="border-t border-[#e5e7eb]">
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded px-1.5 py-px text-[11px] font-medium ${
                        TYPE_PILL_STYLES[b.bonus_type] ??
                        "bg-[#f3f4f6] text-[#171717]"
                      }`}
                    >
                      {b.bonus_type_display}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono font-medium text-[#171717]">
                    {fmtAmount(b.amount, b.currency)}
                  </td>
                  <td className="px-3 py-2 text-[#6b7280]">
                    {fmtDate(b.effective_date)}
                  </td>
                  <td className="px-3 py-2 text-[#4b5563]">
                    {b.reason || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
