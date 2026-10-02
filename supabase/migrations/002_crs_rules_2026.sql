insert into public.crs_rule_versions (version, reviewed_at, source_url, notes)
values (
  'IRCC-2026-06-22-reviewed-2026-10-01',
  '2026-10-01',
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html',
  'IRCC scoring tables re-reviewed. Job offer points remain removed. Approved language-test conversions added in TypeScript.'
)
on conflict (version) do nothing;
