-- Friends and visibility: users send friend requests by login ID; once the
-- other side accepts, each can read the other's records, contents and
-- thumbnails while that owner's account is public. Friends never write.

-- 1) Visibility, public by default.
alter table public.profiles
  add column is_public boolean not null default true;

grant update (is_public) on public.profiles to authenticated;

-- 2) Friendships: one row per pair, pending until the addressee accepts.
--    Rejecting, cancelling and unfriending all delete the row.
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references auth.users on delete cascade,
  addressee_id uuid not null references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),

  constraint friendships_not_self check (requester_id <> addressee_id)
);

-- One friendship per pair, whichever side sent it.
create unique index friendships_pair_idx on public.friendships
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;
revoke all on public.friendships from anon, authenticated;
grant select, insert, delete on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;

create policy "Members see their friendships"
  on public.friendships for select
  to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "Users send pending requests"
  on public.friendships for insert
  to authenticated
  with check ((select auth.uid()) = requester_id and status = 'pending');

create policy "Addressees accept requests"
  on public.friendships for update
  to authenticated
  using ((select auth.uid()) = addressee_id)
  with check ((select auth.uid()) = addressee_id and status = 'accepted');

create policy "Members remove friendships"
  on public.friendships for delete
  to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- 3) Helpers in a schema the Data API does not expose. They bypass RLS to
--    read friendships/profiles and always check the calling user.
create schema if not exists private;
grant usage on schema private to authenticated;

-- True when the caller is an accepted friend of `owner` and `owner` is public.
create function private.can_view(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships f
    join public.profiles p on p.id = owner
    where f.status = 'accepted'
      and p.is_public
      and (select auth.uid()) is not null
      and (
        (f.requester_id = (select auth.uid()) and f.addressee_id = owner)
        or (f.addressee_id = (select auth.uid()) and f.requester_id = owner)
      )
  );
$$;

-- True when the caller and `other` share any friendship row (pending or accepted).
create function private.is_connected(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where (select auth.uid()) is not null
      and (
        (f.requester_id = (select auth.uid()) and f.addressee_id = other)
        or (f.addressee_id = (select auth.uid()) and f.requester_id = other)
      )
  );
$$;

-- Storage folders are user ids; anything else is never viewable.
create function private.can_view_folder(folder text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return private.can_view(folder::uuid);
end;
$$;

revoke execute on function private.can_view(uuid) from public, anon;
revoke execute on function private.can_view_folder(text) from public, anon;
grant execute on function private.can_view_folder(text) to authenticated;
revoke execute on function private.is_connected(uuid) from public, anon;
grant execute on function private.can_view(uuid) to authenticated;
grant execute on function private.is_connected(uuid) to authenticated;

-- 4) Profiles: also readable by people you share a friendship row with.
create policy "Connected users read each other's profile"
  on public.profiles for select
  to authenticated
  using (private.is_connected(id));

-- Finds a profile by exact login ID so a request can be sent. Returns no
-- visibility or other private fields.
create function public.find_profile_by_username(target text)
returns table (id uuid, username text, nickname text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.nickname
  from public.profiles p
  where (select auth.uid()) is not null
    and p.username = lower(trim(target));
$$;

revoke execute on function public.find_profile_by_username(text) from public, anon;
grant execute on function public.find_profile_by_username(text) to authenticated;

-- 5) Friends read (never write) public owners' contents, records and images.
create policy "Friends read public contents"
  on public.contents for select
  to authenticated
  using (private.can_view(owner_id));

create policy "Friends read public watch records"
  on public.watch_records for select
  to authenticated
  using (private.can_view(user_id));

create policy "Friends read public content images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'content-images'
    and private.can_view_folder((storage.foldername(name))[1])
  );
