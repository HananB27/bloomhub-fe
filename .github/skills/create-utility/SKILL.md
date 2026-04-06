---
name: create-utility
description: Create or extend shared utility functions in src/utils/. Use when extracting repeated logic into a helper, or when asked to add a utility function.
---

## Before Creating

1. Check if the utility already exists in `src/utils/index.ts` barrel exports.
2. If it exists, use it. Do not create a duplicate.
3. If it partially exists, extend the existing function rather than creating a new one.

## File Placement

| Utility Type                                 | File                               |
| -------------------------------------------- | ---------------------------------- |
| Search, filter, sort, group                  | `src/utils/filters.ts`             |
| Email, phone, URL, form, file validation     | `src/utils/validators.ts`          |
| Toast, loading, confirm, error notifications | `src/utils/notificationHelpers.ts` |
| Date formatting, comparison, relative time   | `src/utils/date.ts`                |
| Currency, number formatting                  | `src/utils/format.ts`              |
| API fetch wrappers, error handling           | `src/utils/api.ts`                 |

## Implementation Rules

- Every exported function must have a JSDoc comment with `@param` and `@returns`.
- Use generics for functions that operate on arbitrary item shapes.
- Return types must be explicit on every exported function.
- No `any`. Use `unknown` with type narrowing or generic constraints.
- Write pure functions when possible (no side effects).
- Test edge cases: empty arrays, null/undefined inputs, empty strings.

## After Creating

1. Export the function from `src/utils/index.ts`.
2. Run `npm run lint -- src --max-warnings=25` to verify no new warnings.
3. Run `npm run format:check` to verify formatting.

## Existing Exports (src/utils/index.ts)

### filters.ts

filterItems, filterItemsByMultipleCriteria, sortItems, searchItems, groupByField, countByField, filterByExpiration, filterByStatus, FilterConfig

### validators.ts

isValidEmail, isValidPhone, isValidUrl, isValidCurrency, validateFileSize, validateFileType, validateFile, validateStringField, validateFields, isValidDate, isFutureDate, isPastDate, isValidDateRange, isNotEmpty, isLengthInRange, sanitizeString, ValidationRuleSets, EMAIL_REGEX, PHONE_REGEX, URL_REGEX, CURRENCY_REGEX, ValidationRule, ValidationResult

### notificationHelpers.ts

notifySuccess, notifyError, notifyWarning, notifyInfo, notifyLoading, dismissNotification, replaceNotification, notifyApiError, confirmAction, withNotification, notifyQuickFeedback, NotificationMessages, NotificationOptions

### date.ts

formatDate, formatDateWithWeekday, formatRelativeTimestamp, isExpiringNext30Days

### format.ts

formatCurrency
