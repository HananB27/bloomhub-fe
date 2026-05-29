import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import type {
  CreateEmployeePayload,
  EmployeeProfileData,
} from "@/lib/api/employees";
import type { Manager } from "@/lib/api/managers";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { DatePicker } from "../DatePicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: string[];
  jobTitles: string[];
  projects: EmployeeProjectOption[];
  managers: Manager[];
  existingEmails?: string[];
  onboardingTemplates?: OnboardingTemplateOption[];
  isSaving?: boolean;
  onCheckEmail?: (email: string) => Promise<boolean>;
  onSubmit: (payload: CreateEmployeePayload) => Promise<EmployeeProfileData>;
}

const AVATAR_COLORS = ["#dfe5ff", "#d7f7df", "#fde2e6", "#ffedd4", "#e5e7eb"];
const EMPTY_SELECT_VALUE = "__empty__";
const NONE_MANAGER_VALUE = "__none__";
const DEFAULT_TEMPLATE_VALUE = "__default_template__";

interface EmployeeProjectOption {
  id: number;
  name: string;
  leaders?: { id: number; name: string }[];
}

interface OnboardingTemplateOption {
  id: number;
  name: string;
  type?: string;
  role_responsible?: string;
  is_default?: boolean;
  is_default_for_onboarding?: boolean;
  isDefault?: boolean;
  department?: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  avatarColor: string;
  jobTitle: string;
  employmentType: string;
  department: string;
  projectId: string;
  location: string;
  startDate: string;
  reportsTo: string;
  initialStatus: string;
  sendInvite: boolean;
  startOnboarding: boolean;
  onboardingTemplateId: string;
  publishIntroAnnouncement: boolean;
  introAnnouncementTitle: string;
  introAnnouncementBody: string;
  introAnnouncementScheduleDate: string;
  introAnnouncementScheduleTime: string;
}

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  address: "",
  avatarColor: AVATAR_COLORS[4],
  jobTitle: "",
  employmentType: "full_time",
  department: "",
  projectId: "",
  location: "Sarajevo",
  startDate: "",
  reportsTo: "",
  initialStatus: "probation",
  sendInvite: true,
  startOnboarding: true,
  onboardingTemplateId: DEFAULT_TEMPLATE_VALUE,
  publishIntroAnnouncement: false,
  introAnnouncementTitle: "",
  introAnnouncementBody: "",
  introAnnouncementScheduleDate: "",
  introAnnouncementScheduleTime: "",
};

function defaultIntroTitle(form: FormState) {
  const name = `${form.firstName} ${form.lastName}`.trim();
  return name ? `Welcome ${name}` : "Welcome";
}

