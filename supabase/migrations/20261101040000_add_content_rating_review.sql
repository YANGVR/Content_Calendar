-- Rating (1-5 stars) and one-line review, one per content. Contents are
-- per-user rows, so these are the owner's own; existing RLS applies.
alter table public.contents
  add column rating smallint check (rating between 1 and 5),
  add column review text check (char_length(review) between 1 and 100);
