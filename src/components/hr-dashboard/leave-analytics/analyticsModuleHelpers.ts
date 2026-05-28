import type { LeaveType, LeaveStatus } from "@/types/vacations";
import {
  ALL_LEAVE_TYPES,
  ANNUAL_LEAVE_ALLOWANCE_DAYS,
  LEAVE_TYPE_CHART_COLORS,
} from "@/types/vacations";

const AVATAR_COLORS = ["green", "indigo", "rose", "orange", "gray"] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

export interface AnalyticsEmployee {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  team: string;
  avatarColor: AvatarColor;
}

const FIRST_NAMES = [
  "Aida", "Emir", "Lana", "Tarik", "Selma", "Adnan", "Mirza", "Ena",
  "Haris", "Amila", "Faruk", "Lejla", "Damir", "Maja", "Vedran", "Sanela",
  "Kenan", "Ajla", "Rijad", "Mia", "Edin", "Nina", "Jasmin", "Hana",
];

const LAST_NAMES = [
  "Salihović", "Hodžić", "Kovač", "Begić", "Mehić", "Delić", "Imamović",
  "Bašić", "Husić", "Mujić", "Kapidžić", "Tahirović", "Hadžić", "Šabić",
  "Krupalija", "Pašić", "Demir", "Karić", "Pleho", "Spahić", "Rizvanović",
  "Hasanović", "Suljić", "Vidović",
];

const DEPARTMENTS: { name: string; roles: string[] }[] = [
  { name: "Engineering", roles: ["Backend Dev", "Frontend Dev", "Platform Eng", "QA Eng", "DevOps"] },
  { name: "Product",     roles: ["PM", "Senior PM", "Product Designer"] },
  { name: "Design",      roles: ["UI Designer", "UX Designer", "Design Lead"] },
  { name: "People",      roles: ["HR Generalist", "Talent Lead", "People Partner"] },
  { name: "Finance",     roles: ["Accountant", "Finance Manager", "Controller"] },
  { name: "Marketing",   roles: ["Content Lead", "Growth Marketer", "Brand Designer"] },
  { name: "Operations",  roles: ["Ops Lead", "Office Manager", "IT Support"] },
];

const TEAMS_BY_DEPT: Record<string, string[]> = {
  Engineering: ["Core Platform", "Cloud", "Web Apps", "Mobile"],
  Product:     ["Growth", "Core", "Insights"],
  Design:      ["Product Design", "Brand"],
  People:      ["HR Ops", "Talent"],
  Finance:     ["Controlling", "AP/AR"],
  Marketing:   ["Content", "Growth"],
  Operations:  ["Workplace", "IT"],
};

