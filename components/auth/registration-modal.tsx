"use client";

/**
 * Multi-step Registration / Onboarding modal.
 *
 * Step 1 — Credentials
 * Step 2 — Company profile
 * Step 3 — Terms & Compliance Checklist: the "Create Account" button
 *          stays locked until every required checkbox is accepted.
 * Step 4 — Success → enter the dashboard
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { US_STATES } from "@/lib/api/avalara";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = ["Account", "Company", "Compliance"] as const;

export function RegistrationModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    company: "",
    industry: "SaaS / Technology",
    state: "NY",
  });
  const [accepted, setAccepted] = useState({
    terms: false,
    privacy: false,
    marketing: false, // optional — does not gate the button
  });
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const step1Valid =
    form.fullName.trim().length > 1 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) &&
    form.password.length >= 8;
  const step2Valid = form.company.trim().length > 1;

  /** The compliance gate: both required policies must be accepted. */
  const complianceComplete = useMemo(
    () => accepted.terms && accepted.privacy,
    [accepted]
  );

  if (!open) return null;

  const close = () => {
    onClose();
    // Reset after the exit transition so reopening starts fresh.
    setTimeout(() => {
      setStep(0);
      setDone(false);
      setAccepted({ terms: false, privacy: false, marketing: false });
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create your Ari Books account"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />

      {/* Panel */}
      <div className="gradient-border relative w-full max-w-lg animate-scale-in rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X size={18} />
        </button>

        <div className="p-8">
          {done ? (
            <SuccessScreen name={form.fullName} />
          ) : (
            <>
              {/* Progress */}
              <div className="mb-8 flex items-center gap-2">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex flex-1 flex-col gap-1.5">
                    <div
                      className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        i <= step
                          ? "bg-brand-500"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-medium transition-colors",
                        i <= step
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-zinc-400 dark:text-zinc-500"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {step === 0 && (
                <StepShell
                  title="Create your account"
                  subtitle="Start your 30-day free trial. No credit card required."
                >
                  <Field
                    icon={<User size={15} />}
                    label="Full name"
                    type="text"
                    placeholder="Alex Rivera"
                    value={form.fullName}
                    onChange={set("fullName")}
                  />
                  <Field
                    icon={<Mail size={15} />}
                    label="Work email"
                    type="email"
                    placeholder="alex@company.com"
                    value={form.email}
                    onChange={set("email")}
                  />
                  <Field
                    icon={<Lock size={15} />}
                    label="Password"
                    type="password"
                    placeholder="8+ characters"
                    value={form.password}
                    onChange={set("password")}
                  />
                  <NavButtons
                    onNext={() => setStep(1)}
                    nextDisabled={!step1Valid}
                  />
                </StepShell>
              )}

              {step === 1 && (
                <StepShell
                  title="About your business"
                  subtitle="We pre-configure your chart of accounts and sales tax nexus."
                >
                  <Field
                    icon={<Building2 size={15} />}
                    label="Company name"
                    type="text"
                    placeholder="Acme Studio LLC"
                    value={form.company}
                    onChange={set("company")}
                  />
                  <SelectField
                    label="Industry"
                    value={form.industry}
                    onChange={set("industry")}
                    options={[
                      "SaaS / Technology",
                      "Professional Services",
                      "E-commerce & Retail",
                      "Construction & Trades",
                      "Healthcare",
                      "Other",
                    ]}
                  />
                  <SelectField
                    label="Primary state (sales tax nexus)"
                    value={form.state}
                    onChange={set("state")}
                    options={US_STATES}
                  />
                  <NavButtons
                    onBack={() => setStep(0)}
                    onNext={() => setStep(2)}
                    nextDisabled={!step2Valid}
                  />
                </StepShell>
              )}

              {step === 2 && (
                <StepShell
                  title="Terms & Compliance"
                  subtitle="Review and accept our policies to activate your account."
                >
                  <div className="space-y-3">
                    <ComplianceCheckbox
                      required
                      checked={accepted.terms}
                      onToggle={() =>
                        setAccepted((a) => ({ ...a, terms: !a.terms }))
                      }
                      title="Terms and Conditions"
                      description={
                        <>
                          I have read and agree to the{" "}
                          <PolicyLink href="#terms">
                            Terms and Conditions
                          </PolicyLink>
                          , including the subscription and billing terms.
                        </>
                      }
                    />
                    <ComplianceCheckbox
                      required
                      checked={accepted.privacy}
                      onToggle={() =>
                        setAccepted((a) => ({ ...a, privacy: !a.privacy }))
                      }
                      title="Privacy Policy"
                      description={
                        <>
                          I consent to the processing of my data as described
                          in the <PolicyLink href="#privacy">Privacy Policy</PolicyLink>{" "}
                          (SOC 2 Type II, bank-level encryption).
                        </>
                      }
                    />
                    <ComplianceCheckbox
                      checked={accepted.marketing}
                      onToggle={() =>
                        setAccepted((a) => ({ ...a, marketing: !a.marketing }))
                      }
                      title="Product updates (optional)"
                      description="Send me occasional emails about new features and tax deadline reminders."
                    />
                  </div>

                  {/* Gate status */}
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-300",
                      complianceComplete
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    <ShieldCheck size={14} />
                    {complianceComplete
                      ? "Compliance checklist complete — you're good to go."
                      : "Accept both required policies to unlock account creation."}
                  </div>

                  <div className="flex gap-3">
                    <BackButton onClick={() => setStep(1)} />
                    <button
                      onClick={() => setDone(true)}
                      disabled={!complianceComplete}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                        complianceComplete
                          ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:-translate-y-0.5 hover:bg-brand-500 active:translate-y-0"
                          : "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                      )}
                    >
                      {complianceComplete ? (
                        <Sparkles size={15} />
                      ) : (
                        <Lock size={15} />
                      )}
                      Create Account
                    </button>
                  </div>
                </StepShell>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function ComplianceCheckbox({
  checked,
  onToggle,
  title,
  description,
  required,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description: React.ReactNode;
  required?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200",
        checked
          ? "border-brand-500/60 bg-brand-50/60 dark:bg-brand-900/20"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
          checked
            ? "border-brand-500 bg-brand-500 text-white"
            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
        )}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-sm font-semibold">
          {title}
          {required && (
            <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              Required
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </span>
      </span>
    </button>
  );
}

function PolicyLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-500 dark:text-brand-400"
    >
      {children}
    </a>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <div className="flex gap-3 pt-1">
      {onBack && <BackButton onClick={onBack} />}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
          nextDisabled
            ? "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
            : "bg-zinc-900 text-white hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        )}
      >
        Continue <ArrowRight size={15} />
      </button>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <ArrowLeft size={15} /> Back
    </button>
  );
}

function SuccessScreen({ name }: { name: string }) {
  const firstName = name.trim().split(" ")[0] || "there";
  return (
    <div className="animate-scale-in flex flex-col items-center py-6 text-center">
      <div className="animate-pulse-ring flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white">
        <CheckCircle2 size={32} />
      </div>
      <h2 className="mt-5 text-xl font-bold">Welcome aboard, {firstName}!</h2>
      <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        Your ledger is initialized with a standard US GAAP chart of accounts.
        Let&apos;s connect your first bank feed.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-500"
      >
        Enter Dashboard <ArrowRight size={15} />
      </Link>
    </div>
  );
}
