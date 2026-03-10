# Button categories reference

All `<Button>` and `<QuickActionButton>` usages in `src/components/hr-dashboard` are listed below with a **recommended category**. Use this to add `data-category="..."` or to refactor toward shared variants.

---

## Category definitions

| Category         | When to use                                                                                      | Variant / styling                  |
| ---------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| **primary**      | Main CTA: submit, create, add, save (confirm), apply, send                                       | `variant="primary"` (slate filled) |
| **secondary**    | Secondary actions: cancel, filter, export, clear, save draft, preview, settings, view/edit links | `variant="outline"` (neutral gray) |
| **ghost**        | Low emphasis: icon-only, row actions, dropdown triggers, reactions, “view all”                   | `variant="ghost"`                  |
| **destructive**  | Reject, delete, remove, sign out                                                                 | `variant="destructive"`            |
| **quick-action** | Sidebar/card quick actions (already use `QuickActionButton`)                                     | N/A (component)                    |

**Applied:** All buttons across the app now use these variants from `ui/button.tsx`. No inline `bg-slate-600` / `bg-green-*` / `bg-red-*` on buttons.

---

## By file

### App.tsx

| Line(s) | Label / purpose                    | Current          | Category                                         |
| ------- | ---------------------------------- | ---------------- | ------------------------------------------------ |
| 194–199 | Bell (notifications)               | ghost, icon      | **ghost**                                        |
| 217–222 | Mark all as read                   | ghost, sm        | **ghost**                                        |
| 226–231 | Close notification                 | ghost, icon      | **ghost**                                        |
| 294–299 | View all notifications             | ghost            | **ghost**                                        |
| 307–312 | User avatar / profile menu trigger | ghost            | **ghost**                                        |
| 347–352 | My profile (menu item)             | ghost            | **ghost**                                        |
| 358–363 | Settings (menu item)               | ghost            | **ghost**                                        |
| 407–409 | Save Changes (dialog)              | slate filled     | **primary**                                      |
| 414–419 | Privacy (menu item)                | ghost            | **ghost**                                        |
| 421–426 | Help & Support (menu item)         | ghost            | **ghost**                                        |
| 431–436 | Sign Out                           | ghost, red hover | **destructive** (or keep ghost with red styling) |

### DashboardView.tsx

| Line(s) | Label / purpose                                                       | Current           | Category         |
| ------- | --------------------------------------------------------------------- | ----------------- | ---------------- |
| 189–192 | Quick Action (header)                                                 | slate filled      | **primary**      |
| 350–370 | Add New Employee, Send Announcement, Schedule Review, Generate Report | QuickActionButton | **quick-action** |

### AIAssistant.tsx

| Line(s) | Label / purpose                | Current     | Category      |
| ------- | ------------------------------ | ----------- | ------------- |
| 566–571 | Bot / assistant toggle         | ghost, icon | **ghost**     |
| 630–635 | “Help me with [module]”        | outline, sm | **secondary** |
| 676–681 | Module navigation from message | outline, sm | **secondary** |
| 699–704 | Suggestion chips               | outline, sm | **secondary** |
| 805–810 | Send message                   | dark filled | **primary**   |

### VacationsModule.tsx

| Line(s)                 | Label / purpose      | Current      | Category                    |
| ----------------------- | -------------------- | ------------ | --------------------------- |
| 271–274                 | Export               | outline, sm  | **secondary**               |
| 350–353                 | Export Data (dialog) | slate filled | **primary**                 |
| 355                     | Cancel (dialog)      | outline      | **secondary**               |
| 363–366                 | Filter               | outline, sm  | **secondary**               |
| 436–438                 | Apply Filters        | slate filled | **primary**                 |
| 439                     | Clear All            | outline      | **secondary**               |
| 459–461                 | Edit (row)           | ghost, sm    | **ghost**                   |
| 495, 571, 595, 635, 639 | Form/dialog actions  | mixed        | **primary** / **secondary** |
| 929, 938                | (context-dependent)  | —            | **primary** / **secondary** |

### ProfilesModule.tsx

