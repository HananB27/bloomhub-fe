"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { AlertCircle, Check, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "../../ui/button";
import { DatePicker } from "../../DatePicker";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { cn } from "../../ui/utils";
import { StatusPill, TechBadge } from "../atoms";
import { PROJECT_STATUSES, STAGES, STAGE_BY_ID } from "../projectsData";
import type { Project, ProjectStageId, ProjectStatus } from "../types";
import { employeeApi } from "@/lib/api/modules/employees";
import { technologyTagsApi } from "@/lib/api/modules/technology-tags";
import type { TechnologyTag } from "@/types/technology-tags";
import { searchTech } from "@/lib/tech/techCatalog";

export interface CreateProjectFormValues {
  name: string;
  code: string;
  client: string;
  status: ProjectStatus;
  stage: ProjectStageId;
  description: string;
  start_date: string;
  end_date: string;
  technologies: string[];
}

interface CreateProjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (form: CreateProjectFormValues) => void;
}

const STEPS = [
  { n: 1, l: "Basics" },
  { n: 2, l: "Timeline" },
  { n: 3, l: "Team & tech" },
  { n: 4, l: "Review" },
];

const CLIENT_OPTIONS = [
  "Internal",
  "Acme Logistics",
  "Northwind Retail",
  "BlueWave Studios",
  "Lumen Health",
  "Other",
];

const EMPTY: CreateProjectFormValues & { techInput: string } = {
  name: "",
  code: "",
  client: "Internal",
  status: "Active",
  stage: "intake",
  description: "",
  start_date: "",
  end_date: "",
  technologies: [],
  techInput: "",
};

const CODE_STOP_WORDS = new Set([
  "project",
  "the",
  "a",
  "an",
  "of",
  "and",
  "for",
  "to",
]);
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const CODE_TARGET_LEN = 3;
const CODE_MAX_LEN = 4;

/**
 * Split a raw token into camelCase / PascalCase / kebab / snake / digit
 * sub-tokens. `"BloomHub"` → `["Bloom", "Hub"]`, `"web3-api"` → `["web", "3", "api"]`.
 */
function splitToken(raw: string): string[] {
  return raw
    .replace(/[_\-/.]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);
}

function consonants(word: string): string {
  return word
    .split("")
    .filter((c) => /[A-Za-z]/.test(c) && !VOWELS.has(c.toLowerCase()))
    .join("");
}

/** Pull a "code shape" from a single word: first letter + remaining consonants. */
function squeezeWord(word: string, take: number): string {
  if (!word) return "";
  if (take <= 0) return "";
  const first = word[0];
  const rest = consonants(word.slice(1));
  return (first + rest).slice(0, take).toUpperCase();
}

