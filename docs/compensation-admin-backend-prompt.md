# Compensation Admin — Backend Work Prompt (Policy-driven NET + Global Benefits)

Bosnian payroll. Compensation is **policy-driven, not per-employee free-form**:

- **NET salary is keyed by CPF level** (Career Progression Framework). One policy per level. Two employees at the same level get the same NET. Promotion to a new level changes pay automatically.
- **Benefits are a global catalog**. All active catalog entries apply to every employee. No per-employee opt-in/opt-out in this iteration.
- **Total monthly comp = `policy.net_monthly + Σ active_benefits.monthly_amount`** (plus any bonuses, which stay per-employee).

Gross salary (`SalaryRecord`) stays as-is. Gross/NET delta is informational; the source of truth for "what we pay" is policy NET + benefits.

All money in **BAM**. Work in `BloomHub-be` (`/Users/bloomteq/BloomHub-be`).

## 1. Models

```python
# core/models.py

class CompensationPolicy(models.Model):
    """One NET-salary policy per CPF level. Unique on cpf_level."""

    cpf_level      = models.CharField(max_length=100, unique=True)  # matches CPFLevel.name
    net_monthly    = models.DecimalField(max_digits=12, decimal_places=2)
    currency       = models.CharField(max_length=3, default="BAM")
    effective_date = models.DateField()
    notes          = models.TextField(blank=True, default="")
    created_by     = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="comp_policies_created"
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["cpf_level"]


class BenefitCatalog(models.Model):
    """Global benefit catalog. Every active entry applies to every employee."""

    class Type(models.TextChoices):
        TRANSPORT   = "transport",   "Transport allowance"
        MEAL        = "meal",        "Meal allowance"
        RECREATION  = "recreation",  "Recreation"
        HEALTH      = "health",      "Private health"
        EDUCATION   = "education",   "Education stipend"
        EQUIPMENT   = "equipment",   "Equipment allowance"
        REMOTE_WORK = "remote_work", "Remote-work stipend"
        PHONE       = "phone",       "Phone / data"
        OTHER       = "other",       "Other"

    benefit_type    = models.CharField(max_length=20, choices=Type.choices)
    name            = models.CharField(max_length=120)
    monthly_amount  = models.DecimalField(max_digits=10, decimal_places=2)
    currency        = models.CharField(max_length=3, default="BAM")
    is_active       = models.BooleanField(default=True)
    effective_date  = models.DateField()
    end_date        = models.DateField(null=True, blank=True)
    notes           = models.TextField(blank=True, default="")
    created_by      = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="benefit_catalog_created"
    )
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["benefit_type", "name"]
```

## 2. Resolution helpers (`core/services/compensation_service.py`)

```python
def resolve_policy(profile) -> CompensationPolicy | None:
    """Resolve the active policy for an employee by their CPF level."""
    if not profile.cpf_level:
        return None
    return CompensationPolicy.objects.filter(cpf_level=profile.cpf_level).first()


def active_benefits(today=None):
    """Active catalog entries for the given date."""
    today = today or date.today()
    qs = BenefitCatalog.objects.filter(is_active=True, effective_date__lte=today)
    return qs.filter(Q(end_date__isnull=True) | Q(end_date__gte=today))


def total_benefits_monthly(today=None) -> Decimal:
    return sum((b.monthly_amount for b in active_benefits(today)), Decimal("0"))


def resolve_employee_total(profile, today=None) -> dict:
    policy = resolve_policy(profile)
    benefits_total = total_benefits_monthly(today)
    net = policy.net_monthly if policy else Decimal("0")
    return {
        "net_monthly": net,
        "benefits_monthly": benefits_total,
        "total_monthly": net + benefits_total,
        "cpf_level": profile.cpf_level or None,
        "policy_id": policy.id if policy else None,
    }
```

## 3. Endpoints

