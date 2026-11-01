-- Profiles: one row per auth user, holding the login ID and display nickname.
-- Users sign in with an ID instead of an email, so the app maps each ID to an
-- internal email of the form "<username>@<internal domain>". The trigger
-- derives username from that email so it cannot diverge from the login ID.

create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  nickname text not null
    check (char_length(nickname) between 1 and 20),
  created_at timestamptz not null default now(),

  primary key (id)
);

alter table public.profiles enable row level security;

-- Owner-only access. Profiles are created by the trigger and removed by the
-- auth.users cascade, so clients only need to read and edit their nickname.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nickname) on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, nickname)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- The trigger function must not be callable through the Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
