-- GenZ360 Skills & Learning Tracks: Multi-Module Syllabi, Granular Lessons & Enrollment Progress

create table if not exists skill_modules (
  id text primary key,
  skill_id text not null references skills(id) on delete cascade,
  module_number integer not null,
  title text not null,
  duration_hours integer not null default 4,
  summary text not null
);
create index if not exists skill_modules_skill_idx on skill_modules(skill_id);

create table if not exists skill_lessons (
  id text primary key,
  module_id text not null references skill_modules(id) on delete cascade,
  lesson_number integer not null,
  title text not null,
  kind text not null default 'code_lab' check (kind in ('concept', 'video', 'code_lab', 'reading', 'quiz')),
  duration_min integer not null default 20,
  key_takeaway text,
  exercise_prompt text
);
create index if not exists skill_lessons_module_idx on skill_lessons(module_id);

create table if not exists skill_enrollments (
  id text primary key,
  user_id text not null,
  skill_id text not null references skills(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'paused')),
  progress_pct integer not null default 0,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, skill_id)
);
create index if not exists skill_enrollments_user_idx on skill_enrollments(user_id);

create table if not exists lesson_progress (
  id text primary key,
  user_id text not null,
  lesson_id text not null references skill_lessons(id) on delete cascade,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index if not exists lesson_progress_user_idx on lesson_progress(user_id);