| Method | Path                               | Body / Query                                         | Returns                |
| ------ | ---------------------------------- | ---------------------------------------------------- | ---------------------- |
| GET    | `/api/compensation/policies/`      | —                                                    | `CompensationPolicy[]` |
| POST   | `/api/compensation/policies/`      | `{ cpf_level, net_monthly, effective_date, notes? }` | `CompensationPolicy`   |
| PATCH  | `/api/compensation/policies/{id}/` | partial                                              | `CompensationPolicy`   |
| DELETE | `/api/compensation/policies/{id}/` | —                                                    | 204                    |
| GET    | `/api/compensation/benefits/`      | `?is_active=true`                                    | `BenefitCatalog[]`     |
| POST   | `/api/compensation/benefits/`      | `BenefitCatalog` payload                             | `BenefitCatalog`       |
| PATCH  | `/api/compensation/benefits/{id}/` | partial                                              | `BenefitCatalog`       |
| DELETE | `/api/compensation/benefits/{id}/` | —                                                    | 204                    |

All write endpoints HR-only (`is_compensation_admin`). Read endpoints HR-only as well (these expose pay floors across levels).

Existing `/api/compensation/overview/` keeps its shape but its internals must change:

- `stats.totalMonthly` = `Σ (policy_net for each active employee) + headcount * total_benefits_monthly`.
- `_employee_row(profile)` should populate:
  - `salary` = `resolve_policy(profile).net_monthly` (or `0` if no policy)
  - Add new fields: `cpf_level`, `policy_id`, `benefits_monthly`, `total_monthly`
- `build_mix` recomputed from real benefits (drop the `BENEFITS_STUB_RATE = 0.04` hardcode).
- `bands` keep existing behavior (frontend overrides with dynamic bands anyway).

## 4. Serializer additions

`EmployeeProfileSerializer`:

- `current_net_salary` (read-only) → resolved via policy by `cpf_level`. Replace any per-employee `NetSalaryRecord` you may have started; this iteration drops that approach.
- `current_total_monthly` (read-only) → `current_net_salary + total_benefits_monthly`.
- `compensation_status` already exists; keep as-is.

`CompensationPolicySerializer.fields`: `id`, `cpf_level`, `net_monthly`, `currency`, `effective_date`, `notes`, `created_by`, `created_by_name`, `created_at`, `updated_at`, plus `employees_count` (annotated count of `UserProfile` matching `cpf_level`).

`BenefitCatalogSerializer.fields`: `id`, `benefit_type`, `benefit_type_display`, `name`, `monthly_amount`, `currency`, `is_active`, `effective_date`, `end_date`, `notes`, `created_by`, `created_by_name`, `created_at`, `updated_at`.

## 5. Migrations

1. `CompensationPolicy` model + migration.
2. `BenefitCatalog` model + migration.
3. Drop any in-flight `NetSalaryRecord` / per-employee `Benefit` work from the previous prompt (we replaced it with this).
4. Update `compensation_service` to resolve via policy + global benefits.
5. Update `EmployeeProfileSerializer` (`current_net_salary`, `current_total_monthly`).
6. Register URLs + ViewSets in `core/urls.py`.
7. Update tests.

## 6. Tests (`tests/test_compensation_admin_api.py`)

- HR can CRUD policies + benefits.
- Non-HR GET/POST/PATCH/DELETE on `/api/compensation/policies/` and `/benefits/` → 403.
- Creating a policy for a `cpf_level` that already has one → 400 (unique).
- `EmployeeProfileSerializer.current_net_salary` matches policy for that employee's `cpf_level`.
- Overview totals: `totalMonthly` includes benefits × headcount.
- `is_active=false` benefit not included in resolution.
- Benefit `end_date < today` not included.

## 7. Out of scope

- Per-employee overrides on top of policy (will be a future iteration if needed).
- Multi-currency.
- Tax/social-contribution calculations.

## 8. Frontend expectations

Frontend admin tab is now keyed by these endpoints:

- `policyApi.list/create/update/remove` → `/api/compensation/policies/`
- `benefitCatalogApi.list/create/update/remove` → `/api/compensation/benefits/`

UI is two sub-tabs: **Policies** (one row per CPF level) and **Benefits catalog**. Per-employee compensation editing is gone; if HR wants to change someone's pay, they either edit the policy (impacts all at that level) or move the employee to a different CPF level (existing flow).
