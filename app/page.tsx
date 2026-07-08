"use client";

/**
 * Marketing Landing Page — hero, value propositions, pricing, and the
 * conversion flow into the multi-step registration modal.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  Check,
  Landmark,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { RegistrationModal } from "@/components/auth/registration-modal";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [signupOpen, setSignupOpen] = useState(false);
  const openSignup = () => setSignupOpen(true);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar onSignup={openSignup} />
      <main>
        <Hero onSignup={openSignup} />
        <ValueProps />
        <Pricing onSignup={openSignup} />
        <FinalCta onSignup={openSignup} />
      </main>
      <Footer />
      <RegistrationModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
}

// ── Navbar ──────────────────────────────────────────────────

function Navbar({ onSignup }: { onSignup: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/75 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/75">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
          <a href="#features" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">Features</a>
          <a href="#pricing" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">Pricing</a>
          <Link href="/dashboard" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">Live Demo</Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white sm:block"
          >
            Log In
          </Link>
          <button
            onClick={onSignup}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-zinc-900"
          >
            Sign Up
          </button>
        </div>
      </nav>
    </header>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-emerald-700 text-sm font-black text-white shadow-md shadow-brand-500/30">
        A
      </span>
      <span className="text-lg font-bold tracking-tight">
        Ari<span className="text-brand-600 dark:text-brand-400">Books</span>
      </span>
    </Link>
  );
}

// ── Hero ────────────────────────────────────────────────────

function Hero({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-400/20 via-emerald-300/10 to-violet-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="stagger">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-brand-500/30 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
            <Sparkles size={13} />
            Built for US businesses — GAAP-native from day one
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            Accounting that feels like{" "}
            <span className="bg-gradient-to-r from-brand-500 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
              the future
            </span>
            , not the 90s.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Automated bank feeds, real-time US GAAP reporting, and sales tax
            that files itself. Everything QuickBooks should have become.
          </p>

          <div className="mt-9 flex items-center justify-center gap-4">
            <button
              onClick={onSignup}
              className="group flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition-all duration-300 hover:-translate-y-1 hover:bg-brand-500 hover:shadow-2xl hover:shadow-brand-500/40"
            >
              Start Free Trial
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-300 px-7 py-3.5 text-sm font-semibold text-zinc-700 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:text-brand-400"
            >
              Explore the Demo
            </Link>
          </div>
        </div>

        {/* Dashboard preview mock */}
        <div className="gradient-border mx-auto mt-16 max-w-4xl animate-fade-up rounded-2xl bg-white/80 p-2 shadow-2xl shadow-zinc-900/10 backdrop-blur dark:bg-zinc-900/80 [animation-delay:0.45s]">
          <div className="rounded-xl border border-zinc-100 bg-gradient-to-b from-zinc-50 to-white p-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-medium text-zinc-500">Net Income · Accrual Basis · Jul 2026</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
                  $84,210.75
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Zap size={12} /> +18.4% MoM
              </span>
            </div>
            {/* Mini bar chart */}
            <div className="mt-6 flex h-28 items-end gap-3">
              {[42, 58, 51, 70, 83, 96].map((h, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-brand-600 to-brand-400 opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-brand-500/30"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] font-medium text-zinc-400">
                    {["Feb", "Mar", "Apr", "May", "Jun", "Jul"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Value Propositions ──────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: Landmark,
    title: "Automated Bank Feeds",
    description:
      "Connect Chase, Amex, and 12,000+ US institutions via Plaid. Transactions stream in, get auto-categorized, and post to your ledger with one click.",
    accent: "from-brand-500/15 to-emerald-500/5",
  },
  {
    icon: BarChart3,
    title: "Real-Time US GAAP Reports",
    description:
      "A true double-entry engine underneath. P&L, Balance Sheet, and Cash Flow update the instant a transaction lands — cash or accrual basis, your call.",
    accent: "from-violet-500/15 to-indigo-500/5",
  },
  {
    icon: BadgePercent,
    title: "Automated Sales Tax",
    description:
      "Avalara-powered rates for every state, county, and special district. Exact tax on every invoice, with liability tracked to the penny in account 22100.",
    accent: "from-amber-500/15 to-orange-500/5",
  },
];

function ValueProps() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Why Ari Books
        </p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
          Three things we obsess over
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {VALUE_PROPS.map(({ icon: Icon, title, description, accent }) => (
          <div
            key={title}
            className="gradient-border group relative rounded-2xl bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-500/10 dark:bg-zinc-900"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                accent
              )}
            />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 dark:bg-brand-900/30 dark:text-brand-400">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Pricing ─────────────────────────────────────────────────

const TIERS = [
  {
    name: "Starter",
    price: 15,
    blurb: "Freelancers & solo founders",
    features: [
      "1 user + your accountant",
      "Automated bank feeds (2 accounts)",
      "Unlimited invoices with Stripe payments",
      "Cash-basis P&L",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: 40,
    blurb: "Small teams that are scaling",
    features: [
      "5 users + your accountant",
      "Unlimited bank feeds",
      "Automated sales tax (all 50 states)",
      "Cash & accrual GAAP reporting",
      "Bills & vendor management",
    ],
    popular: true,
  },
  {
    name: "Scale",
    price: 90,
    blurb: "Established businesses",
    features: [
      "Unlimited users & roles",
      "Class & location tracking",
      "Custom report builder",
      "Priority support + dedicated CPA line",
      "API access",
    ],
    popular: false,
  },
];

function Pricing({ onSignup }: { onSignup: () => void }) {
  return (
    <section id="pricing" className="bg-zinc-50 py-24 dark:bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Pricing
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
            Half the price of QuickBooks. Twice the product.
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">
            Every plan includes a 30-day free trial. Cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl bg-white p-8 transition-all duration-500 hover:-translate-y-2 dark:bg-zinc-900",
                tier.popular
                  ? "gradient-border shadow-2xl shadow-brand-500/15 lg:scale-105"
                  : "border border-zinc-200 shadow-sm hover:shadow-xl dark:border-zinc-800"
              )}
            >
              {tier.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-brand-600/30">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold">{tier.name}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {tier.blurb}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">
                  ${tier.price}
                </span>
                <span className="text-sm text-zinc-500">/month</span>
              </div>
              <ul className="mt-7 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-brand-500"
                    />
                    <span className="text-zinc-600 dark:text-zinc-300">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onSignup}
                className={cn(
                  "mt-8 rounded-xl py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5",
                  tier.popular
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500"
                    : "border border-zinc-300 text-zinc-700 hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-200"
                )}
              >
                Start Free Trial
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA + Footer ──────────────────────────────────────

function FinalCta({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="gradient-border relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-16 text-center text-white dark:bg-zinc-900">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-600/25 via-transparent to-violet-600/20" />
        <div className="relative">
          <ShieldCheck size={36} className="mx-auto text-brand-400" />
          <h2 className="mx-auto mt-5 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your books, audit-ready. Every single day.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-300">
            Join thousands of US businesses that switched from QuickBooks in
            under an afternoon.
          </p>
          <button
            onClick={onSignup}
            className="mt-8 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/20"
          >
            Get Started — It&apos;s Free
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-10 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 sm:flex-row">
        <Logo />
        <p>© 2026 Ari Books, Inc. · SOC 2 Type II · Made in the USA</p>
        <div className="flex gap-6">
          <Link href="/terms" className="transition-colors hover:text-brand-600">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-brand-600">Privacy</Link>
          <Link href="/privacy#security" className="transition-colors hover:text-brand-600">Security</Link>
        </div>
      </div>
    </footer>
  );
}
