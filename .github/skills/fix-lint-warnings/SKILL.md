---
name: fix-lint-warnings
description: Fix ESLint warnings to reach zero warnings. Use when asked to fix lint errors, clean up imports, or resolve CI failures related to linting.
---

## Diagnostic

Run this first:

```bash
npm run lint -- src --max-warnings=0
```

## Fix Order

Handle warnings in this priority:

### 1. Unused imports (fastest)

Delete the import line entirely. Do not comment it out. Do not prefix with `_`.

Example — if `Calendar` from lucide-react is unused:

```typescript
// Before
import { Search, Filter, Calendar, Plus } from "lucide-react";
// After
import { Search, Filter, Plus } from "lucide-react";
```

### 2. Unused variables

- If the variable is a destructured state setter that is intentionally unused, prefix with `_`:
  ```typescript
  const [_selectedItem, setSelectedItem] = useState(null);
  ```
- If the variable is genuinely unused, delete the declaration entirely.
- If the variable is a function parameter, prefix with `_`:
  ```typescript
  callbacks: { async signIn({ _user }) { return true; } }
  ```

### 3. `<img>` tags → `next/image`

Replace every `<img>` with the Next.js Image component:

```typescript
import Image from "next/image";
// Before
<img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
// After
<Image src={user.avatar} alt={user.name} width={32} height={32} className="rounded-full" />
```

For dynamic/unknown image sources, add `unoptimized` prop if needed.

### 4. React Hook exhaustive-deps

- If the dependency is an array/object literal created during render, wrap it in `useMemo`:
  ```typescript
  const leaveRecords = useMemo<LeaveRecord[]>(() => [], []);
  ```
- If a dependency is missing from the array, add it.
- Never suppress with `// eslint-disable`. Fix the root cause.

### 5. Unused type definitions

If an `interface` or `type` is defined but never referenced, delete it.

## Verification

After all fixes, run:

```bash
npm run lint -- src --max-warnings=0
npm run format:check
```

Both must pass with zero issues.

## Current Warning Breakdown (36 total)

- 18 `<img>` tags needing `next/image`
- 11 unused variables (mock data, unused setters)
- 7 React Hook exhaustive-deps
