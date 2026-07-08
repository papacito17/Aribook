-- AriBooks — Foundation schema
-- Multi-tenant double-entry ledger with database-enforced balancing,
-- immutable journal, row-level security per organization, and audit log.

create extension if not exists pgcrypto;

-- ── Tenants ──────────────────────────────────────────────────────────

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  ein text,
  reporting_basis text not null default 'accrual'
    check (reporting_basis in ('cash', 'accrual')),
  fiscal_year_start smallint not null default 1
    check (fiscal_year_start between 1 and 12),
  next_entry_number bigint not null default 1001,
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    check (role in ('owner', 'admin', 'accountant', 'member', 'readonly')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- security definer so RLS policies can call it without recursing into
-- the memberships policy itself
create or replace function public.is_org_member(org uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.org_id = org and m.user_id = auth.uid()
  );
$$;

-- ── Chart of accounts ────────────────────────────────────────────────

create table public.coa_template (
  code text primary key,
  name text not null,
  type text not null check (type in ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
  subtype text not null default '',
  normal_balance text not null check (normal_balance in ('debit', 'credit'))
);

insert into public.coa_template (code, name, type, subtype, normal_balance) values
  ('10100', 'Cash on Hand',              'Asset',     'Current Asset',        'debit'),
  ('10200', 'Checking Account',          'Asset',     'Bank',                 'debit'),
  ('10300', 'Savings Account',           'Asset',     'Bank',                 'debit'),
  ('11000', 'Accounts Receivable',       'Asset',     'Receivable',           'debit'),
  ('12000', 'Prepaid Expenses',          'Asset',     'Current Asset',        'debit'),
  ('13000', 'Inventory',                 'Asset',     'Current Asset',        'debit'),
  ('15000', 'Equipment',                 'Asset',     'Fixed Asset',          'debit'),
  ('15900', 'Accumulated Depreciation',  'Asset',     'Fixed Asset (Contra)', 'debit'),
  ('20000', 'Accounts Payable',          'Liability', 'Payable',              'credit'),
  ('21000', 'Credit Card',               'Liability', 'Credit Card',          'credit'),
  ('22100', 'Sales Tax Payable',         'Liability', 'Current Liability',    'credit'),
  ('23000', 'Payroll Liabilities',       'Liability', 'Current Liability',    'credit'),
  ('24000', 'Deferred Revenue',          'Liability', 'Current Liability',    'credit'),
  ('25000', 'Notes Payable',             'Liability', 'Long-Term Liability',  'credit'),
  ('30000', 'Owner''s Equity',           'Equity',    'Equity',               'credit'),
  ('31000', 'Retained Earnings',         'Equity',    'Equity',               'credit'),
  ('32000', 'Owner Draws',               'Equity',    'Equity (Contra)',      'credit'),
  ('40000', 'Sales Revenue',             'Income',    'Operating Income',     'credit'),
  ('41000', 'Service Revenue',           'Income',    'Operating Income',     'credit'),
  ('49000', 'Other Income',              'Income',    'Other Income',         'credit'),
  ('50000', 'Cost of Goods Sold',        'Expense',   'COGS',                 'debit'),
  ('60000', 'Advertising & Marketing',   'Expense',   'Operating Expense',    'debit'),
  ('61000', 'Bank Fees & Charges',       'Expense',   'Operating Expense',    'debit'),
  ('62000', 'Insurance',                 'Expense',   'Operating Expense',    'debit'),
  ('63000', 'Office Supplies',           'Expense',   'Operating Expense',    'debit'),
  ('64000', 'Rent & Lease',              'Expense',   'Operating Expense',    'debit'),
  ('65000', 'Software & Subscriptions',  'Expense',   'Operating Expense',    'debit'),
  ('66000', 'Utilities',                 'Expense',   'Operating Expense',    'debit'),
  ('67000', 'Payroll Expense',           'Expense',   'Operating Expense',    'debit'),
  ('68000', 'Travel',                    'Expense',   'Operating Expense',    'debit'),
  ('69000', 'Meals & Entertainment',     'Expense',   'Operating Expense',    'debit');

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  type text not null check (type in ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
  subtype text not null default '',
  normal_balance text not null check (normal_balance in ('debit', 'credit')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);

-- ── Journal (the ledger core) ────────────────────────────────────────

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  entry_number bigint not null,
  entry_date date not null,                -- economic/accrual date
  memo text not null default '',
  source text not null default 'manual'
    check (source in ('invoice', 'payment', 'bill', 'bank-feed', 'manual', 'reversal')),
  source_id uuid,
  settled boolean not null default false,  -- cash-basis: has cash moved?
  settled_date date,
  reverses_entry_id uuid references public.journal_entries (id),
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (org_id, entry_number),
  check (settled_date is null or settled)
);

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  entry_id uuid not null references public.journal_entries (id) on delete restrict,
  line_no smallint not null,
  account_id uuid not null references public.accounts (id),
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  description text not null default '',
  unique (entry_id, line_no),
  check ((debit = 0) <> (credit = 0))      -- exactly one side per line
);

create index journal_lines_account_idx on public.journal_lines (org_id, account_id);
create index journal_entries_date_idx on public.journal_entries (org_id, entry_date);

-- Deferred constraint: at commit time every entry's debits must equal credits.
create or replace function public.check_entry_balanced()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_entry uuid := coalesce(new.entry_id, old.entry_id);
  v_debits numeric;
  v_credits numeric;
begin
  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into v_debits, v_credits
    from journal_lines where entry_id = v_entry;
  if v_debits <> v_credits or v_debits = 0 then
    raise exception 'Unbalanced journal entry %: debits % != credits %',
      v_entry, v_debits, v_credits;
  end if;
  return null;
end;
$$;

create constraint trigger trg_entry_balanced
  after insert or update or delete on public.journal_lines
  deferrable initially deferred
  for each row execute function public.check_entry_balanced();

-- Immutability: the ledger is append-only. Corrections are reversal entries.
create or replace function public.forbid_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Ledger records are immutable — post a reversal entry instead';
end;
$$;

create trigger trg_lines_immutable
  before update or delete on public.journal_lines
  for each row execute function public.forbid_ledger_mutation();

create trigger trg_entries_no_delete
  before delete on public.journal_entries
  for each row execute function public.forbid_ledger_mutation();

-- Entries allow updating only the cash-settlement fields.
create or replace function public.restrict_entry_update()
returns trigger
language plpgsql
as $$
begin
  if new.id <> old.id
     or new.org_id <> old.org_id
     or new.entry_number <> old.entry_number
     or new.entry_date <> old.entry_date
     or new.memo <> old.memo
     or new.source <> old.source
     or new.source_id is distinct from old.source_id
     or new.reverses_entry_id is distinct from old.reverses_entry_id
     or new.created_by is distinct from old.created_by
     or new.created_at <> old.created_at then
    raise exception 'Only settlement fields (settled, settled_date) may change on a posted entry';
  end if;
  return new;
end;
$$;

create trigger trg_entries_settlement_only
  before update on public.journal_entries
  for each row execute function public.restrict_entry_update();

-- ── Business entities ────────────────────────────────────────────────

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address jsonb,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address jsonb,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid references public.customers (id),
  invoice_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'void')),
  issue_date date not null,
  due_date date,
  subtotal numeric(14, 2) not null default 0,
  tax numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  entry_id uuid references public.journal_entries (id),
  payment_entry_id uuid references public.journal_entries (id),
  created_at timestamptz not null default now(),
  unique (org_id, invoice_number)
);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null default '',
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  amount numeric(14, 2) not null default 0
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid references public.vendors (id),
  bill_number text,
  status text not null default 'open'
    check (status in ('open', 'paid', 'void')),
  issue_date date not null,
  due_date date,
  total numeric(14, 2) not null default 0,
  expense_account_id uuid references public.accounts (id),
  entry_id uuid references public.journal_entries (id),
  payment_entry_id uuid references public.journal_entries (id),
  created_at timestamptz not null default now()
);

