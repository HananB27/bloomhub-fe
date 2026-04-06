# API Helpers Directory Structure

## New Organization

```
src/lib/api/
├── helpers/
│   ├── index.ts
│   ├── httpClient.ts
│   ├── transformers.ts
│   └── README.md (this file)
├── auth.ts
├── employees.ts (REFACTORED ✅)
├── permissions.ts
├── refresh.ts
├── tokens.ts
├── config.ts
└── README.md
```

## What Each Helper Does

### `httpClient.ts` - HTTP Communication Layer

Generic functions for all HTTP operations:

```typescript
// GET requests with automatic auth and error handling
get<T>(url: string, errorMessage: string): Promise<T>

// POST requests with automatic auth and error handling
post<T>(url: string, body: unknown, errorMessage: string): Promise<T>

// PATCH requests with automatic auth and error handling
patch<T>(url: string, body: unknown, errorMessage: string): Promise<T>

// DELETE requests with automatic auth and error handling
del(url: string, errorMessage: string): Promise<void>

// Helper: Get standard headers with Bearer token
getHeaders(): HeadersInit

// Helper: Convert params object to query string
buildQueryString(params?: Record<string, any>): string

// Helper: Handle both array and paginated API responses
handleListResponse<T>(data: any): { results: T[]; count: number }
```

### `transformers.ts` - Data Transformation Layer

Converts API responses to application interfaces:

```typescript
// Transform single employee from API format
transformEmployeeData(data: any): EmployeeProfileData

// Transform array of employees
transformEmployeeList(data: any[]): EmployeeProfileData[]
```

Handles:

- Field name variations (email vs email_address)
- Type conversions (role ID vs role object)
- Default values for optional fields
- Backward compatibility with different API versions

### `index.ts` - Central Export Point

Makes it easy to import everything:

```typescript
// Instead of:
import { get, post } from "./helpers/httpClient";
import { transformEmployeeData } from "./helpers/transformers";

// You can do:
import { get, post, transformEmployeeData } from "./helpers";
```

## Usage Examples

### Fetching Data

```typescript
import { get, transformEmployeeData } from "./helpers";

async function getEmployee(id: number) {
  const data = await get(
    `${API_BASE_URL}/api/employees/${id}/`,
    "Failed to fetch employee"
  );
  return transformEmployeeData(data);
}
```

### Creating Data

```typescript
import { post, transformEmployeeData } from "./helpers";

async function createEmployee(employeeData: any) {
  const response = await post(
    `${API_BASE_URL}/api/employees/`,
    employeeData,
    "Failed to create employee"
  );
  return transformEmployeeData(response);
}
```

### Updating Data

```typescript
import { patch, transformEmployeeData } from "./helpers";

async function updateEmployee(id: number, updates: any) {
  const response = await patch(
    `${API_BASE_URL}/api/employees/${id}/`,
    updates,
    "Failed to update employee"
  );
  return transformEmployeeData(response);
}
```

### Listing with Filters

```typescript
import { get, buildQueryString, handleListResponse } from "./helpers";

async function listEmployees(filters?: Record<string, any>) {
  const query = buildQueryString(filters);
  const data = await get(
    `${API_BASE_URL}/api/employees/${query}`,
    "Failed to fetch employees"
  );

  const { results, count } = handleListResponse(data);
  return { results, count };
}
```

### Deleting Data

```typescript
import { del } from "./helpers";

async function deleteEmployee(id: number) {
  await del(
    `${API_BASE_URL}/api/employees/${id}/`,
    "Failed to delete employee"
  );
}
```

## Error Handling

All helper functions provide consistent error handling:

```typescript
// Errors are automatically thrown with meaningful messages
try {
  const employee = await get(
    `${API_BASE_URL}/api/employees/999/`,
    "Failed to fetch employee"
  );
} catch (error) {
  console.error(error.message); // "Employee not found" or custom API message
}
```

## Authentication

All helper functions automatically include authentication:

```typescript
// Headers are automatically added by getHeaders()
// Which includes: Authorization: Bearer ${token}
// No need to manually add headers to every request
```

## Benefits Summary

✅ **Less Code** - Eliminate repetitive patterns
✅ **Consistency** - All APIs follow same structure
✅ **Maintainability** - Single source of truth for HTTP logic
✅ **Reusability** - Use helpers across all API modules
✅ **Testability** - Easy to mock and test
✅ **Scalability** - Add new features (caching, retry, etc.) in one place
