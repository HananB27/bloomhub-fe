export type OrgStatus = "active" | "onLeave" | "remote";

export interface OrgEmployee {
  id: number;
  name: string;
  role: string;
  deptId: string;
  managerId: number | null;
  isManager: boolean;
  status: OrgStatus;
  email: string;
  phone: string;
  location: string;
  startDate: string;
  skills: string[];
}

export interface OrgDepartment {
  id: string;
  name: string;
  color: string;
  soft: string;
  count: number;
}

export interface OrgProject {
  id: string;
  name: string;
  status: string;
  memberIds: number[];
}

export type LayoutDirection = "TB" | "BT" | "LR" | "RL";

export interface OrgFilters {
  search: string;
  deptIds: string[];
  projectId: string | null;
}

export interface OrgRecentUpdate {
  id: string;
  kind: "hire" | "promote" | "reassign" | "leave";
  text: string;
  at: string;
}

export interface LayoutNode {
  id: number;
  emp: OrgEmployee;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
}

export interface LayoutEdge {
  id: string;
  source: number;
  target: number;
  colorEmp: OrgEmployee;
}
