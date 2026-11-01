-- Multi-season anime: each season (기수) is its own content, identified by
-- the TMDB series id plus tmdb_season. Whole-series rows keep tmdb_season null.

alter table public.contents
  add column tmdb_season integer check (tmdb_season >= 1),
  add constraint contents_tmdb_season_needs_tmdb
    check (tmdb_season is null or tmdb_type = 'tv'),
  drop constraint contents_owner_tmdb_unique,
  add constraint contents_owner_tmdb_unique
    unique nulls not distinct (owner_id, tmdb_type, tmdb_id, tmdb_season);

-- A season content's records belong to that season only.
create or replace function public.check_watch_record_episode()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  c record;
begin
  select source, kind, episode_count, tmdb_season into c
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
  elsif c.tmdb_season is not null and new.season <> c.tmdb_season then
    raise exception 'this content only has season %', c.tmdb_season;
  end if;
  return new;
end;
$$;
