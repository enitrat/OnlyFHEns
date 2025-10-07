Supabase integration

Environment variables

- `frontend/.env.local` must define:
  - `VITE_PUBLIC_SUPABASE_URL`
  - `VITE_PUBLIC_SUPABASE_ANON_KEY`

Database schema

```sql
-- Run in the SQL editor in your Supabase project
create table if not exists public.creators (
  id bigserial primary key,
  network text not null,
  address text not null,
  name text not null,
  x text null,
  instagram text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists creators_network_address_key
  on public.creators (network, address);

-- Enable RLS
alter table public.creators enable row level security;

-- Public read access
create policy creators_read
  on public.creators for select
  using (true);

-- Public write access (optional; see security note)
create policy creators_write
  on public.creators for insert
  with check (true);

create policy creators_update
  on public.creators for update
  using (true) with check (true);
```

Security note

- The above policies allow anonymous read/write to `creators` using the anon key. For production, consider restricting
  inserts/updates to authenticated users or to signed webhooks.

Key-Value store (optional, used by `frontend/app/lib/db.ts`)

```sql
create table if not exists public.kv_store (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.kv_store enable row level security;

-- Public read (optional)
create policy if not exists kv_read on public.kv_store for select using (true);

-- Public write (demo only; avoid in production)
create policy if not exists kv_write on public.kv_store for insert with check (true);
create policy if not exists kv_update on public.kv_store for update using (true) with check (true);
create policy if not exists kv_delete on public.kv_store for delete using (true);
```

Notes

- The frontend’s `db` module prefers Supabase `kv_store` when `VITE_PUBLIC_SUPABASE_URL` and
  `VITE_PUBLIC_SUPABASE_ANON_KEY` are set, and falls back to localStorage otherwise. It also writes a local cache to
  support synchronous reads where needed.
