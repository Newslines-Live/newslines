-- Newslines core schema

create extension if not exists "pgcrypto";

-- Profiles (mirrors auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Roles
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  granted_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

create policy "Roles readable by authenticated"
  on public.roles for select to authenticated using (true);

create policy "User roles readable by authenticated"
  on public.user_roles for select to authenticated using (true);

insert into public.roles (name, description) values
  ('superadmin', 'Full admin access'),
  ('admin', 'Admin access'),
  ('moderator', 'Moderation access')
on conflict (name) do nothing;

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('superadmin') or public.has_role('admin');
$$;

-- Topics (newslines)
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bio text,
  image_url text,
  is_featured boolean not null default false,
  cluster text check (cluster is null or cluster in ('musk', 'mcgregor')),
  wp_category_id integer unique,
  post_count integer not null default 0,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index topics_cluster_idx on public.topics (cluster);
create index topics_featured_idx on public.topics (is_featured);
create index topics_last_event_at_idx on public.topics (last_event_at desc nulls last);
create index topics_post_count_idx on public.topics (post_count desc);

alter table public.topics enable row level security;

create policy "Topics are publicly readable"
  on public.topics for select using (true);

create policy "Admins can insert topics"
  on public.topics for insert with check (public.is_admin());

create policy "Admins can update topics"
  on public.topics for update using (public.is_admin());

create policy "Admins can delete topics"
  on public.topics for delete using (public.is_admin());

-- Event types (green pills)
create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_slug text,
  created_at timestamptz not null default now()
);

alter table public.event_types enable row level security;

create policy "Event types are publicly readable"
  on public.event_types for select using (true);

create policy "Admins manage event types"
  on public.event_types for all using (public.is_admin()) with check (public.is_admin());

-- Events (news posts)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary_html text not null default '',
  occurred_at timestamptz not null,
  event_type_id uuid references public.event_types (id) on delete set null,
  canonical_topic_slug text,
  media_url text,
  wp_post_id integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_occurred_at_idx on public.events (occurred_at desc);
create index events_event_type_id_idx on public.events (event_type_id);

alter table public.events enable row level security;

create policy "Events are publicly readable"
  on public.events for select using (true);

create policy "Admins can insert events"
  on public.events for insert with check (public.is_admin());

create policy "Admins can update events"
  on public.events for update using (public.is_admin());

create policy "Admins can delete events"
  on public.events for delete using (public.is_admin());

-- Service role / migration writes bypass RLS; also allow service via bypass.

create table public.event_topics (
  event_id uuid not null references public.events (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  primary key (event_id, topic_id)
);

create index event_topics_topic_id_idx on public.event_topics (topic_id);

alter table public.event_topics enable row level security;

create policy "Event topics publicly readable"
  on public.event_topics for select using (true);

create policy "Admins manage event topics"
  on public.event_topics for all using (public.is_admin()) with check (public.is_admin());

-- Favorites for The Grid
create table public.topic_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.topic_favorites enable row level security;

create policy "Users read own favorites"
  on public.topic_favorites for select using (auth.uid() = user_id);

create policy "Users manage own favorites"
  on public.topic_favorites for insert with check (auth.uid() = user_id);

create policy "Users delete own favorites"
  on public.topic_favorites for delete using (auth.uid() = user_id);

-- Admin audit
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id),
  action_type text not null,
  target_type text,
  target_id text,
  action_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create policy "Admins read audit log"
  on public.admin_audit_log for select using (public.is_admin());

create policy "Admins write audit log"
  on public.admin_audit_log for insert with check (public.is_admin());

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Refresh topic stats
create or replace function public.refresh_topic_stats(p_topic_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.topics t
  set
    post_count = coalesce(s.cnt, 0),
    last_event_at = s.last_at,
    updated_at = now()
  from (
    select
      et.topic_id,
      count(*)::integer as cnt,
      max(e.occurred_at) as last_at
    from public.event_topics et
    join public.events e on e.id = et.event_id
    group by et.topic_id
  ) s
  where t.id = s.topic_id
    and (p_topic_id is null or t.id = p_topic_id);

  if p_topic_id is not null then
    update public.topics t
    set post_count = 0, last_event_at = null, updated_at = now()
    where t.id = p_topic_id
      and not exists (
        select 1 from public.event_topics et where et.topic_id = t.id
      );
  end if;
end;
$$;