create table public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  bank_account_id uuid references public.accounts (id),
  txn_date date not null,
  amount numeric(14, 2) not null,          -- negative = money out
  description text not null default '',
  merchant text,
  plaid_txn_id text,
  status text not null default 'unmatched'
    check (status in ('unmatched', 'matched', 'excluded')),
  matched_entry_id uuid references public.journal_entries (id),
  created_at timestamptz not null default now(),
  unique (org_id, plaid_txn_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid default auth.uid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ── Row-level security ───────────────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.customers enable row level security;
alter table public.vendors enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.bills enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.audit_log enable row level security;
alter table public.coa_template enable row level security;

create policy org_select on public.organizations
  for select using (public.is_org_member(id));
create policy org_update on public.organizations
  for update using (public.is_org_member(id));

create policy memberships_select on public.memberships
  for select using (user_id = auth.uid() or public.is_org_member(org_id));

create policy coa_template_read on public.coa_template
  for select to authenticated using (true);

create policy accounts_all on public.accounts
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy entries_all on public.journal_entries
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy lines_all on public.journal_lines
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy customers_all on public.customers
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy vendors_all on public.vendors
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy invoices_all on public.invoices
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy invoice_lines_all on public.invoice_lines
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy bills_all on public.bills
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy bank_txns_all on public.bank_transactions
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy audit_select on public.audit_log
  for select using (public.is_org_member(org_id));

-- ── RPCs ─────────────────────────────────────────────────────────────

-- Creates an org, makes the caller its owner, seeds the standard US COA.
create or replace function public.create_organization(org_name text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  insert into organizations (name) values (org_name) returning id into v_org;
  insert into memberships (org_id, user_id, role) values (v_org, auth.uid(), 'owner');
  insert into accounts (org_id, code, name, type, subtype, normal_balance)
    select v_org, t.code, t.name, t.type, t.subtype, t.normal_balance
    from coa_template t;
  insert into audit_log (org_id, action, entity, entity_id)
    values (v_org, 'create', 'organization', v_org);
  return v_org;
end;
$$;

-- Atomically posts a balanced journal entry.
-- p_lines: [{"account_code": "11000", "debit": 100, "credit": 0, "description": ""}, ...]
create or replace function public.post_journal_entry(
  p_org uuid,
  p_date date,
  p_memo text,
  p_source text,
  p_lines jsonb,
  p_source_id uuid default null,
  p_settled boolean default false,
  p_settled_date date default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_entry uuid;
  v_number bigint;
  v_line jsonb;
  v_line_no smallint := 0;
  v_account uuid;
begin
  if not public.is_org_member(p_org) then
    raise exception 'Not a member of this organization';
  end if;
  if p_lines is null or jsonb_array_length(p_lines) < 2 then
    raise exception 'A journal entry needs at least two lines';
  end if;

  update organizations
     set next_entry_number = next_entry_number + 1
   where id = p_org
   returning next_entry_number - 1 into v_number;

  insert into journal_entries
      (org_id, entry_number, entry_date, memo, source, source_id, settled, settled_date, created_by)
    values
      (p_org, v_number, p_date, coalesce(p_memo, ''), p_source, p_source_id,
       coalesce(p_settled, false), p_settled_date, auth.uid())
    returning id into v_entry;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_line_no := v_line_no + 1;
    select id into v_account
      from accounts
     where org_id = p_org and code = v_line->>'account_code';
    if v_account is null then
      raise exception 'Unknown account code % for this organization', v_line->>'account_code';
    end if;
    insert into journal_lines
        (org_id, entry_id, line_no, account_id, debit, credit, description)
      values
        (p_org, v_entry, v_line_no, v_account,
         coalesce((v_line->>'debit')::numeric, 0),
         coalesce((v_line->>'credit')::numeric, 0),
         coalesce(v_line->>'description', ''));
  end loop;

  -- Verify balance now rather than waiting for commit, so callers get
  -- an immediate, catchable error.
  set constraints trg_entry_balanced immediate;

  insert into audit_log (org_id, action, entity, entity_id, detail)
    values (p_org, 'post', 'journal_entry', v_entry,
            jsonb_build_object('entry_number', v_number, 'source', p_source));
  return v_entry;
end;
$$;

-- Marks an entry as cash-settled (the only mutation the ledger allows).
create or replace function public.settle_entry(p_entry uuid, p_date date)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from journal_entries where id = p_entry;
  if v_org is null or not public.is_org_member(v_org) then
    raise exception 'Entry not found';
  end if;
  update journal_entries
     set settled = true, settled_date = p_date
   where id = p_entry;
  insert into audit_log (org_id, action, entity, entity_id)
    values (v_org, 'settle', 'journal_entry', p_entry);
end;
$$;
