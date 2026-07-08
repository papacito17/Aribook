import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Shared shell for legal documents (Terms, Privacy). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/75 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/75">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-emerald-700 text-sm font-black text-white shadow-md shadow-brand-500/30">
              A
            </span>
            <span className="text-base font-bold tracking-tight">
              Ari<span className="text-brand-600 dark:text-brand-400">Books</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            <ArrowLeft size={15} /> Back to home
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: {updated}
        </p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
      </article>
    </main>
  );
}

export function LegalSection({
  id,
  heading,
  children,
}: {
  id?: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {heading}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
