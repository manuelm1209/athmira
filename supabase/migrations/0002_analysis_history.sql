create table public.analysis_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.fit_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_type text not null check (analysis_type in ('side_bike_fit', 'front_knee_tracking')),
  title text not null,
  overall_score numeric(5, 2),
  comfort_score numeric(5, 2),
  aero_score numeric(5, 2),
  confidence_score numeric(5, 4) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  duration_ms integer,
  sample_count integer,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.front_knee_measurements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.fit_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  duration_ms integer,
  sample_count integer,
  estimated_mm_per_pixel numeric(8, 4),
  overall_score numeric(5, 2),
  confidence_score numeric(5, 4) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  left_horizontal_travel_mm numeric(7, 2),
  left_horizontal_travel_px numeric(7, 2),
  left_vertical_travel_mm numeric(7, 2),
  left_vertical_travel_px numeric(7, 2),
  left_knee_drift_mm numeric(7, 2),
  left_knee_drift_px numeric(7, 2),
  left_stability_score numeric(5, 2),
  left_confidence_score numeric(5, 4) check (left_confidence_score is null or (left_confidence_score >= 0 and left_confidence_score <= 1)),
  left_sample_count integer,
  right_horizontal_travel_mm numeric(7, 2),
  right_horizontal_travel_px numeric(7, 2),
  right_vertical_travel_mm numeric(7, 2),
  right_vertical_travel_px numeric(7, 2),
  right_knee_drift_mm numeric(7, 2),
  right_knee_drift_px numeric(7, 2),
  right_stability_score numeric(5, 2),
  right_confidence_score numeric(5, 4) check (right_confidence_score is null or (right_confidence_score >= 0 and right_confidence_score <= 1)),
  right_sample_count integer,
  created_at timestamptz not null default now()
);

create index analysis_summaries_user_id_idx on public.analysis_summaries(user_id);
create index analysis_summaries_session_id_idx on public.analysis_summaries(session_id);
create index analysis_summaries_type_created_at_idx on public.analysis_summaries(analysis_type, created_at desc);
create index front_knee_measurements_user_id_idx on public.front_knee_measurements(user_id);
create index front_knee_measurements_session_id_idx on public.front_knee_measurements(session_id);

alter table public.analysis_summaries enable row level security;
alter table public.front_knee_measurements enable row level security;

create policy "Users can read their analysis summaries"
on public.analysis_summaries for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their analysis summaries"
on public.analysis_summaries for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = analysis_summaries.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can update their analysis summaries"
on public.analysis_summaries for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = analysis_summaries.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can delete their analysis summaries"
on public.analysis_summaries for delete to authenticated
using (auth.uid() = user_id);

create policy "Users can read their front knee measurements"
on public.front_knee_measurements for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their front knee measurements"
on public.front_knee_measurements for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = front_knee_measurements.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can update their front knee measurements"
on public.front_knee_measurements for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = front_knee_measurements.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can delete their front knee measurements"
on public.front_knee_measurements for delete to authenticated
using (auth.uid() = user_id);
