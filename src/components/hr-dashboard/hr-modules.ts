import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  MapPin,
  Megaphone,
  MessageSquare,
  Network,
  Package,
  Star,
  UserPlus,
  Users,
  Settings,
} from "lucide-react";

export type HrModuleId =
  | "dashboard"
  | "vacations"
  | "profiles"
  | "reviews"
  | "onboarding"
  | "training"
  | "compensation"
  | "feedback"
  | "timetracking"
  | "mobility"
  | "documents"
  | "assets"
  | "orgchart"
  | "analytics"
  | "announcements"
  | "admin";

export interface HrModule {
  id: HrModuleId;
  label: string;
  icon: LucideIcon;
}

export const HR_MODULES: HrModule[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "vacations", label: "Vacations", icon: Calendar },
  { id: "profiles", label: "Employee Profiles", icon: Users },
  { id: "reviews", label: "Performance Reviews", icon: Star },
  { id: "onboarding", label: "Onboarding", icon: UserPlus },
  { id: "training", label: "Training & Development", icon: GraduationCap },
  { id: "compensation", label: "Compensation", icon: DollarSign },
  { id: "feedback", label: "Feedback & Surveys", icon: MessageSquare },
  { id: "timetracking", label: "Time Tracking", icon: Clock },
  { id: "mobility", label: "Internal Mobility", icon: MapPin },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "assets", label: "Asset Management", icon: Package },
  { id: "orgchart", label: "Org Chart", icon: Network },
  { id: "analytics", label: "Leave Analytics", icon: BarChart3 },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "admin", label: "Admin Panel", icon: Settings },
];

export function getModuleById(id: HrModuleId): HrModule | undefined {
  return HR_MODULES.find((module) => module.id === id);
}
