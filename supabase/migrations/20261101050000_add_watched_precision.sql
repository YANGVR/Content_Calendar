-- 1) A viewing date can be a full day or just a year ("2019년에 봤어요").
--    Year-only records store January 1 of that year in watched_on.
alter table public.watch_records
  add column watched_precision text not null default 'day'
    check (watched_precision in ('day', 'year')),
  add constraint watch_records_year_precision_is_jan_1
    check (
      watched_precision = 'day'
      or (watched_on is not null and extract(month from watched_on) = 1 and extract(day from watched_on) = 1)
    );

-- 2) One record per movie or episode: recording it again overwrites the
--    existing record. Keep only the most recently created duplicate.
delete from public.watch_records older
using public.watch_records newer
where older.content_id = newer.content_id
  and older.season is not distinct from newer.season
  and older.episode is not distinct from newer.episode
  and (older.created_at, older.id) < (newer.created_at, newer.id);

alter table public.watch_records
  add constraint watch_records_one_per_episode
    unique nulls not distinct (content_id, season, episode);
