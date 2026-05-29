# Compensation Module — Backend Work Prompt

You are working in the `BloomHub-be` Django repo (located at `/Users/bloomteq/BloomHub-be`). The `BloomHub-fe` Compensation module is already shipped and consuming what backend currently exposes. Your job: ship the backend endpoints and data needed so the frontend can drop all `TODO(backend)` stubs.

## Frontend contract you must satisfy

The frontend ships these typed interfaces in `BloomHub-fe/src/lib/api/compensation.ts`. Treat them as the source of truth — match field names exactly so the frontend needs no changes beyond removing stubs:

```ts
type CompensationStatus = "Active" | "OnLeave" | "PTO";

interface CompensationEmployee {
  id: number;
  name: string;
  title: string;
  dept: string;
  salary: number; // current monthly gross in BAM
  bonus: number; // last-12-months total bonus % of base
  last: string; // ISO date of last completed review
  next: string; // ISO date of next scheduled review
  status: CompensationStatus;
  color: "green" | "indigo" | "rose" | "gray" | "orange";
}

interface SalaryBand {
  label: string;
  count: number;
  pct: number;
}
interface CompensationMixSegment {
  name: string;
  pct: number;
  color: string;
}

interface CompensationStats {
  totalMonthly: number;
  avgSalary: number;
  medianSalary: number;
  pendingReviews: number;
  overdueReviews: number;
  totalEmployees: number;
  monthlyDeltaPct: number; // % change vs. last month
  avgYoyPct: number; // % change YoY
  medianQoqPct: number; // % change QoQ
}

interface CompensationOverview {
  stats: CompensationStats;
  bands: SalaryBand[];
  mix: CompensationMixSegment[];
  employees: CompensationEmployee[];
}
```

Frontend currency is **BAM** (Bosnia/Herzegovina convertible mark). Backend should store amounts as `DecimalField(max_digits=12, decimal_places=2)` with an explicit `currency = "BAM"` default. Multi-currency is out of scope for this iteration.

## What backend already has (do not duplicate)

- `UserProfile.salary_records` + `SalaryRecord` model — per-employee salary history.
- `UserProfile.current_salary` property — latest salary amount.
- `EmployeeProfileSerializer` exposes `current_salary` via `/api/employees/`.
- `PerformanceReview` model with `scheduled_date`, `next_review_date`, `status` (scheduled/completed/cancelled).
- `/api/performance-reviews/` list endpoint.

The frontend already aggregates `current_salary` and `PerformanceReview` rows client-side. Keep these endpoints working; do not break their response shape.

## What is missing

### 1. Bonus model + endpoints (highest priority)

`SalaryRecord` covers base salary only. Bonuses are not modelled. Add:

```python
class BonusRecord(models.Model):
    class BonusType(models.TextChoices):
        PERFORMANCE = "performance", "Performance"
        RETENTION   = "retention",   "Retention"
        REFERRAL    = "referral",    "Referral"
        PROJECT     = "project",     "Project"
        EDUCATION   = "education",   "Education"
        SPOT        = "spot",        "Spot"

    user_profile  = models.ForeignKey(UserProfile, related_name="bonus_records", on_delete=models.CASCADE)
    bonus_type    = models.CharField(max_length=20, choices=BonusType.choices)
    amount        = models.DecimalField(max_digits=12, decimal_places=2)
    currency      = models.CharField(max_length=3, default="BAM")
    effective_date= models.DateField()
    reason        = models.TextField(blank=True, default="")
    created_by    = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="bonuses_created")
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-effective_date"]
```

Endpoints (DRF ViewSet, register in `core/urls.py`):

| Method | Path                           | Purpose                                                                                             |
| ------ | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| GET    | `/api/bonuses/`                | List all bonuses (HR-only); filter `?employee_id=`, `?since=`, `?bonus_type=`. Paginated.           |
| GET    | `/api/employees/{id}/bonuses/` | Per-employee history.                                                                               |
| POST   | `/api/bonuses/`                | Create. Body: `{ user_profile, bonus_type, amount, effective_date, reason }`. Returns 201 + record. |
| PATCH  | `/api/bonuses/{id}/`           | Edit (HR only).                                                                                     |
| DELETE | `/api/bonuses/{id}/`           | Soft-delete or hard-delete behind permission.                                                       |

Permissions: gate behind the existing HR-like role check used by salary edits.

The frontend table column `bonus %` is computed as `sum(bonus.amount in last 12 months) / 12 / current_salary * 100`. Compute this server-side and add it to the employee serializer so the frontend can drop the placeholder `0`.

### 2. Compensation overview endpoint

Add `GET /api/compensation/overview/` that returns the full `CompensationOverview` shape above so the frontend can replace 3 separate fetches with one. The frontend currently aggregates these client-side from `/api/employees/` + `/api/performance-reviews/`. Move that aggregation server-side for performance and correctness.

Suggested implementation:

