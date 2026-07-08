"use client";

/**
 * Global financial state, backed by Supabase.
 *
 * The journal lives in Postgres (immutable, balance-enforced, RLS-scoped
 * to the user's organization). This context loads it once, then keeps an
 * optimistic in-memory mirror: postEntry/markSettled update the UI
 * instantly and persist through the ledger RPCs in the background.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createEntry,
  type EntrySource,
  type JournalEntry,
  type ReportingBasis,
} from "@/lib/ledger/journal";
import {
  cashBalance,
  monthlyPnLSeries,
  profitAndLoss,
  type MonthlyPnL,
  type ProfitAndLoss,
} from "@/lib/ledger/reports";
import { createClient } from "@/lib/supabase/client";

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id);

type DbResult = { data?: unknown; error: { message: string } | null };

interface EntryRow {
  id: string;
  entry_date: string;
  memo: string;
  source: EntrySource;
  settled: boolean;
  settled_date: string | null;
  journal_lines: {
    line_no: number;
    debit: string | number;
    credit: string | number;
    accounts: { code: string } | null;
  }[];
}

function rowToEntry(row: EntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.entry_date,
    memo: row.memo,
    source: row.source,
    settled: row.settled,
    settledDate: row.settled_date ?? undefined,
    lines: [...row.journal_lines]
      .sort((a, b) => a.line_no - b.line_no)
      .map((l) => ({
        accountCode: l.accounts?.code ?? "",
        debit: Number(l.debit),
        credit: Number(l.credit),
      })),
  };
}

export interface OrgProfile {
  id: string;
  name: string;
  ein: string | null;
}

export interface UserProfile {
  name: string;
  email: string;
  state: string | null;
}

interface FinanceState {
  loading: boolean;
  orgId: string | null;
  org: OrgProfile | null;
  user: UserProfile | null;
  basis: ReportingBasis;
  setBasis: (b: ReportingBasis) => void;
  entries: JournalEntry[];
  postEntry: (entry: Omit<JournalEntry, "id">) => JournalEntry;
  markSettled: (entryId: string, settledDate: string) => void;
  pnl: ProfitAndLoss;
  cash: number;
  series: MonthlyPnL[];
}

const FinanceContext = createContext<FinanceState | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [basis, setBasisState] = useState<ReportingBasis>("accrual");
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // Initial load: resolve the user's organization and pull the journal.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser || cancelled) return;

      const meta = (authUser.user_metadata ?? {}) as {
        full_name?: string;
        state?: string;
      };
      setUser({
        name: meta.full_name || authUser.email?.split("@")[0] || "Account",
        email: authUser.email ?? "",
        state: meta.state ?? null,
      });

      const { data: memberships } = await supabase
        .from("memberships")
        .select("org_id, organizations(name, ein, reporting_basis)")
        .limit(1);

      let org = memberships?.[0]?.org_id as string | undefined;
      const orgRow = memberships?.[0]?.organizations as {
        name?: string;
        ein?: string | null;
        reporting_basis?: string;
      } | null;
      const orgBasis = orgRow?.reporting_basis;

      if (!org) {
        // Signed up outside the onboarding modal — provision a default org.
        const { data: created, error } = await supabase.rpc(
          "create_organization",
          { org_name: "My Company" }
        );
        if (error) {
          console.error("Failed to create organization:", error.message);
          if (!cancelled) setLoading(false);
          return;
        }
        org = created as string;
      }
      if (cancelled) return;

      setOrgId(org);
      setOrg({
        id: org,
        name: orgRow?.name ?? "My Company",
        ein: orgRow?.ein ?? null,
      });
      if (orgBasis === "cash" || orgBasis === "accrual") setBasisState(orgBasis);

      const { data: rows, error: loadError } = await supabase
        .from("journal_entries")
        .select(
          "id, entry_date, memo, source, settled, settled_date, journal_lines(line_no, debit, credit, accounts(code))"
        )
        .eq("org_id", org)
        .order("entry_number", { ascending: true });

      if (loadError) console.error("Failed to load journal:", loadError.message);
      if (!cancelled) {
        setEntries(((rows as unknown as EntryRow[]) ?? []).map(rowToEntry));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the reporting basis on the organization.
  const setBasis = useCallback(
    (b: ReportingBasis) => {
      setBasisState(b);
      if (orgId) {
        const supabase = createClient();
        supabase
          .from("organizations")
          .update({ reporting_basis: b })
          .eq("id", orgId)
          .then(({ error }: DbResult) => {
            if (error) console.error("Failed to save basis:", error.message);
          });
      }
    },
    [orgId]
  );

  const postEntry = useCallback(
    (entry: Omit<JournalEntry, "id">) => {
      // Validates balance locally (throws on unbalanced) and shows instantly.
      const posted = createEntry(entry);
      setEntries((prev) => [...prev, posted]);

      if (orgId) {
        const supabase = createClient();
        supabase
          .rpc("post_journal_entry", {
            p_org: orgId,
            p_date: entry.date,
            p_memo: entry.memo,
            p_source: entry.source,
            p_lines: entry.lines.map((l) => ({
              account_code: l.accountCode,
              debit: l.debit,
              credit: l.credit,
            })),
            p_settled: entry.settled,
            p_settled_date: entry.settledDate ?? null,
          })
          .then(({ data, error }: DbResult) => {
            if (error) {
              console.error("Failed to persist entry:", error.message);
              // Roll back the optimistic entry so UI matches the ledger.
              setEntries((prev) => prev.filter((e) => e.id !== posted.id));
            } else if (data) {
              // Swap the temporary id for the database uuid.
              setEntries((prev) =>
                prev.map((e) =>
                  e.id === posted.id ? { ...e, id: data as string } : e
                )
              );
            }
          });
      }
      return posted;
    },
    [orgId]
  );

  const markSettled = useCallback((entryId: string, settledDate: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, settled: true, settledDate } : e
      )
    );
    if (isUuid(entryId)) {
      const supabase = createClient();
      supabase
        .rpc("settle_entry", { p_entry: entryId, p_date: settledDate })
        .then(({ error }: DbResult) => {
          if (error) console.error("Failed to settle entry:", error.message);
        });
    }
  }, []);

  const pnl = useMemo(() => profitAndLoss(entries, basis), [entries, basis]);
  const cash = useMemo(() => cashBalance(entries), [entries]);
  const series = useMemo(
    () => monthlyPnLSeries(entries, basis),
    [entries, basis]
  );

  const value = useMemo(
    () => ({
      loading,
      orgId,
      org,
      user,
      basis,
      setBasis,
      entries,
      postEntry,
      markSettled,
      pnl,
      cash,
      series,
    }),
    [loading, orgId, org, user, basis, setBasis, entries, postEntry, markSettled, pnl, cash, series]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceState {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