function introScheduleToIso(datePart: string, timePart: string) {
  if (!datePart) return null;
  const date = new Date(`${datePart}T${timePart || "09:00"}`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeEmployeeSubmitError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Failed to add employee.";
  const lower = message.toLowerCase();
  if (lower.includes("intro") && lower.includes("already")) {
    return "introduction announcement already exists.";
  }
  if (
    lower.includes("permission") ||
    lower.includes("not allowed") ||
    message.includes("403")
  ) {
    return "Not allowed to schedule introduction announcement.";
  }
  return message;
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  departments,
  jobTitles,
  projects,
  managers,
  existingEmails = [],
  onboardingTemplates = [],
  isSaving = false,
  onCheckEmail,
  onSubmit,
}: AddEmployeeDialogProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const [datePortalContainer, setDatePortalContainer] =
    useState<HTMLDivElement | null>(null);
  const setDialogContentRef = (node: HTMLDivElement | null) => {
    dialogContentRef.current = node;
    setDatePortalContainer(node);
  };

  const initials = useMemo(() => {
    const first = form.firstName.trim()[0] ?? "";
    const last = form.lastName.trim()[0] ?? "";
    return `${first}${last}`.toUpperCase() || "NE";
  }, [form.firstName, form.lastName]);

  const selectedManager = managers.find(
    (manager) => String(manager.id) === form.reportsTo
  );
  const selectedProject = projects.find(
    (project) => String(project.id) === form.projectId
  );
  const selectedTemplate =
    form.onboardingTemplateId === DEFAULT_TEMPLATE_VALUE
      ? undefined
      : onboardingTemplates.find(
          (template) => String(template.id) === form.onboardingTemplateId
        );
  const defaultOnboardingTemplate = useMemo(
    () =>
      onboardingTemplates.find(
        (template) =>
          template.type === "onboarding" &&
          (template.is_default ||
            template.is_default_for_onboarding ||
            template.isDefault)
      ) ??
      onboardingTemplates.find((template) => template.type === "onboarding") ??
      onboardingTemplates[0],
    [onboardingTemplates]
  );

  const canContinuePersonal =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    !emailError &&
    !isCheckingEmail;
  const canContinueJob =
    form.jobTitle.trim() &&
    (departments.length > 0 ? form.department.trim() : true) &&
    form.startDate.trim();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
    if (key === "email") setEmailError(null);
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((item) => String(item.id) === projectId);
    const lead = project?.leaders?.[0];
    const matchingManager = lead
      ? managers.find(
          (manager) =>
            manager.id === lead.id ||
            `${manager.first_name} ${manager.last_name}` === lead.name
        )
      : undefined;

    setForm((current) => ({
      ...current,
      projectId,
      reportsTo: matchingManager
        ? String(matchingManager.id)
        : current.reportsTo,
    }));
    setError(null);
  };

  const checkEmail = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid work email.");
      return;
    }
    if (existingEmails.map((item) => item.toLowerCase()).includes(email)) {
      setEmailError("This email is already used by an existing employee.");
      return;
    }
    if (!onCheckEmail) return;

    try {
      setIsCheckingEmail(true);
      const available = await onCheckEmail(email);
      setEmailError(
        available ? null : "This email is already used by an existing user."
      );
    } catch {
      setEmailError(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  useEffect(() => {
    if (
      form.startOnboarding &&
      form.onboardingTemplateId === DEFAULT_TEMPLATE_VALUE &&
      !defaultOnboardingTemplate
    ) {
      setForm((current) => ({ ...current, onboardingTemplateId: "" }));
    }
  }, [
    defaultOnboardingTemplate,
    form.onboardingTemplateId,
    form.startOnboarding,
  ]);

  const reset = () => {
    setStep(1);
    setForm(INITIAL_FORM);
    setError(null);
    setEmailError(null);
    setIsCheckingEmail(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleSubmit = async () => {
    if (!canContinuePersonal || !canContinueJob) {
      setError("Fill the required employee details before saving.");
      return;
    }
    if (emailError) {
      setError(emailError);
      return;
    }
    if (form.publishIntroAnnouncement && !form.introAnnouncementBody.trim()) {
      setError("Add introduction announcement body before saving.");
      return;
    }

    const status =
      form.initialStatus === "active"
        ? "active"
        : form.initialStatus === "inactive"
          ? "inactive"
          : "probation";

    try {
      const introEnabled = form.publishIntroAnnouncement;
      await onSubmit({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone_number: form.phone.trim() || undefined,
        birth_date: form.birthDate || undefined,
        address: form.address.trim() || undefined,
        avatar_color: form.avatarColor,
        role: null,
        role_name: form.jobTitle.trim(),
        job_title: form.jobTitle.trim(),
        employment_type: form.employmentType,
        department: form.department,
        team: selectedProject?.name,
        project: selectedProject?.id ?? null,
        project_id: selectedProject?.id ?? null,
        location: form.location.trim() || undefined,
        start_date: form.startDate,
        employment_status: status,
        manager: selectedManager?.id ?? null,
        manager_name: selectedManager
          ? `${selectedManager.first_name} ${selectedManager.last_name}`
          : undefined,
        onboarding_template: form.startOnboarding
          ? (selectedTemplate?.id ?? defaultOnboardingTemplate?.id ?? null)
          : null,
        onboarding_template_id: form.startOnboarding
          ? (selectedTemplate?.id ?? defaultOnboardingTemplate?.id ?? null)
          : null,
        send_invite: form.sendInvite,
        start_onboarding: form.startOnboarding,
        ...(introEnabled
          ? {
              publish_intro_announcement: true,
              intro_announcement_title:
                form.introAnnouncementTitle.trim() || defaultIntroTitle(form),
              intro_announcement_body: form.introAnnouncementBody.trim(),
              intro_announcement_scheduled_at: introScheduleToIso(
                form.introAnnouncementScheduleDate,
                form.introAnnouncementScheduleTime
              ),
            }
          : {}),
      });
      reset();
    } catch (err) {
      setError(normalizeEmployeeSubmitError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        ref={setDialogContentRef}
        className="ep-scope grid max-h-[92vh] max-w-5xl gap-0 overflow-visible rounded-[24px] p-0"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest('[data-datepicker-popover="true"]')) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest('[data-datepicker-popover="true"]')) {
            event.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">Add an employee</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new employee profile.
        </DialogDescription>
        <header className="border-b border-zinc-200 px-10 py-7">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            New employee
          </p>
          <h2 className="m-0 text-3xl font-bold tracking-tight text-zinc-900">
            Add an employee
          </h2>
        </header>

        <Stepper step={step} />

        <div className="max-h-[58vh] overflow-y-auto px-10 py-8">
          {step === 1 ? (
            <PersonalStep
              form={form}
              initials={initials}
              update={update}
              datePortalContainer={datePortalContainer}
              emailError={emailError}
              isCheckingEmail={isCheckingEmail}
              onEmailBlur={checkEmail}
            />
          ) : step === 2 ? (
            <JobStep
              form={form}
              departments={departments}
              jobTitles={jobTitles}
              projects={projects}
              managers={managers}
              onboardingTemplates={onboardingTemplates}
              defaultOnboardingTemplate={defaultOnboardingTemplate}
              datePortalContainer={datePortalContainer}
              onProjectChange={handleProjectChange}
              update={update}
            />
          ) : (
            <ReviewStep
              form={form}
              initials={initials}
              selectedProject={selectedProject}
              selectedManager={selectedManager}
              selectedTemplate={selectedTemplate ?? defaultOnboardingTemplate}
            />
          )}
          {error ? (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-zinc-200 px-10 py-5">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setStep((current) => current - 1)}
                disabled={isSaving}
              >
                <ChevronLeft size={16} aria-hidden />
                Back
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                className="gap-2"
                onClick={() => setStep((current) => current + 1)}
                disabled={
                  (step === 1 && !canContinuePersonal) ||
                  (step === 2 && !canContinueJob)
                }
              >
                Continue
                <ChevronRight size={16} aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                className="gap-2"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                ) : (
                  <Check size={16} aria-hidden />
                )}
                Add employee
              </Button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ step }: { step: number }) {
  const items = [
    { id: 1, label: "Personal", icon: Users },
    { id: 2, label: "Job", icon: BriefcaseBusiness },
    { id: 3, label: "Review", icon: CheckCircle2 },
  ] as const;

  return (
    <div className="flex justify-center border-b border-zinc-200 px-10 py-5">
      <div className="flex w-full max-w-4xl items-center justify-center gap-5">
        {items.map((item, index) => {
          const Icon = item.icon;
          const done = step > item.id;
          const active = step === item.id;
          return (
            <div key={item.id} className="flex min-w-0 items-center gap-4">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border text-base font-bold",
                  done
                    ? "border-zinc-700 bg-zinc-700 text-white"
                    : active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-500"
                )}
              >
                {done ? <Check size={17} aria-hidden /> : item.id}
              </span>
              <span
                className={cn(
                  "flex items-center gap-2 text-lg font-semibold",
                  done
                    ? "text-zinc-700"
                    : active
                      ? "text-zinc-900"
                      : "text-zinc-500"
                )}
              >
                <Icon size={17} aria-hidden />
                {item.label}
              </span>
              {index < items.length - 1 ? (
                <span
                  className={cn(
                    "h-px w-32 shrink-0",
                    done ? "bg-zinc-300" : "bg-zinc-200"
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StepProps {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

function PersonalStep({
  form,
  initials,
  update,
  datePortalContainer,
  emailError,
  isCheckingEmail,
  onEmailBlur,
}: StepProps & {
  initials: string;
  datePortalContainer: HTMLElement | null;
  emailError: string | null;
  isCheckingEmail: boolean;
  onEmailBlur: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-7 gap-y-5">
      <Field label="First name" required>
        <input
          value={form.firstName}
          onChange={(e) => update("firstName", e.target.value)}
        />
      </Field>
      <Field label="Last name" required>
        <input
          value={form.lastName}
          onChange={(e) => update("lastName", e.target.value)}
        />
      </Field>
      <Field label="Work email" required>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={onEmailBlur}
        />
        {isCheckingEmail ? (
          <span className="mt-1.5 block text-sm text-zinc-500">
            Checking email...
          </span>
        ) : emailError ? (
          <span className="mt-1.5 block text-sm font-medium text-red-600">
            {emailError}
          </span>
        ) : form.email ? (
          <span className="mt-1.5 block text-sm font-medium text-zinc-600">
            Email is available.
          </span>
        ) : null}
      </Field>
      <Field label="Phone">
        <input
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+387 ..."
        />
      </Field>
      <Field label="Date of birth">
        <DatePicker
          mode="single"
          value={form.birthDate}
          onChange={(date) => update("birthDate", date)}
          placeholder="dd. mm. yyyy."
          size="compact"
          floatPortal
          portalContainer={datePortalContainer}
        />
      </Field>
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-700">Avatar color</p>
        <div className="flex gap-3">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use avatar color ${color}`}
              className={cn(
                "flex size-12 items-center justify-center rounded-full text-sm font-bold ring-offset-2",
                form.avatarColor === color ? "ring-2 ring-zinc-900" : ""
              )}
              style={{ backgroundColor: color }}
              onClick={() => update("avatarColor", color)}
            >
              {initials}
            </button>
          ))}
        </div>
      </div>
      <Field
        label="Address"
        className="col-span-2"
        helper="Visible only to HR and the employee themselves"
      >
        <input
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="Street, city, country"
        />
      </Field>
    </div>
  );
}

function JobStep({
  form,
  departments,
  jobTitles,
  projects,
  managers,
  onboardingTemplates,
  defaultOnboardingTemplate,
  datePortalContainer,
  onProjectChange,
  update,
}: StepProps & {
  departments: string[];
  jobTitles: string[];
  projects: EmployeeProjectOption[];
  managers: Manager[];
  onboardingTemplates: OnboardingTemplateOption[];
  defaultOnboardingTemplate?: OnboardingTemplateOption;
  datePortalContainer: HTMLElement | null;
  onProjectChange: (projectId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-7 gap-y-5">
      <Field label="Job title" required>
        <CustomSelect
          value={form.jobTitle}
          placeholder="Senior Backend Engineer"
          disabled={jobTitles.length === 0}
          onChange={(value) => update("jobTitle", value)}
        >
          {jobTitles.map((jobTitle) => (
            <SelectItem key={jobTitle} value={jobTitle}>
              {jobTitle}
            </SelectItem>
          ))}
        </CustomSelect>
      </Field>
      <Field label="Employment type">
        <CustomSelect
          value={form.employmentType}
          onChange={(value) => update("employmentType", value)}
        >
          <SelectItem value="full_time">Full-time</SelectItem>
          <SelectItem value="part_time">Part-time</SelectItem>
          <SelectItem value="contractor">Contractor</SelectItem>
          <SelectItem value="intern">Intern</SelectItem>
        </CustomSelect>
      </Field>
      <Field label="Department" required>
        <CustomSelect
          value={form.department}
          placeholder="Select department..."
          disabled={departments.length === 0}
          onChange={(value) => update("department", value)}
        >
          {departments.map((department) => (
            <SelectItem key={department} value={department}>
              {department}
            </SelectItem>
          ))}
        </CustomSelect>
      </Field>
      <Field
        label="Team"
        helper="Project leads automatically adjust Reports to when available"
      >
        <CustomSelect
          value={form.projectId}
          placeholder={
            projects.length ? "Select project..." : "No projects available yet"
          }
          disabled={projects.length === 0}
          onChange={onProjectChange}
        >
          {projects.map((project) => (
            <SelectItem key={project.id} value={String(project.id)}>
              {project.name}
            </SelectItem>
          ))}
        </CustomSelect>
      </Field>
      <Field label="Location">
        <CustomSelect
          value={form.location}
          onChange={(value) => update("location", value)}
        >
          <SelectItem value="Sarajevo">Sarajevo</SelectItem>
          <SelectItem value="Remote">Remote</SelectItem>
          <SelectItem value="Hybrid">Hybrid</SelectItem>
        </CustomSelect>
      </Field>
      <Field label="Start date" required>
        <DatePicker
          mode="single"
          value={form.startDate}
          onChange={(date) => update("startDate", date)}
          placeholder="dd. mm. yyyy."
          size="compact"
          floatPortal
          portalContainer={datePortalContainer}
        />
      </Field>
      <Field label="Reports to" helper="Begin typing to search the directory">
        <CustomSelect
          value={form.reportsTo || NONE_MANAGER_VALUE}
          onChange={(value) =>
            update("reportsTo", value === NONE_MANAGER_VALUE ? "" : value)
          }
        >
          <SelectItem value={NONE_MANAGER_VALUE}>None</SelectItem>
          {managers.map((manager) => (
            <SelectItem key={manager.id} value={String(manager.id)}>
              {manager.first_name} {manager.last_name}
            </SelectItem>
          ))}
        </CustomSelect>
      </Field>
      <Field label="Initial status">
        <CustomSelect
          value={form.initialStatus}
          onChange={(value) => update("initialStatus", value)}
        >
          <SelectItem value="probation">Probation</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </CustomSelect>
      </Field>
      <CheckRow
        checked={form.sendInvite}
        onCheckedChange={(checked) => update("sendInvite", checked)}
        title="Send invite email"
        description={`Email a password-setup link to ${form.email || "the employee"}`}
      />
      <CheckRow
        checked={form.startOnboarding}
        onCheckedChange={(checked) => update("startOnboarding", checked)}
        title="Start onboarding checklist"
        description={
          defaultOnboardingTemplate
            ? `Assign ${defaultOnboardingTemplate.name} unless another template is selected`
            : "No default onboarding template is configured yet"
        }
      />
      {form.startOnboarding ? (
        <Field label="Onboarding template" className="col-span-2">
          <CustomSelect
            value={form.onboardingTemplateId}
            disabled={onboardingTemplates.length === 0}
            onChange={(value) => update("onboardingTemplateId", value)}
          >
            {defaultOnboardingTemplate ? (
              <SelectItem value={DEFAULT_TEMPLATE_VALUE}>
                Default configured - {defaultOnboardingTemplate.name}
              </SelectItem>
            ) : null}
            {onboardingTemplates.map((template) => (
              <SelectItem key={template.id} value={String(template.id)}>
                {template.name}
              </SelectItem>
            ))}
          </CustomSelect>
        </Field>
      ) : null}
      <IntroAnnouncementFields
        form={form}
        update={update}
        datePortalContainer={datePortalContainer}
      />
    </div>
  );
}

function IntroAnnouncementFields({
  form,
  update,
  datePortalContainer,
}: StepProps & {
  datePortalContainer: HTMLElement | null;
}) {
  return (
    <div className="col-span-2 space-y-4 rounded-2xl border border-zinc-200 p-4">
      <CheckRow
        checked={form.publishIntroAnnouncement}
        onCheckedChange={(checked) =>
          update("publishIntroAnnouncement", checked)
        }
        title="Publish introduction announcement"
        description="Create a company announcement for this new employee."
      />
      {form.publishIntroAnnouncement ? (
        <div className="grid grid-cols-2 gap-x-7 gap-y-5">
          <Field label="Announcement title" className="col-span-2">
            <input
              value={form.introAnnouncementTitle || defaultIntroTitle(form)}
              onChange={(e) => update("introAnnouncementTitle", e.target.value)}
            />
          </Field>
          <Field label="Announcement body" required className="col-span-2">
            <textarea
              className="min-h-28 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm"
              value={form.introAnnouncementBody}
              onChange={(e) => update("introAnnouncementBody", e.target.value)}
              placeholder="<p>Please welcome Jane to Engineering.</p>"
            />
          </Field>
          <Field
            label="Schedule date"
            helper="Leave blank to publish immediately"
          >
            <DatePicker
              mode="single"
              value={form.introAnnouncementScheduleDate}
              onChange={(date) => update("introAnnouncementScheduleDate", date)}
              placeholder="dd. mm. yyyy."
              size="compact"
              floatPortal
              portalContainer={datePortalContainer}
            />
          </Field>
          <Field label="Schedule time">
            <input
              type="time"
              value={form.introAnnouncementScheduleTime}
              disabled={!form.introAnnouncementScheduleDate}
              onChange={(e) =>
                update("introAnnouncementScheduleTime", e.target.value)
              }
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function ReviewStep({
  form,
  initials,
  selectedProject,
  selectedManager,
  selectedTemplate,
}: {
  form: FormState;
  initials: string;
  selectedProject?: EmployeeProjectOption;
  selectedManager?: Manager;
  selectedTemplate?: OnboardingTemplateOption;
}) {
  const managerName = selectedManager
    ? `${selectedManager.first_name} ${selectedManager.last_name}`
    : "None";
  const rows = [
    ["Email", form.email],
    ["Phone", form.phone || "-"],
    ["Job title", form.jobTitle],
    ["Department", form.department],
    ["Team", selectedProject?.name ?? "-"],
    [
      "Employment",
      `${labelize(form.employmentType)} - ${labelize(form.initialStatus)}`,
    ],
    ["Location", form.location],
    ["Start date", form.startDate],
    ["Reports to", managerName],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5 rounded-2xl border border-zinc-200 p-5">
        <div
          className="flex size-20 items-center justify-center rounded-full text-2xl font-bold text-zinc-700"
          style={{ backgroundColor: form.avatarColor }}
        >
          {initials}
        </div>
        <div>
          <h3 className="m-0 text-xl font-bold text-zinc-900">
            {form.firstName} {form.lastName}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">{form.jobTitle}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[220px_1fr] border-b border-zinc-200 px-5 py-3 last:border-b-0"
          >
            <span className="font-medium text-zinc-500">{label}</span>
            <span className="font-medium text-zinc-900">{value || "-"}</span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
        <p className="mb-2 flex items-center gap-2 font-semibold">
          <CheckCircle2 size={17} aria-hidden />
          On save we will...
        </p>
        <ul className="m-0 space-y-1 pl-6 text-sm">
          <li>Create the employee record and assign a profile ID</li>
          {form.sendInvite ? <li>Send a setup email to {form.email}</li> : null}
          {form.startOnboarding ? (
            <li>
              Start the {selectedTemplate?.name ?? "default"} onboarding
              checklist
            </li>
          ) : null}
          {form.publishIntroAnnouncement ? (
            <li>
              Publish introduction announcement:{" "}
              {form.introAnnouncementTitle || defaultIntroTitle(form)}
            </li>
          ) : null}
          <li>Notify the People team</li>
        </ul>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  helper,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      <div className="[&_input]:h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-zinc-300 [&_input]:bg-white [&_input]:px-4 [&_input]:text-sm">
        {children}
      </div>
      {helper ? (
        <span className="mt-1.5 block text-sm text-zinc-500">{helper}</span>
      ) : null}
    </label>
  );
}

function CustomSelect({
  value,
  placeholder,
  disabled,
  onChange,
  children,
}: {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const selectValue = value || EMPTY_SELECT_VALUE;

  return (
    <Select
      value={selectValue}
      onValueChange={(nextValue) =>
        onChange(nextValue === EMPTY_SELECT_VALUE ? "" : nextValue)
      }
      disabled={disabled}
    >
      <SelectTrigger className="h-10 rounded-lg border-zinc-300 px-4 text-sm shadow-none focus:ring-2 focus:ring-zinc-500/10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[170]">
        {placeholder ? (
          <SelectItem value={EMPTY_SELECT_VALUE} disabled>
            {placeholder}
          </SelectItem>
        ) : null}
        {children}
      </SelectContent>
    </Select>
  );
}

function CheckRow({
  checked,
  onCheckedChange,
  title,
  description,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="col-span-2 flex items-center gap-4 rounded-2xl border border-zinc-200 p-4">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span>
        <span className="block font-semibold text-zinc-900">{title}</span>
        <span className="block text-sm text-zinc-500">{description}</span>
      </span>
    </label>
  );
}

function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
