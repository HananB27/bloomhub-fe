"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SingleDatePickerProps {
  mode: "single";
  value?: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
  disabledDates?: (date: Date) => boolean;
}

interface RangeDatePickerProps {
  mode: "range";
  startValue?: string;
  endValue?: string;
  onChange: (range: { start: string; end: string }) => void;
  disabled?: boolean;
  startPlaceholder?: string;
  endPlaceholder?: string;
  disabledDates?: (date: Date) => boolean;
}

type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;
type Panel = "days" | "months" | "years";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const same = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const toStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const display = (d: Date) =>
  `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const parseDate = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, day] = s.split("-").map(Number);
  if (!y || !m || !day) return undefined;
  return sod(new Date(y, m - 1, day));
};

// Generate a range of years centred around current view year
const getYearRange = (centreYear: number): number[] => {
  const start = Math.floor(centreYear / 12) * 12 - 4;
  return Array.from({ length: 20 }, (_, i) => start + i);
};

// ─── Month Picker Panel ───────────────────────────────────────────────────────

function MonthPanel({
  viewMonth,
  viewYear,
  onSelect,
}: {
  viewMonth: number;
  viewYear: number;
  onSelect: (month: number) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium text-gray-400">{viewYear}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS_SHORT.map((m, i) => (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(i)}
            className={[
              "rounded-lg py-2 text-sm transition-colors",
              i === viewMonth
                ? "bg-zinc-800 font-medium text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Year Picker Panel ────────────────────────────────────────────────────────

function YearPanel({
  viewYear,
  onSelect,
  onPrevDecade,
  onNextDecade,
}: {
  viewYear: number;
  onSelect: (year: number) => void;
  onPrevDecade: () => void;
  onNextDecade: () => void;
}) {
  const years = getYearRange(viewYear);
  const label = `${years[0]} – ${years[years.length - 1]}`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onPrevDecade}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-base text-gray-500 hover:bg-gray-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNextDecade}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-base text-gray-500 hover:bg-gray-50"
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onSelect(y)}
            className={[
              "rounded-lg py-2 text-sm transition-colors",
              y === viewYear
                ? "bg-zinc-800 font-medium text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Calendar (days) ──────────────────────────────────────────────────────────

interface CalendarProps {
  mode: "single" | "range";
  viewYear: number;
  viewMonth: number;
  selStart?: Date;
  selEnd?: Date;
  hoverDate?: Date;
  disabledDates?: (date: Date) => boolean;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onMonthClick: () => void;
  onYearClick: () => void;
}

function Calendar({
  mode,
  viewYear,
  viewMonth,
  selStart,
  selEnd,
  hoverDate,
  disabledDates,
  onDayClick,
  onDayHover,
  onPrev,
  onNext,
  onMonthClick,
  onYearClick,
}: CalendarProps) {
  const today = sod(new Date());
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const rEnd =
    mode === "range" && selStart && !selEnd && hoverDate ? hoverDate : selEnd;
  const lo =
    selStart && rEnd
      ? sod(new Date(Math.min(selStart.getTime(), rEnd.getTime())))
      : undefined;
  const hi =
    selStart && rEnd
      ? sod(new Date(Math.max(selStart.getTime(), rEnd.getTime())))
      : undefined;

  const getDayClasses = (date: Date, other: boolean): string => {
    const ts = date.getTime();
    const base =
      "relative flex h-9 w-full cursor-pointer items-center justify-center rounded-lg text-sm transition-colors";

    if (disabledDates?.(date))
      return `${base} cursor-not-allowed text-gray-300`;
    if (other) return `${base} text-gray-300 hover:bg-gray-50`;

    if (mode === "single") {
      if (selStart && same(date, selStart))
        return `${base} bg-zinc-800 font-medium text-white shadow-sm`;
      return `${base} ${same(date, today) ? "font-bold text-zinc-900 underline underline-offset-4" : "text-gray-800"} hover:bg-gray-100`;
    }

    if (lo && hi) {
      const l = lo.getTime(),
        h = hi.getTime();
      if (ts === l && ts === h)
        return `${base} bg-zinc-800 font-medium text-white shadow-sm`;
      if (ts === l)
        return `${base} rounded-r-none bg-zinc-800 font-medium text-white shadow-sm`;
      if (ts === h)
        return `${base} rounded-l-none bg-zinc-800 font-medium text-white shadow-sm`;
      if (ts > l && ts < h)
        return `${base} rounded-none bg-zinc-100 text-zinc-900`;
    }

    if (selStart && !selEnd && same(date, selStart))
      return `${base} bg-zinc-800 font-medium text-white shadow-sm`;
    return `${base} ${same(date, today) ? "font-bold text-zinc-900 underline underline-offset-4" : "text-gray-800"} hover:bg-gray-100`;
  };

  const showTodayDot = (date: Date, other: boolean): boolean => {
    if (other || disabledDates?.(date) || !same(date, today)) return false;
    const ts = date.getTime();
    if (selStart && same(date, selStart)) return false;
    if (lo && hi && (ts === lo.getTime() || ts === hi.getTime())) return false;
    return true;
  };

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDow; i++) {
    const d = prevMonthDays - firstDow + 1 + i;
    const date = sod(new Date(viewYear, viewMonth - 1, d));
    cells.push(
      <button
        key={`p${i}`}
        type="button"
        tabIndex={-1}
        className={getDayClasses(date, true)}
        onClick={() => onDayClick(date)}
        onMouseEnter={() => onDayHover(date)}
      >
        {d}
      </button>
    );
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = sod(new Date(viewYear, viewMonth, d));
    const isDisabled = disabledDates?.(date);
    cells.push(
      <button
        key={d}
        type="button"
        disabled={isDisabled}
        className={getDayClasses(date, false)}
        onClick={() => !isDisabled && onDayClick(date)}
        onMouseEnter={() => onDayHover(date)}
      >
        {d}
        {showTodayDot(date, false) && (
          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-zinc-400" />
        )}
      </button>
    );
  }
  const remaining = 42 - firstDow - daysInMonth;
  for (let i = 1; i <= remaining; i++) {
    const date = sod(new Date(viewYear, viewMonth + 1, i));
    cells.push(
      <button
        key={`n${i}`}
        type="button"
        tabIndex={-1}
        className={getDayClasses(date, true)}
        onClick={() => onDayClick(date)}
        onMouseEnter={() => onDayHover(date)}
      >
        {i}
      </button>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMonthClick}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            {MONTHS[viewMonth]}
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <button
            type="button"
            onClick={onYearClick}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            {viewYear}
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-lg text-gray-500 hover:border-gray-300 hover:bg-gray-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-lg text-gray-500 hover:border-gray-300 hover:bg-gray-50"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-px">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="pb-2.5 pt-1 text-center text-[11px] font-medium text-gray-400"
          >
            {w}
          </div>
        ))}
        {cells}
      </div>
    </div>
  );
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

function Trigger({
  label,
  text,
  hasValue,
  open,
  disabled,
  onClick,
}: {
  label?: string;
  text: string;
  hasValue: boolean;
  open: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-xs font-medium text-gray-500">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onClick()}
        className={[
          "flex h-14 w-full min-w-40 items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 text-left transition-all shadow-sm",
          open
            ? "border-zinc-400 ring-4 ring-zinc-500/10 shadow-inner"
            : "border-zinc-200 hover:border-zinc-300",
          disabled
            ? "cursor-not-allowed bg-gray-50 opacity-60"
            : "cursor-pointer bg-white",
        ].join(" ")}
      >
        <span
          className={`text-sm ${hasValue ? "text-gray-900" : "text-gray-400"}`}
        >
          {text}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
      </button>
    </div>
  );
}

// ─── DatePicker ───────────────────────────────────────────────────────────────

export function DatePicker(props: DatePickerProps) {
  const today = sod(new Date());
  const [open, setOpen] = React.useState(false);
  const [panel, setPanel] = React.useState<Panel>("days");
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());
  const [yearRangeBase, setYearRangeBase] = React.useState(today.getFullYear());
  const [hoverDate, setHoverDate] = React.useState<Date | undefined>();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const [singleSel, setSingleSel] = React.useState<Date | undefined>(
    props.mode === "single" ? parseDate(props.value) : undefined
  );
  const [rangeStart, setRangeStart] = React.useState<Date | undefined>(
    props.mode === "range" ? parseDate(props.startValue) : undefined
  );
  const [rangeEnd, setRangeEnd] = React.useState<Date | undefined>(
    props.mode === "range" ? parseDate(props.endValue) : undefined
  );

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPanel("days");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta,
      y = viewYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    if (m < 0) {
      m = 11;
      y--;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const handleDayClick = (date: Date) => {
    if (props.mode === "single") {
      setSingleSel(date);
      props.onChange(toStr(date));
      setOpen(false);
      setPanel("days");
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(date);
        setRangeEnd(undefined);
        setHoverDate(undefined);
      } else {
        const s = date < rangeStart ? date : rangeStart;
        const e = date < rangeStart ? rangeStart : date;
        setRangeStart(s);
        setRangeEnd(e);
        setHoverDate(undefined);
        props.onChange({ start: toStr(s), end: toStr(e) });
        setOpen(false);
        setPanel("days");
      }
    }
  };

  const handleMonthSelect = (month: number) => {
    setViewMonth(month);
    setPanel("days");
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setYearRangeBase(year);
    setPanel("days");
  };

  const handleClear = () => {
    if (props.mode === "single") {
      setSingleSel(undefined);
      props.onChange("");
    } else {
      setRangeStart(undefined);
      setRangeEnd(undefined);
      setHoverDate(undefined);
      props.onChange({ start: "", end: "" });
    }
  };

  const daysBetween =
    rangeStart && rangeEnd
      ? Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000)
      : 0;

  const singleText = singleSel
    ? display(singleSel)
    : ((props as SingleDatePickerProps).placeholder ?? "Pick a date");
  const startText = rangeStart
    ? display(rangeStart)
    : ((props as RangeDatePickerProps).startPlaceholder ?? "Start date");
  const endText = rangeEnd
    ? display(rangeEnd)
    : ((props as RangeDatePickerProps).endPlaceholder ?? "End date");

  const handleOpen = () => {
    setOpen((o) => !o);
    setPanel("days");
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Triggers */}
      {props.mode === "single" ? (
        <Trigger
          text={singleText}
          hasValue={!!singleSel}
          open={open}
          disabled={props.disabled}
          onClick={handleOpen}
        />
      ) : (
        <div className="flex items-end gap-2">
          <Trigger
            label="Start date"
            text={startText}
            hasValue={!!rangeStart}
            open={open}
            disabled={props.disabled}
            onClick={handleOpen}
          />
          <span className="mb-2.5 text-sm text-gray-400">→</span>
          <Trigger
            label="End date"
            text={endText}
            hasValue={!!rangeEnd}
            open={open}
            disabled={props.disabled}
            onClick={handleOpen}
          />
        </div>
      )}

      {/* Popover */}
      {open && !props.disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[300px] rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-black/5">
          {panel === "days" && (
            <Calendar
              mode={props.mode}
              viewYear={viewYear}
              viewMonth={viewMonth}
              selStart={props.mode === "single" ? singleSel : rangeStart}
              selEnd={props.mode === "range" ? rangeEnd : undefined}
              hoverDate={hoverDate}
              disabledDates={props.disabledDates}
              onDayClick={handleDayClick}
              onDayHover={(d) => {
                if (props.mode === "range" && rangeStart && !rangeEnd)
                  setHoverDate(d);
              }}
              onPrev={() => changeMonth(-1)}
              onNext={() => changeMonth(1)}
              onMonthClick={() => setPanel("months")}
              onYearClick={() => {
                setYearRangeBase(viewYear);
                setPanel("years");
              }}
            />
          )}

          {panel === "months" && (
            <MonthPanel
              viewMonth={viewMonth}
              viewYear={viewYear}
              onSelect={handleMonthSelect}
            />
          )}

          {panel === "years" && (
            <YearPanel
              viewYear={viewYear}
              onSelect={handleYearSelect}
              onPrevDecade={() => setYearRangeBase((b) => b - 20)}
              onNextDecade={() => setYearRangeBase((b) => b + 20)}
            />
          )}

          {/* Footer — only on days panel */}
          {panel === "days" && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
              {props.mode === "range" && rangeStart && rangeEnd && (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-800 border border-zinc-200">
                  {daysBetween} day{daysBetween !== 1 ? "s" : ""}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-zinc-800 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-900 transition-all shadow-sm active:scale-95"
              >
                Done
              </button>
            </div>
          )}

          {/* Back button on month/year panels */}
          {panel !== "days" && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setPanel("days")}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
