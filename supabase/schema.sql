-- ============================================================
--  Pokémon-koordinator — databas-schema
--  Kör hela den här filen i Supabase → SQL Editor → New query.
--  Den är säker att köra flera gånger.
-- ============================================================

-- gen_random_uuid() kommer från pgcrypto (finns oftast redan).
create extension if not exists "pgcrypto";

create table if not exists public.cards (
  id                        uuid primary key default gen_random_uuid(),
  name                      text        not null,
  tradera_url               text        not null,
  image_url                 text,
  max_bid                   integer     not null,
  estimated_value           integer     not null,
  near_mint_value           integer     not null,
  auction_ends_at           timestamptz not null,
  comment                   text,
  submitted_by              text        not null,
  submitted_at              timestamptz not null default now(),
  status                    text        not null default 'pending'
                              check (status in ('pending', 'approved', 'denied')),
  decision_reason           text,
  decision_reason_details   text,
  decided_by                text,
  decided_at                timestamptz
);

-- Snabbare sortering på slut-tid och status.
create index if not exists cards_status_idx        on public.cards (status);
create index if not exists cards_auction_ends_idx  on public.cards (auction_ends_at);

-- ------------------------------------------------------------
--  Row Level Security
--  Lösenordsgrinden i appen är enda åtkomstkontrollen, så vi
--  tillåter alla läsningar/skrivningar med den publika anon-nyckeln.
-- ------------------------------------------------------------
alter table public.cards enable row level security;

drop policy if exists "anon select" on public.cards;
drop policy if exists "anon insert" on public.cards;
drop policy if exists "anon update" on public.cards;
drop policy if exists "anon delete" on public.cards;

create policy "anon select" on public.cards for select using (true);
create policy "anon insert" on public.cards for insert with check (true);
create policy "anon update" on public.cards for update using (true) with check (true);
create policy "anon delete" on public.cards for delete using (true);

-- ------------------------------------------------------------
--  Realtime: låt appen få live-uppdateringar när kort läggs till
--  eller ändras. (Ignorera felet om tabellen redan är tillagd.)
-- ------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.cards;
exception
  when duplicate_object then null;
end $$;
