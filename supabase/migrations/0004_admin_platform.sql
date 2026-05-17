create table public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.admin_roles is
  'Server-authoritative platform admin grants. Mutate with SQL or service-role server code only.';

alter table public.admin_roles enable row level security;

create policy "Users can read their own admin role"
on public.admin_roles for select to authenticated
using (auth.uid() = user_id);

create index admin_roles_created_at_idx on public.admin_roles(created_at desc);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null check (
    action in ('create_user', 'update_user_profile', 'set_temporary_password')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is
  'Server-written audit trail for platform administration actions.';

alter table public.admin_audit_logs enable row level security;

create index admin_audit_logs_admin_user_id_idx on public.admin_audit_logs(admin_user_id);
create index admin_audit_logs_target_user_id_idx on public.admin_audit_logs(target_user_id);
create index admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);

-- Bootstrap the first admin manually after applying this migration:
-- insert into public.admin_roles (user_id)
-- values ('00000000-0000-0000-0000-000000000000');