| Line(s)              | Label / purpose      | Current      | Category                                |
| -------------------- | -------------------- | ------------ | --------------------------------------- |
| 454–456              | View Profile         | outline, sm  | **secondary**                           |
| 479–481              | Export               | outline, sm  | **secondary**                           |
| 571–574              | Export Data (dialog) | slate filled | **primary**                             |
| 576                  | Cancel (dialog)      | outline      | **secondary**                           |
| 584–587              | Filter               | outline, sm  | **secondary**                           |
| 644–646              | Apply Filters        | slate filled | **primary**                             |
| 647                  | Clear All            | outline      | **secondary**                           |
| 652–655              | Add Employee         | slate filled | **primary**                             |
| 682                  | (header action)      | —            | **primary** or **secondary**            |
| 736, 861, 1000, 1114 | Row/form actions     | mixed        | **primary** / **secondary** / **ghost** |

### OrgChartModule.tsx

| Line(s)       | Label / purpose                                                    | Current           | Category                                  |
| ------------- | ------------------------------------------------------------------ | ----------------- | ----------------------------------------- |
| 373–376       | View Profile                                                       | outline, sm       | **secondary**                             |
| 377–379       | Mail (icon)                                                        | outline, sm       | **secondary**                             |
| 471–478       | Filter, Export                                                     | outline, sm       | **secondary**                             |
| 479           | (primary header)                                                   | —                 | **primary**                               |
| 570, 580, 587 | Zoom / reset / view                                                | outline or ghost  | **secondary** / **ghost**                 |
| 776–778       | More (dropdown)                                                    | ghost, sm         | **ghost**                                 |
| 872, 983      | (context)                                                          | —                 | **primary** / **secondary**               |
| 1016–1032     | Add Employee, Manage Departments, Export Org Chart, Chart Settings | QuickActionButton | **quick-action**                          |
| 1353–1364     | Send Email, Edit Profile, View Full Profile                        | slate + outline   | **primary**, **secondary**, **secondary** |

### OnboardingModule.tsx

| Line(s)  | Label / purpose                                         | Current           | Category                                  |
| -------- | ------------------------------------------------------- | ----------------- | ----------------------------------------- |
| 404–411  | Filter, Export, New Process                             | outline / slate   | **secondary**, **secondary**, **primary** |
| 694, 752 | (dialogs/forms)                                         | —                 | **primary** / **secondary**               |
| 915–931  | Add Task, Edit Template, Schedule Review, Export Report | QuickActionButton | **quick-action**                          |

### TrainingModule.tsx

| Line(s)            | Label / purpose                                             | Current           | Category                                  |
| ------------------ | ----------------------------------------------------------- | ----------------- | ----------------------------------------- |
| 364–375            | Filter, Export, Add Training                                | outline / slate   | **secondary**, **secondary**, **primary** |
| 481–484            | Add Course                                                  | outline, sm       | **secondary**                             |
| 609, 645, 690, 714 | (forms/cards)                                               | —                 | **primary** / **secondary**               |
| 1021, 1028         | Publish / Save Draft                                        | —                 | **primary**, **secondary**                |
| 1088–1090          | Edit (icon)                                                 | outline, sm       | **ghost**                                 |
| 1187–1203          | Enroll, Upload Certificate, Schedule Session, Export Report | QuickActionButton | **quick-action**                          |

### TimeTrackingModule.tsx

| Line(s)                      | Label / purpose                                       | Current           | Category                    |
| ---------------------------- | ----------------------------------------------------- | ----------------- | --------------------------- |
| 444–459                      | Filter, Add Entry                                     | outline / slate   | **secondary**, **primary**  |
| 532, 551, 563                | (actions)                                             | —                 | **primary** / **secondary** |
| 608, 621, 815, 828           | (forms)                                               | —                 | **primary** / **secondary** |
| 945–948                      | Edit (row)                                            | ghost / default   | **ghost** / **primary**     |
| 1001, 1138, 1146, 1225, 1235 | (dialogs/tables)                                      | —                 | **primary** / **secondary** |
| 1420–1437                    | Start Timer, Add Entry, Export Week, Review Approvals | QuickActionButton | **quick-action**            |

