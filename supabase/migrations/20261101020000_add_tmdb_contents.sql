-- TMDB contents become per-user rows the first time a user opens them, so
-- watch records keep pointing at contents and the owner-only rules still hold.
-- Records gain a season, since TMDB series can have several.

alter table public.contents
  add column source text not null default 'custom'
    check (source in ('custom', 'tmdb')),
  add column tmdb_type text check (tmdb_type in ('movie', 'tv')),
  add column tmdb_id integer,
  add column poster_path text,
  -- Regular seasons (season 0 specials excluded); null for movies and custom content.
  add column season_count integer check (season_count >= 1),
  add constraint contents_tmdb_identity
    check ((source = 'tmdb') = (tmdb_type is not null and tmdb_id is not null)),
  add constraint contents_owner_tmdb_unique unique (owner_id, tmdb_type, tmdb_id);

-- Long-running TMDB series can exceed the hand-entry limit.
alter table public.contents
  drop constraint contents_episode_count_check,
  add constraint contents_episode_count_check
    check (episode_count between 1 and 20000);

alter table public.watch_records
  add column season integer check (season >= 1);

-- Custom content: one season, episodes 1..episode_count.
-- TMDB series: season and episode required; the app checks them against TMDB.
-- Movies: no season or episode.
create or replace function public.check_watch_record_episode()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  c record;
begin
  select source, kind, episode_count into c
  from public.contents
  where id = new.content_id;

  if c.kind = 'movie' then
    if new.episode is not null or new.season is not null then
      raise exception 'movies have no episodes';
    end if;
  elsif c.source = 'custom' then
    if new.season is not null then
      raise exception 'custom content has no seasons';
    end if;
    if new.episode is null or new.episode > c.episode_count then
      raise exception 'episode must be between 1 and %', c.episode_count;
    end if;
  elsif new.season is null or new.episode is null then
    raise exception 'season and episode are required';
  end if;
  return new;
end;
$$;
