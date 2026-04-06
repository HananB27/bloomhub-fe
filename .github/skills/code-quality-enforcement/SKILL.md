---
name: code-quality-enforcement
description: Enforce code quality standards including DRY, TypeScript strict mode, no unnecessary comments, and modular architecture. Use when writing, reviewing, or refactoring any code in this repository.
---

## Duplicate Code Detection

Before writing any new code, search for existing implementations:

1. Check `src/utils/` for existing helpers (filters, validators, notifications, date, format)
2. Check `src/components/hr-dashboard/common/` for shared components (dialogs)
3. If a matching helper exists, import and use it. Do not write new code.
4. If no helper exists but the pattern will repeat, create the helper first in `src/utils/`, export it from `src/utils/index.ts`, then use it.

## Status Color/Badge Pattern

This pattern is duplicated across 12 modules. Every `getStatusColor`, `getStatusBadge`, `getPriorityColor`, `getTypeColor`, or `getBadgeVariant` function is a switch statement mapping status strings to Tailwind classes. When you encounter this:

1. Create a generic helper or use a lookup object:

```typescript
const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};
const style = STATUS_STYLES[status] ?? STATUS_STYLES.default;
```

2. Never create a new switch-case function for status → className mapping.

## Filter/Search Pattern

58 instances of filter/search logic exist across modules. All follow this pattern:

```typescript
const filtered = items.filter((item) => {
  const matchesSearch = item.name
    .toLowerCase()
    .includes(searchTerm.toLowerCase());
  const matchesCategory =
    categoryFilter === "all" || item.category === categoryFilter;
  return matchesSearch && matchesCategory;
});
```

Replace with:

```typescript
import { filterItems } from "@/utils/filters";
const filtered = filterItems(items, searchTerm, {
  category: selectedCategory,
  status: selectedStatus,
});
```

## Component Size Limits

Current violations (lines):

- FeedbackModule: 1867
- AssetsModule: 1600
- CompensationModule: 1500
- TimeTrackingModule: 1514
- AnnouncementsModule: 1410
- OrgChartModule: 1407
- DocumentsModule: 1369
- AnalyticsModule: 1278
- TrainingModule: 1236
- ProfilesModule: 1198

When modifying any of these, extract sub-components. Target: no file over 300 lines.

## TypeScript Rules

- Never use `any`. Use `unknown` with type guards or specific union types.
- Always type function return values for exported functions.
- Use `interface` for object shapes, `type` for unions and intersections.
- Prefix intentionally unused variables with `_` (e.g., `_avatarFile`).

## Comments Policy

- Do not add comments that restate what the code does.
- Do not add JSDoc unless the function is exported from `src/utils/`.
- If code needs a comment to be understood, rename variables and functions instead.
- Only acceptable comments: `// TODO:` with a ticket reference, or legal/license headers.

## Modularity Enforcement

Every change must be checked against these rules. This is a frontend repo — UI patterns are components, logic patterns are helpers.

### Repeated UI patterns → shared component

If any visual pattern (card layout, list item row, status badge, empty state, loading skeleton, avatar with name, stat card) appears in 2+ modules, extract it to `src/components/hr-dashboard/common/`.

### Repeated logic → helper function

If any logic appears in 2+ modules, extract it to `src/utils/`:

| Pattern                                                      | Target                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| `items.filter(i => i.name.toLowerCase().includes(term))`     | `filterItems()` in `filters.ts`                                 |
| `switch(status) { case "active": return "bg-green-100"... }` | `Record<string, string>` lookup object                          |
| `toast.success("Saved")` / `toast.error(err.message)`        | `notifySuccess()` / `notifyError()` in `notificationHelpers.ts` |
| `new Date(str).toLocaleDateString(...)`                      | `formatDate()` in `date.ts`                                     |
| `if (!email.includes("@"))`                                  | `isValidEmail()` in `validators.ts`                             |
| `file.size > maxSize`                                        | `validateFile()` in `validators.ts`                             |

### Switch/if-else mapping → lookup object

Every switch statement or if-else chain that maps a value to another value (status→color, type→icon, role→label) must be a typed lookup:

```typescript
// WRONG
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// CORRECT
const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  default: "bg-gray-100 text-gray-800",
};
const style = STATUS_STYLES[status] ?? STATUS_STYLES.default;
```

### Decision checklist (run on every change)

1. Does any code I wrote already exist somewhere? → Use the existing version.
2. Will this code be needed in another module? → Extract to utils or common.
3. Is this component file over 300 lines? → Split now, not later.
4. Did I use a switch/if-else for value mapping? → Replace with lookup object.
5. Did I copy-paste anything? → Extract it immediately.
6. Did I write a string literal in logic? → Move it to a constants file.

## Constants Policy

No inline string literals in logic code. Tailwind classes in JSX (`className="..."`) are fine. Everything else must be a named constant.

### What must be a constant

- API endpoints: `"/api/employees"` → `API_ENDPOINTS.EMPLOYEES`
- Status values: `"active"`, `"pending"`, `"rejected"` → `STATUS.ACTIVE`, `STATUS.PENDING`
- Error messages: `"Failed to save"` → `ERROR_MESSAGES.SAVE_FAILED`
- Filter defaults: `"all"` → `FILTER_ALL`
- Config values: `10`, `"en-US"`, `30` → `PAGE_SIZE`, `DEFAULT_LOCALE`, `EXPIRY_DAYS`
- Role/permission strings: `"admin"`, `"hr"` → `ROLES.ADMIN`, `ROLES.HR`
- Event names, storage keys, query params

### What stays inline (no constant needed)

- Tailwind classes: `className="flex items-center gap-2"` ✅
- JSX text content: `<h1>Dashboard</h1>` ✅
- HTML attributes: `type="button"`, `placeholder="Search..."` ✅

### File placement

- Module-specific constants → `constants.ts` co-located with the module
- Shared constants used by 2+ modules → `src/constants/` with barrel export from `src/constants/index.ts`

### Example

```typescript
// WRONG — string literals scattered in code
const filtered = items.filter(i => i.status === "active");
const res = await fetch("/api/employees");
if (role === "admin") { ... }
toast.error("Failed to save employee");

// CORRECT — constants file
// constants.ts
export const EMPLOYEE_STATUS = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
} as const;

export const API_ENDPOINTS = {
  EMPLOYEES: "/api/employees",
} as const;

export const ROLES = {
  ADMIN: "admin",
  HR: "hr",
} as const;

export const ERROR_MESSAGES = {
  SAVE_FAILED: "Failed to save employee",
} as const;

// component.tsx
import { EMPLOYEE_STATUS, API_ENDPOINTS, ROLES, ERROR_MESSAGES } from "./constants";
const filtered = items.filter(i => i.status === EMPLOYEE_STATUS.ACTIVE);
const res = await fetch(API_ENDPOINTS.EMPLOYEES);
if (role === ROLES.ADMIN) { ... }
notifyError(ERROR_MESSAGES.SAVE_FAILED);
```