### DocumentsModule.tsx

| Line(s)                 | Label / purpose                                        | Current           | Category                                  |
| ----------------------- | ------------------------------------------------------ | ----------------- | ----------------------------------------- |
| 430–438                 | Filter, Export, (primary)                              | outline / default | **secondary**, **secondary**, **primary** |
| 749, 805, 928, 932, 978 | Row/dropdown actions                                   | mixed             | **secondary** / **ghost**                 |
| 1016                    | (dialog submit)                                        | —                 | **primary**                               |
| 1079–1102               | Upload, Request Signature, Browse, Compliance, Archive | QuickActionButton | **quick-action**                          |
| 1159, 1362, 1372        | (other)                                                | —                 | **primary** / **secondary**               |

### FeedbackModule.tsx

| Line(s)                           | Label / purpose                                                            | Current           | Category                                  |
| --------------------------------- | -------------------------------------------------------------------------- | ----------------- | ----------------------------------------- |
| 610–621                           | Filter, Export, Create Survey                                              | outline / slate   | **secondary**, **secondary**, **primary** |
| 757, 1030, 1133, 1149, 1162, 1176 | (cards/forms)                                                              | —                 | **primary** / **secondary**               |
| 1187                              | Preview                                                                    | outline           | **secondary**                             |
| 1261–1269                         | View / Edit / Chart (icons)                                                | ghost, sm         | **ghost**                                 |
| 1582, 1593, 1605, 1671, 1678      | (forms)                                                                    | —                 | **primary** / **secondary** / **ghost**   |
| 1751–1776                         | Quick Pulse, Create Survey, View Results, Submit Suggestion, Export Report | QuickActionButton | **quick-action**                          |

### CompensationModule.tsx

| Line(s)          | Label / purpose                                             | Current               | Category                                  |
| ---------------- | ----------------------------------------------------------- | --------------------- | ----------------------------------------- |
| 430–442          | Filter, Export, Add Bonus                                   | outline / slate       | **secondary**, **secondary**, **primary** |
| 565–572, 686–693 | Period / export (YTD, Q2, Q3, This Month, Export CSV)       | outline, sm           | **secondary**                             |
| 772–811          | View (ghost), Approve/Reject (ghost)                        | ghost, sm             | **ghost**                                 |
| 1220, 1234       | Add Bonus, Save Draft                                       | slate / outline       | **primary**, **secondary**                |
| 1297, 1310       | Approve, Reject (dialog)                                    | default / destructive | **primary**, **destructive**              |
| 1439–1457        | Add Bonus, Review Approvals, Export Report, Schedule Review | QuickActionButton     | **quick-action**                          |

### ReviewsModule.tsx

| Line(s)                      | Label / purpose                                        | Current           | Category                                  |
| ---------------------------- | ------------------------------------------------------ | ----------------- | ----------------------------------------- |
| 259–270                      | Filter, Export, Schedule Review                        | outline / slate   | **secondary**, **secondary**, **primary** |
| 487, 554, 671, 713, 716, 770 | (cards/rows)                                           | mixed             | **primary** / **secondary** / **ghost**   |
| 941–957                      | Edit Review, Schedule Meeting, Export Review, Add Goal | QuickActionButton | **quick-action**                          |

### AnnouncementsModule.tsx

| Line(s)                 | Label / purpose                                                | Current           | Category                                  |
| ----------------------- | -------------------------------------------------------------- | ----------------- | ----------------------------------------- |
| 478–480                 | More (dropdown)                                                | ghost, sm         | **ghost**                                 |
| 576, 593, 600, 616, 631 | Reactions, Smile, Share                                        | ghost, sm         | **ghost**                                 |
| 655, 662                | Cancel, Add comment                                            | ghost / slate     | **secondary**, **primary**                |
| 711, 730, 741           | (reactions in thread)                                          | ghost             | **ghost**                                 |
| 788–802                 | Filter, Settings, Create Post                                  | outline / slate   | **secondary**, **secondary**, **primary** |
| 1054–1070               | Create Post, Manage Notifications, Mark All Read, View Archive | QuickActionButton | **quick-action**                          |
| 1381, 1389              | Send (submit), Cancel                                          | slate / outline   | **primary**, **secondary**                |

