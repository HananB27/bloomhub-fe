---
name: refactor-module
description: Refactor large HR dashboard modules into smaller sub-components. Use when asked to refactor, split, or modularize any component file over 300 lines.
---

## Process

1. Read the full module file to understand its structure.
2. Identify distinct UI sections (lists, forms, dialogs, charts, cards, timelines).
3. Identify shared state vs section-local state.
4. Extract each section into a co-located file in the same directory.
5. The parent module becomes a thin orchestrator that imports sub-components and manages shared state.

## Extraction Rules

- Each extracted component gets its own file in the same directory as the parent.
- Shared types go in a `types.ts` file in the same directory.
- Shared constants go in a `constants.ts` file in the same directory.
- Props interfaces are defined in the component file, not in a shared types file, unless used by 2+ components.
- Never pass more than 5 props. If you need more, group them into an object or use context.

## File Naming

- `ModuleName/index.tsx` — re-exports the main component
- `ModuleName/ModuleNameList.tsx` — list/table view
- `ModuleName/ModuleNameForm.tsx` — create/edit form
- `ModuleName/ModuleNameCard.tsx` — card/detail view
- `ModuleName/ModuleNameDialogs.tsx` — all dialogs for this module
- `ModuleName/types.ts` — shared interfaces
- `ModuleName/constants.ts` — status maps, default values

## Replace Inline Logic

During extraction, replace these patterns:

### Status color switch statements → lookup objects in `constants.ts`

```typescript
export const STATUS_STYLES = {
  active: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
} as const satisfies Record<string, string>;
```

### Inline filter logic → `filterItems` from `@/utils/filters`

### Inline date formatting → `formatDate` from `@/utils/date`

### Inline toast calls → `notifySuccess`, `notifyError` from `@/utils/notificationHelpers`

### Inline form validation → `validateFields` from `@/utils/validators`

## Current Targets

| Module              | Lines | Split Into                                                 |
| ------------------- | ----- | ---------------------------------------------------------- |
| FeedbackModule      | 1867  | SurveyList, SurveyBuilder, SurveyResults, FeedbackForm     |
| AssetsModule        | 1600  | AssetList, AssetForm, AssetTimeline, AssetAudit            |
| CompensationModule  | 1500  | SalaryOverview, BonusList, PayrollHistory, CompForm        |
| TimeTrackingModule  | 1514  | TimeEntryList, TimerPanel, WeeklySummary, TimeReports      |
| AnnouncementsModule | 1410  | AnnouncementList, AnnouncementEditor, AnnouncementCard     |
| OrgChartModule      | 1407  | OrgTree, EmployeeNode, DepartmentPanel, OrgDialogs         |
| DocumentsModule     | 1369  | DocumentList, DocumentUpload, SignaturePanel, DocumentCard |
| AnalyticsModule     | 1278  | DashboardCharts, LeaveAnalytics, DeptOverview              |
| TrainingModule      | 1236  | CourseList, CourseForm, CertificationTracker               |
| ProfilesModule      | 1198  | ProfileList, ProfileDetail, ProfileForm                    |