const mulberry32 = (seed: number) => {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const buildDirectory = (): AnalyticsEmployee[] => {
  const rand = mulberry32(42);
  const total = 24;
  const out: AnalyticsEmployee[] = [];
  for (let i = 0; i < total; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last  = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const dept  = DEPARTMENTS[i % DEPARTMENTS.length];
    const role  = dept.roles[Math.floor(rand() * dept.roles.length)];
    const teams = TEAMS_BY_DEPT[dept.name] || ["General"];
    const team  = teams[Math.floor(rand() * teams.length)];
    const color = AVATAR_COLORS[Math.floor(rand() * AVATAR_COLORS.length)];
    out.push({
      id: i + 1,
      firstName: first,
      lastName: last,
      role,
      department: dept.name,
      team,
      avatarColor: color,
    });
  }
  return out;
};

export const DIRECTORY: AnalyticsEmployee[] = buildDirectory();

export interface LeaveEntry {
  id: string;
  employeeId: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: LeaveStatus;
}

const addDays = (date: Date, n: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const isWeekend = (d: Date) => {
  const w = d.getDay();
  return w === 0 || w === 6;
};
const workingDaysBetween = (start: Date, end: Date) => {
  let count = 0;
  const s = new Date(start);
  while (s <= end) {
    if (!isWeekend(s)) count++;
    s.setDate(s.getDate() + 1);
  }
  return count;
};

export const ANCHOR_TODAY = new Date("2026-04-30");

const generateLeaves = (): LeaveEntry[] => {
  const out: LeaveEntry[] = [];
  let nextId = 1000;
  const startWindow = new Date("2024-01-01");
  const endWindow = new Date("2026-05-31");

  DIRECTORY.forEach((emp) => {
    const rand = mulberry32(emp.id * 13 + 7);
    const baseEvents: Record<LeaveType, number> = {
      vacation:    5 + Math.floor(rand() * 3),
      sick:        2 + Math.floor(rand() * 3),
      wfh:         8 + Math.floor(rand() * 10),
      personal:    1 + Math.floor(rand() * 2),
      maternity:   rand() < 0.06 ? 1 : 0,
      paternity:   rand() < 0.08 ? 1 : 0,
      unpaid:      rand() < 0.1 ? 1 : 0,
      bereavement: rand() < 0.05 ? 1 : 0,
    };

    ALL_LEAVE_TYPES.forEach((typeId) => {
      const totalEvents = Math.round(baseEvents[typeId] * 2.5);
      for (let i = 0; i < totalEvents; i++) {
        const span = (endWindow.getTime() - startWindow.getTime()) / 86400000;
        const offset = Math.floor(rand() * span);
        const start = addDays(startWindow, offset);
        if (isWeekend(start)) start.setDate(start.getDate() + 1);

        let len: number;
        if (typeId === "vacation") len = 2 + Math.floor(rand() * 8);
        else if (typeId === "maternity") len = 90 + Math.floor(rand() * 30);
        else if (typeId === "paternity") len = 5 + Math.floor(rand() * 10);
        else if (typeId === "sick") len = 1 + Math.floor(rand() * 4);
        else if (typeId === "wfh") len = 1 + Math.floor(rand() * 2);
        else if (typeId === "bereavement") len = 2 + Math.floor(rand() * 3);
        else if (typeId === "unpaid") len = 3 + Math.floor(rand() * 5);
        else len = 1 + Math.floor(rand() * 2);

        const end = addDays(start, len - 1);
        const workDays = Math.max(workingDaysBetween(start, end), 1);

        let status: LeaveStatus = "approved";
        const r = rand();
        if (start > ANCHOR_TODAY) {
          status = r < 0.18 ? "pending" : "approved";
        } else if (r < 0.02) {
          status = "rejected";
        }

        out.push({
          id: `LV-${nextId++}`,
          employeeId: emp.id,
          type: typeId,
          startDate: toISODate(start),
          endDate: toISODate(end),
          workingDays: workDays,
          status,
        });
      }
    });
  });

  out.sort((a, b) => b.startDate.localeCompare(a.startDate));
  return out;
};

export const LEAVES: LeaveEntry[] = generateLeaves();

// ----- Aggregations --------------------------------------------------------

export interface MonthRow {
  monthIdx: number;
  monthLabel: string;
  total: number;
  byType: Record<LeaveType, number>;
}

const emptyByType = (): Record<LeaveType, number> =>
  Object.fromEntries(ALL_LEAVE_TYPES.map((id) => [id, 0])) as Record<LeaveType, number>;

export const monthlyByType = (
  year: number,
  leaves: LeaveEntry[] = LEAVES,
  statuses: LeaveStatus[] = ["approved"]
): MonthRow[] => {
  const rows: MonthRow[] = Array.from({ length: 12 }, (_, i) => ({
    monthIdx: i,
    monthLabel: new Date(year, i, 1).toLocaleString("en-US", { month: "short" }),
    total: 0,
    byType: emptyByType(),
  }));
  leaves.forEach((lv) => {
    if (!statuses.includes(lv.status)) return;
    const s = new Date(lv.startDate);
    const e = new Date(lv.endDate);
    const day = new Date(s);
    while (day <= e) {
      if (day.getFullYear() === year && !isWeekend(day)) {
        const m = day.getMonth();
        rows[m].byType[lv.type] += 1;
        rows[m].total += 1;
      }
      day.setDate(day.getDate() + 1);
    }
  });
  return rows;
};

export const yearTotalsByType = (year: number, leaves: LeaveEntry[] = LEAVES) => {
  const out = emptyByType();
  leaves.forEach((lv) => {
    if (lv.status !== "approved") return;
    const s = new Date(lv.startDate);
    const e = new Date(lv.endDate);
    const day = new Date(s);
    while (day <= e) {
      if (day.getFullYear() === year && !isWeekend(day)) {
        out[lv.type] += 1;
      }
      day.setDate(day.getDate() + 1);
    }
  });
  return out;
};

export interface DeptBreakdownRow {
  department: string;
  headcount: number;
  byType: Record<LeaveType, number>;
  total: number;
}

export const departmentBreakdown = (year: number): DeptBreakdownRow[] => {
  const map: Record<string, DeptBreakdownRow> = {};
  DIRECTORY.forEach((emp) => {
    if (!map[emp.department]) {
      map[emp.department] = {
        department: emp.department,
        headcount: 0,
        byType: emptyByType(),
        total: 0,
      };
    }
    map[emp.department].headcount++;
  });
  LEAVES.forEach((lv) => {
    if (lv.status !== "approved") return;
    const emp = DIRECTORY.find((e) => e.id === lv.employeeId);
    if (!emp) return;
    const s = new Date(lv.startDate);
    const e = new Date(lv.endDate);
    const day = new Date(s);
    while (day <= e) {
      if (day.getFullYear() === year && !isWeekend(day)) {
        map[emp.department].byType[lv.type] += 1;
        map[emp.department].total += 1;
      }
      day.setDate(day.getDate() + 1);
    }
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
};

export interface EmployeeSummaryRow extends AnalyticsEmployee {
  byType: Record<LeaveType, number>;
  total: number;
  vacationUsed: number;
  vacationRemaining: number;
  upcoming: number;
}

export const employeeSummary = (year: number): EmployeeSummaryRow[] => {
  return DIRECTORY.map((emp) => {
    const empLeaves = LEAVES.filter((l) => l.employeeId === emp.id);
    const byType = emptyByType();
    let total = 0;
    empLeaves.forEach((lv) => {
      if (lv.status !== "approved") return;
      const s = new Date(lv.startDate);
      const e = new Date(lv.endDate);
      const day = new Date(s);
      while (day <= e) {
        if (day.getFullYear() === year && !isWeekend(day)) {
          byType[lv.type] += 1;
          total += 1;
        }
        day.setDate(day.getDate() + 1);
      }
    });
    return {
      ...emp,
      byType,
      total,
      vacationUsed: byType.vacation,
      vacationRemaining: Math.max(ANNUAL_LEAVE_ALLOWANCE_DAYS - byType.vacation, 0),
      upcoming: empLeaves.filter(
        (l) => l.startDate > toISODate(ANCHOR_TODAY) && l.status !== "rejected"
      ).length,
    };
  }).sort((a, b) => b.total - a.total);
};

export interface AvailDay {
  date: string;
  dom: number;
  weekday: string;
  weekdayShort: string;
  monthLabel: string;
  isWeekend: boolean;
  isToday: boolean;
  monthStart: boolean;
}

export const teamAvailability = (startDate: Date, numDays: number): AvailDay[] => {
  const days: AvailDay[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = addDays(startDate, i);
    days.push({
      date: toISODate(d),
      dom: d.getDate(),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      weekdayShort: d.toLocaleDateString("en-US", { weekday: "short" }),
      monthLabel: d.toLocaleDateString("en-US", { month: "short" }),
      isWeekend: isWeekend(d),
      isToday: toISODate(d) === toISODate(ANCHOR_TODAY),
      monthStart: d.getDate() === 1,
    });
  }
  return days;
};

export const leaveOnDay = (employeeId: number, dateISO: string): LeaveEntry | undefined =>
  LEAVES.find(
    (lv) =>
      lv.employeeId === employeeId &&
      lv.startDate <= dateISO &&
      lv.endDate >= dateISO &&
      lv.status === "approved"
  );

export interface YoYRow {
  year: number;
  totals: Record<LeaveType, number>;
  total: number;
}

export const yearOverYear = (): YoYRow[] => {
  const curr = ANCHOR_TODAY.getFullYear();
  return [curr - 2, curr - 1, curr].map((y) => {
    const totals = yearTotalsByType(y);
    const total = Object.values(totals).reduce((s, n) => s + n, 0);
    return { year: y, totals, total };
  });
};

export interface PeriodKpis {
  total: number;
  onLeaveToday: number;
  sickRate: number;
  avgPerEmployee: number;
  pending: number;
  headcount: number;
}

export const periodKpis = (year: number): PeriodKpis => {
  const totals = yearTotalsByType(year);
  const total = Object.values(totals).reduce((s, n) => s + n, 0);
  const headcount = DIRECTORY.length;
  const todayISO = toISODate(ANCHOR_TODAY);
  const onLeaveToday = DIRECTORY.filter((emp) => leaveOnDay(emp.id, todayISO)).length;
  const sickRate = total ? totals.sick / total : 0;
  const avgPerEmployee = headcount ? total / headcount : 0;
  const pending = LEAVES.filter((l) => l.status === "pending").length;
  return { total, onLeaveToday, sickRate, avgPerEmployee, pending, headcount };
};

export const employeeRecentLeaves = (employeeId: number, limit = 12): LeaveEntry[] =>
  LEAVES.filter((l) => l.employeeId === employeeId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, limit);

export { addDays, toISODate, isWeekend };
export { LEAVE_TYPE_CHART_COLORS };
