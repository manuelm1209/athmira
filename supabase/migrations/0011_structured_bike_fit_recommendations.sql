alter table public.recommendations
  add column if not exists recommendation_id text,
  add column if not exists title text,
  add column if not exists explanation text,
  add column if not exists suggested_action text,
  add column if not exists retest_instruction text,
  add column if not exists medical_disclaimer text,
  add column if not exists confidence_label text check (confidence_label is null or confidence_label in ('low', 'medium', 'high')),
  add column if not exists zone text check (
    zone is null or zone in ('ok', 'review', 'high_risk_adjustment', 'low_tracking_confidence')
  ),
  add column if not exists is_primary boolean not null default false;

alter table public.recommendations
  drop constraint if exists recommendations_category_check;

alter table public.recommendations
  add constraint recommendations_category_check check (
    category in (
      'saddle_height',
      'saddle_position',
      'saddle_setback',
      'reach',
      'cockpit',
      'cleats',
      'knee_tracking',
      'hip_stability',
      'capture_quality',
      'torso',
      'arms',
      'head',
      'comfort',
      'aero'
    )
  );

comment on table public.recommendations is
  'Structured educational bike-fit recommendations. Guidance is camera-based and does not replace medical care or a professional bike fit.';

comment on column public.recommendations.is_primary is
  'Marks the single main change athmira recommends considering before a retest.';