### MobilityModule.tsx

| Line(s)                 | Label / purpose                                                                 | Current              | Category                                |
| ----------------------- | ------------------------------------------------------------------------------- | -------------------- | --------------------------------------- |
| 285–294                 | Filter, Export, Post Job                                                        | outline, sm (custom) | **secondary**                           |
| 481, 488, 579, 584, 614 | View Details, Apply, etc.                                                       | mixed                | **primary** / **secondary** / **ghost** |
| 757–779                 | Browse Jobs, Update Resume, Career Interests, Post New Job, Review Applications | QuickActionButton    | **quick-action**                        |
| 829, 984, 993           | (cards/forms)                                                                   | —                    | **primary** / **secondary**             |

### AssetsModule.tsx

| Line(s)                      | Label / purpose                                                                   | Current           | Category                                  |
| ---------------------------- | --------------------------------------------------------------------------------- | ----------------- | ----------------------------------------- |
| 516–529                      | Filter, Export, (primary)                                                         | outline / default | **secondary**, **secondary**, **primary** |
| 770, 779, 792, 975           | Row/dropdown                                                                      | ghost / default   | **ghost** / **primary**                   |
| 1097–1125                    | Add Asset, Scan QR, Assign, Schedule Maintenance, Generate Report, Asset Settings | QuickActionButton | **quick-action**                          |
| 1187, 1365, 1377, 1587, 1597 | (dialogs/forms)                                                                   | —                 | **primary** / **secondary**               |

### AnalyticsModule.tsx

| Line(s)        | Label / purpose                                                 | Current           | Category                    |
| -------------- | --------------------------------------------------------------- | ----------------- | --------------------------- |
| 397–409        | Filter, (primary)                                               | outline / default | **secondary**, **primary**  |
| 991, 999, 1007 | (chart/dialog)                                                  | —                 | **primary** / **secondary** |
| 1074–1076      | Generate Custom Report                                          | slate, full width | **primary**                 |
| 1132–1137      | View, Download (icons)                                          | ghost, sm         | **ghost**                   |
| 1159–1175      | Generate Report, Export Data, View Calendar, Analytics Settings | QuickActionButton | **quick-action**            |

### QuickActionButton.tsx

| Line(s)     | Label / purpose | Current                    | Category         |
| ----------- | --------------- | -------------------------- | ---------------- |
| (component) | All usages      | outline / primary via prop | **quick-action** |

### UI components (sidebar, carousel, pagination, select)

- **sidebar.tsx** (264): sidebar trigger → **ghost**
- **carousel.tsx** (183, 213): prev/next → **ghost**
- **pagination.tsx**, **select.tsx**: use Button internally → keep as-is; classify by context if exposed

---

## Summary counts (approximate)

| Category         | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| **primary**      | ~50+ (main CTAs: submit, create, add, apply, send, save)            |
| **secondary**    | ~60+ (filter, export, cancel, clear, save draft, preview, settings) |
| **ghost**        | ~45+ (icons, row actions, dropdowns, reactions)                     |
| **destructive**  | ~3 (reject bonus, delete; Sign Out can stay ghost+red)              |
| **quick-action** | All QuickActionButton usages (~50+ buttons across modules)          |

---

## How to “mark” buttons

1. **data attribute** (for analytics or testing):  
   `<Button data-category="primary" ...>Submit</Button>`

2. **Shared variant** (recommended):  
   Use `variant="primary"` | `"secondary"` | `"ghost"` | `"destructive"` from `buttonVariants` and reserve custom `className` only for layout (e.g. `flex-1`, `w-full`). Map “primary” to your slate style in `button.tsx` if needed.

3. **Comments**:  
   `// category: primary` above the button for documentation only.

If you tell me whether you want data attributes, variant alignment, or both, I can apply the chosen approach across the listed files.