- `stats.totalMonthly`: sum of `current_salary` across active employees.
- `stats.avgSalary`, `medianSalary`: aggregate over active employees only.
- `stats.pendingReviews`: `PerformanceReview.objects.filter(status="scheduled").count()`.
- `stats.overdueReviews`: scheduled + `scheduled_date < today`.
- `stats.monthlyDeltaPct`, `avgYoyPct`, `medianQoqPct`: see section 4.
- `bands`: bucket active employees by `current_salary` into the fixed BAM ranges below. Bucket boundaries must match the frontend `SALARY_BAND_DEFS`:
  - `BAM 1.5k–2k` → `[1500, 2000)`
  - `BAM 2k–2.5k` → `[2000, 2500)`
  - `BAM 2.5k–3.5k` → `[2500, 3500)`
  - `BAM 3.5k–4.5k` → `[3500, 4500)`
  - `BAM 4.5k–6k` → `[4500, 6000)`
  - `BAM 6k +` → `[6000, ∞)`
- `mix`: `Base salary`, `Performance bonus`, `Project & education bonus`, `Benefits`. Compute base as Σ current_salary, bonus categories from `BonusRecord` last 12 months, benefits stub at 4% until benefits service ships (note this in the response or comment).

### 3. Status enum: PTO / On Leave

Right now `UserProfile.employment_status` is only `active|inactive`. The compensation module needs `Active | OnLeave | PTO`. Two clean options:

- **Preferred:** integrate the existing vacations/leave service. A user with an approved leave covering today → `PTO`. `employment_status = "inactive"` → `OnLeave`. Otherwise `Active`. Expose as `compensation_status` on the employee serializer.
- **Fallback:** add a derived field on `UserProfile` computed on read, document in serializer.

### 4. Historical payroll snapshot

Frontend stat cards show YoY / QoQ / vs-last-month deltas. Backend currently has no payroll history aggregate. Add:

```python
class PayrollSnapshot(models.Model):
    snapshot_date  = models.DateField(unique=True)         # first of month
    total_monthly  = models.DecimalField(max_digits=14, decimal_places=2)
    avg_salary     = models.DecimalField(max_digits=12, decimal_places=2)
    median_salary  = models.DecimalField(max_digits=12, decimal_places=2)
    headcount      = models.PositiveIntegerField()
    created_at     = models.DateTimeField(auto_now_add=True)
```

Add a Django management command + monthly cron (`scripts/snapshot_payroll.py`) that recomputes the snapshot on the 1st of each month from `SalaryRecord` + active employees.

`/api/compensation/overview/` then computes deltas from current vs:

- last month → `monthlyDeltaPct`
- same month last year → `avgYoyPct`
- previous quarter → `medianQoqPct`

If no historical snapshot exists yet, return `0` (frontend already handles that case gracefully).

### 5. CSV export endpoint (optional, currently client-side)

Frontend exports current filtered rows to CSV client-side via Blob download. If you want a server-side authoritative export (recommended for audit), add:

- `GET /api/compensation/export/?format=csv|xlsx&filters=…` → returns a download stream, signed-URL or attachment. Match the pattern used by `EmployeeExportView` already in this repo. Frontend will switch to it once available.

## Avatar color

Frontend hashes the employee name into one of 5 palette colors. Backend does not need to ship a `color` field unless you want consistency with avatars stored elsewhere. If `UserProfile.avatar_color` already exists, return it; otherwise leave it absent and frontend keeps hashing.

## Permissions

All write endpoints (create/update/delete bonus, view full overview with raw amounts) must enforce the same HR-like permission gate already used for salary edits (`isHrLikeRole` analog in DRF — look in `core/permissions.py`). Non-HR employees should still be able to see their own bonus history at `/api/employees/me/bonuses/` but never others'.

## Tests

For each new endpoint, add tests in `tests/` covering:

- HR user can list/create/edit/delete bonuses.
- Non-HR user cannot list other employees' bonuses; only their own.
- Overview totals match seed data exactly (write a deterministic fixture).
- PayrollSnapshot management command produces correct values on a fixed seed.
- BAM currency stored exactly, no rounding on read.

## Migration order

1. `BonusRecord` model + migration + admin + serializer + viewset + URL + tests.
2. `PayrollSnapshot` model + management command + migration.
3. Add `current_bonus_pct` / `compensation_status` to `EmployeeProfileSerializer`.
4. `/api/compensation/overview/` aggregating from existing + new tables.
5. (Optional) `/api/compensation/export/`.

After each step, run the BloomHub-fe app against this backend and verify the matching `TODO(backend)` in `BloomHub-fe/src/lib/api/compensation.ts` can be removed.

## Out of scope (do not build)

- Equity / RSU tracking (frontend tab is a placeholder).
- Pay equity analysis (frontend tab is a placeholder).
- Multi-currency support.
- Payroll-provider webhook integration.
- E-signature for bonus letters.

These will get their own backend prompts after this iteration ships.