export function deriveProjectCode(name: string): string {
  if (!name.trim()) return "";

  const rawTokens = name.trim().split(/\s+/);
  const tokens = rawTokens.flatMap(splitToken);
  if (tokens.length === 0) return "";

  const significant = tokens.filter(
    (w) => !CODE_STOP_WORDS.has(w.toLowerCase())
  );
  const pool = significant.length > 0 ? significant : tokens;

  // Multi-token: start with one initial per token (max 4).
  if (pool.length >= CODE_TARGET_LEN) {
    return pool
      .slice(0, CODE_MAX_LEN)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  // 1–2 tokens: build initials, then pad with consonants of the longest token
  // until the code reaches the target length. "BloomHub" → B + H + (B from Hub
  // consonants) → "BHB". "Atlas" → A + T + L → "ATL".
  const initials = pool
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  if (initials.length >= CODE_TARGET_LEN)
    return initials.slice(0, CODE_MAX_LEN);

  // Pad with consonants from the LAST significant token first, then fall back
  // to the longest token. Picking the last token keeps codes intuitive for
  // brand-style names: "BloomHub" → "BHB" (B + H + B from Hub), rather than
  // "BHL" (which would come from Bloom's consonants).
  const last = pool[pool.length - 1] ?? "";
  const longest = [...pool].sort((a, b) => b.length - a.length)[0] ?? "";
  let out = initials;
  const padFrom = (word: string) => {
    for (const ch of consonants(word.slice(1)).toUpperCase()) {
      if (out.length >= CODE_TARGET_LEN) return;
      if (!out.endsWith(ch) || out.length + 1 <= CODE_TARGET_LEN) out += ch;
    }
  };
  padFrom(last);
  if (out.length < CODE_TARGET_LEN && longest && longest !== last)
    padFrom(longest);
  if (out.length < CODE_TARGET_LEN && longest) {
    // Last resort: include remaining letters (e.g. vowels) for short tokens.
    out =
      squeezeWord(longest, CODE_TARGET_LEN) ||
      longest.slice(0, CODE_TARGET_LEN).toUpperCase();
  }
  return out.slice(0, CODE_MAX_LEN);
}

export function CreateProjectDrawer({
  open,
  onOpenChange,
  onCreate,
}: CreateProjectDrawerProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateProjectFormValues, string>>
  >({});
  const [codeTouched, setCodeTouched] = useState(false);
  const [tagCatalog, setTagCatalog] = useState<TechnologyTag[]>([]);

  // Pull the tech-tag catalogue from /api/employees so the picker mirrors
  // what employees can already self-assign. Falls back to the DEFAULT list
  // shipped in technologyTagsApi if the request fails.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    employeeApi
      .listEmployees({ page_size: 200 })
      .then((res) => {
        if (cancelled) return;
        setTagCatalog(technologyTagsApi.getAllTags(res.results));
      })
      .catch(() => {
        if (cancelled) return;
        setTagCatalog(technologyTagsApi.getAllTags([]));
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredTags = useMemo(() => {
    const q = form.techInput.trim();
    if (!q) return [] as { id: string; name: string }[];
    const selected = new Set(form.technologies.map((t) => t.toLowerCase()));

    // Merge the global brand catalogue with backend-supplied tags so the
    // picker surfaces every known tech, not just the seeded subset.
    const globalHits = searchTech(q, 30).map((b) => ({
      id: `g:${b.slug}:${b.name}`,
      name: b.name,
    }));
    const backendHits = tagCatalog
      .filter((t) => t.name.toLowerCase().includes(q.toLowerCase()))
      .map((t) => ({ id: `b:${t.id}`, name: t.name }));

    const seen = new Set<string>();
    const out: { id: string; name: string }[] = [];
    for (const h of [...globalHits, ...backendHits]) {
      const key = h.name.toLowerCase();
      if (selected.has(key) || seen.has(key)) continue;
      seen.add(key);
      out.push(h);
      if (out.length >= 20) break;
    }
    return out;
  }, [tagCatalog, form.techInput, form.technologies]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      code: codeTouched ? f.code : deriveProjectCode(name),
    }));
  };

  const onCodeChange = (code: string) => {
    setCodeTouched(true);
    set("code", code.toUpperCase());
  };

  const validate = (s: number) => {
    const e: typeof errors = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = "Project name is required";
      if (!form.code.trim()) e.code = "Code is required";
    }
    if (s === 2) {
      if (!form.start_date) e.start_date = "Start date is required";
      if (form.end_date && form.start_date && form.end_date < form.start_date)
        e.end_date = "End date must be after start";
    }
    return e;
  };

  const reset = () => {
    setStep(1);
    setForm(EMPTY);
    setErrors({});
    setCodeTouched(false);
  };

  const handleNext = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
  };

  const handleSubmit = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      const { techInput: _unused, ...payload } = form;
      void _unused;
      onCreate(payload);
      reset();
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const addTech = () => {
    const t = form.techInput.trim();
    if (t && !form.technologies.includes(t))
      set("technologies", [...form.technologies, t]);
    set("techInput", "");
  };
  const removeTech = (t: string) =>
    set(
      "technologies",
      form.technologies.filter((x) => x !== t)
    );
  const onTechKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTech();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[540px] flex-col gap-0 border-gray-200 bg-white p-0 text-gray-900 sm:max-w-[540px]"
      >
        <SheetHeader className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white px-[22px] pb-3.5 pt-5">
          <div className="text-[11px] font-medium text-gray-700">
            New project
          </div>
          <SheetTitle className="text-[17px] font-semibold tracking-tight text-gray-900">
            Create a project
          </SheetTitle>
          <SheetDescription className="sr-only">
            Multi-step wizard to define project basics, timeline, team, and
            confirm.
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-0 border-b border-gray-200 bg-gray-50 px-[22px] py-3">
          {STEPS.map((s, i) => {
            const isActive = step === s.n;
            const isDone = step > s.n;
            return (
              <div
                key={s.n}
                className={cn(
                  "flex flex-1 items-center gap-2 text-[12px]",
                  isActive
                    ? "font-semibold text-gray-900"
                    : isDone
                      ? "font-medium text-green-600"
                      : "font-medium text-gray-500"
                )}
              >
                <div
                  className={cn(
                    "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-500",
                    isActive && "border-gray-900 bg-gray-900 text-white",
                    isDone && "border-green-600 bg-green-600 text-white"
                  )}
                >
                  {isDone ? <Check className="h-2.5 w-2.5" /> : s.n}
                </div>
                <span>{s.l}</span>
                {i < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "ml-1 h-px flex-1",
                      isDone ? "bg-green-600/40" : "bg-gray-200"
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-[22px]">
          {step === 1 ? (
            <div className="grid grid-cols-12 gap-4">
              <FieldWrap
                span={8}
                label="Project name"
                required
                error={errors.name}
              >
                <Input
                  autoFocus
                  value={form.name}
                  placeholder="e.g. Atlas"
                  onChange={(e) => onNameChange(e.target.value)}
                />
              </FieldWrap>
              <FieldWrap span={4} label="Code" required error={errors.code}>
                <Input
                  value={form.code}
                  maxLength={4}
                  placeholder="ATL"
                  className="font-mono"
                  onChange={(e) => onCodeChange(e.target.value)}
                />
              </FieldWrap>
              <FieldWrap span={6} label="Client">
                <Select
                  value={form.client}
                  onValueChange={(v) => set("client", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap span={6} label="Status">
                <Select
                  value={form.status}
                  onValueChange={(v) => set("status", v as ProjectStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap span={12} label="Stage">
                <Select
                  value={form.stage}
                  onValueChange={(v) => set("stage", v as ProjectStageId)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap span={12} label="Description">
                <Textarea
                  rows={4}
                  placeholder="What is this project?"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </FieldWrap>
            </div>
          ) : step === 2 ? (
            <div className="grid grid-cols-12 gap-4">
              <FieldWrap
                span={6}
                label="Start date"
                required
                error={errors.start_date}
              >
                <DatePicker
                  mode="single"
                  size="compact"
                  value={form.start_date}
                  onChange={(d) => set("start_date", d)}
                  placeholder="Pick start date"
                />
              </FieldWrap>
              <FieldWrap span={6} label="End date" error={errors.end_date}>
                <DatePicker
                  mode="single"
                  size="compact"
                  value={form.end_date}
                  onChange={(d) => set("end_date", d)}
                  placeholder="Pick end date"
                  disabledDates={
                    form.start_date
                      ? (date) => date < new Date(form.start_date)
                      : undefined
                  }
                />
              </FieldWrap>
            </div>
          ) : step === 3 ? (
            <div className="space-y-[18px]">
              <div>
                <Label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                  Technologies
                </Label>
                {form.technologies.length > 0 ? (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {form.technologies.map((t) => (
                      <TechBadge
                        key={t}
                        name={t}
                        onRemove={() => removeTech(t)}
                      />
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
                  <Search className="h-3.5 w-3.5 text-gray-500" />
                  <Input
                    placeholder="Search the tech catalog or add a custom tag…"
                    value={form.techInput}
                    onChange={(e) => set("techInput", e.target.value)}
                    onKeyDown={onTechKey}
                    className="h-9 border-0 bg-transparent px-0 text-[13px] text-gray-900 shadow-none placeholder:text-gray-500 focus-visible:ring-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTech}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                {form.techInput.trim() && filteredTags.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {filteredTags.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (!form.technologies.includes(t.name)) {
                            set("technologies", [...form.technologies, t.name]);
                          }
                          set("techInput", "");
                        }}
                        className="rounded-full"
                      >
                        <TechBadge name={t.name} size="sm" />
                      </button>
                    ))}
                  </div>
                ) : form.techInput.trim() ? (
                  <div className="mt-2.5 text-[11px] text-gray-700">
                    No catalog match — press Enter to add &quot;
                    {form.techInput.trim()}&quot; as a custom tag.
                  </div>
                ) : null}
              </div>
              <div>
                <Label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                  Members
                </Label>
                <p className="text-[12px] text-gray-700">
                  Invite team members and assign roles after creating the
                  project.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <ReviewRow
                  label="Name"
                  value={<strong>{form.name || "—"}</strong>}
                />
                <ReviewRow
                  label="Code"
                  value={
                    <strong className="font-mono">{form.code || "—"}</strong>
                  }
                />
                <ReviewRow
                  label="Client"
                  value={<strong>{form.client}</strong>}
                />
                <ReviewRow
                  label="Status"
                  value={<StatusPill status={form.status} />}
                />
                <ReviewRow
                  label="Stage"
                  value={<strong>{STAGE_BY_ID[form.stage]?.label}</strong>}
                />
                <ReviewRow
                  label="Timeline"
                  value={
                    <strong>{`${form.start_date || "—"} → ${form.end_date || "—"}`}</strong>
                  }
                />
                <ReviewRow
                  label="Technologies"
                  value={
                    <strong>
                      {form.technologies.length
                        ? form.technologies.join(", ")
                        : "—"}
                    </strong>
                  }
                  last
                />
              </div>
              <div className="mt-3.5 rounded-lg bg-blue-50 px-3 py-2.5 text-[12px] text-blue-700">
                You&apos;ll be able to add members, link documents, and log time
                after the project is created.
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2.5 border-t border-gray-200 bg-gray-50 px-[22px] py-3.5">
          <Button
            variant="outline"
            onClick={
              step === 1
                ? () => handleClose(false)
                : () => setStep((s) => s - 1)
            }
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex-1" />
          <span className="mr-2 text-[12px] text-gray-700">
            Step {step} of 4
          </span>
          {step < 4 ? (
            <Button onClick={handleNext}>
              Continue <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Check className="mr-1.5 h-3.5 w-3.5" /> Create project
            </Button>
          )}
        </footer>
      </SheetContent>
    </Sheet>
  );
}

interface FieldWrapProps {
  span: number;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FieldWrap({ span, label, required, error, children }: FieldWrapProps) {
  return (
    <div className="space-y-1.5" style={{ gridColumn: `span ${span}` }}>
      <Label className="flex items-center gap-1 text-[12px] font-medium text-gray-700">
        {label}
        {required ? <span className="text-red-600">*</span> : null}
      </Label>
      {children}
      {error ? (
        <div className="flex items-center gap-1 text-[11px] font-medium text-red-600">
          <AlertCircle className="h-3 w-3" /> {error}
        </div>
      ) : null}
    </div>
  );
}

interface ReviewRowProps {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}

function ReviewRow({ label, value, last }: ReviewRowProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-4 px-3.5 py-2.5 text-[13px]",
        !last && "border-b border-gray-200"
      )}
      style={{ gridTemplateColumns: "140px 1fr" }}
    >
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
