-- Contents a user added by hand, their watch records, and the private image
-- bucket for content thumbnails. Every row and image is owner-only for now;
-- friend visibility arrives with the friends task.

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  kind text not null check (kind in ('movie', 'drama', 'variety', 'anime', 'other')),
  -- Number of episodes; null for movies, which have no episodes.
  episode_count integer check (episode_count between 1 and 2000),
  image_path text,
  created_at timestamptz not null default now(),

  constraint contents_movie_has_no_episodes
    check ((kind = 'movie') = (episode_count is null))
);

create index contents_owner_id_idx on public.contents (owner_id);

create table public.watch_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  content_id uuid not null references public.contents on delete cascade,
  -- Null for movies. Hand-added content has a single season.
  episode integer check (episode >= 1),
  -- Null means the user does not remember the date.
  watched_on date,
  created_at timestamptz not null default now()
);

create index watch_records_user_id_watched_on_idx
  on public.watch_records (user_id, watched_on desc);
create index watch_records_content_id_idx on public.watch_records (content_id);

-- Keep a record's episode within the content's real episodes.
create function public.check_watch_record_episode()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  max_episode integer;
begin
  select c.episode_count into max_episode
  from public.contents c
  where c.id = new.content_id;

  if max_episode is null and new.episode is not null then
    raise exception 'movies have no episodes';
  end if;
  if max_episode is not null
     and (new.episode is null or new.episode > max_episode) then
    raise exception 'episode must be between 1 and %', max_episode;
  end if;
  return new;
end;
$$;

create trigger watch_records_check_episode
  before insert or update on public.watch_records
  for each row execute procedure public.check_watch_record_episode();

alter table public.contents enable row level security;
alter table public.watch_records enable row level security;

revoke all on public.contents, public.watch_records from anon, authenticated;
grant select, insert, update, delete on public.contents, public.watch_records to authenticated;

create policy "Owners manage their contents"
  on public.contents for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users manage their watch records"
  on public.watch_records for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.contents c
      where c.id = content_id and c.owner_id = (select auth.uid())
    )
  );

-- Private bucket; files live under "<user id>/".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

create policy "Users upload content images to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );

create policy "Users read their content images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );

create policy "Users delete their content images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );
