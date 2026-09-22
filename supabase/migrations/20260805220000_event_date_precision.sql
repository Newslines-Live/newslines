-- Archive fidelity: real event date precision + source URL from WP import

alter table public.events
  add column if not exists date_precision text not null default 'exact'
    check (date_precision in ('exact', 'month', 'year'));

alter table public.events
  add column if not exists source_url text;
