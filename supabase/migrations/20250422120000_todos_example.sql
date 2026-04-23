-- Example table for app/supabase-example. Run against your Supabase project (SQL editor or
-- `supabase db push` if you use the Supabase CLI linked to this project).

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

-- Demo: allow the anon / publishable key to read rows (tighten for production)
create policy "todos_select_anon"
  on public.todos
  for select
  to anon, authenticated
  using (true);
