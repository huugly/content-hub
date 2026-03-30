-- ─── Profiles ───────────────────────────────────────────────────────────────────
-- Auto-created on first login via trigger
create table profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- ─── Watchlist ───────────────────────────────────────────────────────────────────
-- Creators / sites being tracked
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  platform text not null check (platform in ('youtube', 'x', 'website')),
  url text not null,
  feed_url text,                   -- RSS/Atom feed URL (auto-detected or manual)
  avatar_url text,
  last_fetched_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── Content Items ───────────────────────────────────────────────────────────────
-- Fetched content from watchlist sources
create table content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  watchlist_id uuid references watchlist(id) on delete cascade not null,
  external_id text,                -- platform-specific ID for deduplication
  title text not null,
  description text,
  url text not null,
  thumbnail_url text,
  published_at timestamptz,
  platform text not null,
  content_ideas text[],            -- array of 1-2 generated ideas
  ideas_generated_at timestamptz,
  fetched_at timestamptz default now(),
  unique(watchlist_id, external_id)
);

-- ─── Saved Ideas ─────────────────────────────────────────────────────────────────
-- Ideas saved from content cards to the Post Builder
create table saved_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  content_item_id uuid references content_items(id) on delete set null,
  title text not null,
  idea_text text not null,
  source_url text,
  source_creator text,
  platform_target text check (platform_target in ('linkedin', 'x', 'youtube', 'instagram', 'newsletter', 'other')),
  status text default 'backlog' check (status in ('backlog', 'in_progress', 'done')),
  created_at timestamptz default now()
);

-- ─── Settings ────────────────────────────────────────────────────────────────────
-- Per-user app preferences (configurable from UI)
create table settings (
  user_id uuid references profiles(id) on delete cascade primary key,
  fetch_hour_utc integer default 5 check (fetch_hour_utc >= 0 and fetch_hour_utc <= 23),
  updated_at timestamptz default now()
);

-- ─── Auto-create profile on signup ──────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  -- also create default settings row
  insert into public.settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Row Level Security ──────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table watchlist enable row level security;
alter table content_items enable row level security;
alter table saved_ideas enable row level security;
alter table settings enable row level security;

create policy "owner only" on profiles for all using (auth.uid() = id);
create policy "owner only" on watchlist for all using (auth.uid() = user_id);
create policy "owner only" on content_items for all using (auth.uid() = user_id);
create policy "owner only" on saved_ideas for all using (auth.uid() = user_id);
create policy "owner only" on settings for all using (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────────
create index idx_content_items_watchlist_id on content_items(watchlist_id);
create index idx_content_items_published_at on content_items(published_at desc);
create index idx_content_items_platform on content_items(platform);
create index idx_content_items_ideas on content_items(ideas_generated_at) where ideas_generated_at is null;
create index idx_watchlist_user_active on watchlist(user_id) where is_active = true;
create index idx_saved_ideas_user_platform on saved_ideas(user_id, platform_target);
