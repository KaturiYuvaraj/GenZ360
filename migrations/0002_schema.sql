-- GenZ360 core schema. Catalog tables are world-readable; per-user rows
-- always carry user_id TEXT and are scoped in server functions.

create table if not exists profiles (
  user_id text primary key,
  role text not null check (role in ('student','college','employer','ground_owner','super_admin')),
  display_name text not null,
  headline text,
  city text,
  phone text,
  bio text,
  org_name text,
  course text,
  year_of_study text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grounds (
  id text primary key,
  name text not null,
  slug text not null unique,
  city text not null,
  locality text not null,
  description text not null,
  image_url text not null,
  price_per_hour integer not null,
  rating numeric(2,1) not null default 4.5,
  review_count integer not null default 0,
  facilities text not null,
  pitch_type text not null,
  owner_name text not null,
  owner_user_id text,
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id text primary key,
  user_id text not null,
  ground_id text not null references grounds(id),
  booking_date date not null,
  slot_start text not null,
  slot_end text not null,
  hours integer not null default 1,
  amount integer not null,
  status text not null default 'confirmed' check (status in ('pending','confirmed','cancelled','rescheduled')),
  payment_id text,
  created_at timestamptz not null default now()
);
create index if not exists bookings_user_idx on bookings (user_id);
create index if not exists bookings_ground_date_idx on bookings (ground_id, booking_date);

create table if not exists tournaments (
  id text primary key,
  name text not null,
  kind text not null,
  city text not null,
  venue text not null,
  start_date date not null,
  end_date date not null,
  fee integer not null,
  teams_registered integer not null default 0,
  max_teams integer not null default 16,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id text primary key,
  user_id text not null,
  tournament_id text not null references tournaments(id),
  name text not null,
  captain text not null,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id text primary key,
  tournament_id text not null references tournaments(id),
  home_team text not null,
  away_team text not null,
  match_date date not null,
  result text,
  status text not null default 'upcoming'
);

create table if not exists skills (
  id text primary key,
  name text not null,
  category text not null,
  level text not null,
  summary text not null,
  demand integer not null default 80
);

create table if not exists internships (
  id text primary key,
  company text not null,
  role text not null,
  category text not null,
  skills text not null,
  duration text not null,
  location text not null,
  remote boolean not null default false,
  stipend integer not null,
  deadline date not null,
  description text not null,
  posted_by text,
  created_at timestamptz not null default now()
);

create table if not exists internship_applications (
  id text primary key,
  user_id text not null,
  internship_id text not null references internships(id),
  status text not null default 'applied' check (status in ('applied','shortlisted','interview','selected','rejected')),
  cover_note text,
  created_at timestamptz not null default now(),
  unique (user_id, internship_id)
);
create index if not exists intern_app_user_idx on internship_applications (user_id);

create table if not exists projects (
  id text primary key,
  title text not null,
  company text not null,
  category text not null,
  skills text not null,
  team_size integer not null default 4,
  sprint_current integer not null default 1,
  sprint_total integer not null default 5,
  tasks_done integer not null default 0,
  tasks_total integer not null default 20,
  progress integer not null default 0,
  mentor text not null,
  summary text not null,
  seats_open integer not null default 2,
  created_at timestamptz not null default now()
);

create table if not exists project_members (
  id text primary key,
  user_id text not null,
  project_id text not null references projects(id),
  role_in_team text not null default 'builder',
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create table if not exists sprints (
  id text primary key,
  project_id text not null references projects(id),
  number integer not null,
  title text not null,
  status text not null default 'active'
);

create table if not exists tasks (
  id text primary key,
  project_id text not null references projects(id),
  sprint_id text,
  title text not null,
  status text not null default 'todo' check (status in ('todo','doing','done')),
  assignee text
);

create table if not exists assessments (
  id text primary key,
  title text not null,
  kind text not null,
  skill text not null,
  duration_min integer not null,
  questions integer not null,
  summary text not null
);

create table if not exists assessment_attempts (
  id text primary key,
  user_id text not null,
  assessment_id text not null references assessments(id),
  score integer not null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_idx on assessment_attempts (user_id);

create table if not exists certificates (
  id text primary key,
  user_id text,
  student_name text not null,
  title text not null,
  skill text not null,
  project text,
  issued_on date not null,
  verified boolean not null default true
);
create index if not exists certs_user_idx on certificates (user_id);

create table if not exists jobs (
  id text primary key,
  company text not null,
  role text not null,
  category text not null,
  skills text not null,
  location text not null,
  remote boolean not null default false,
  ctc_lpa numeric(5,1),
  type text not null default 'full_time',
  description text not null,
  posted_by text,
  created_at timestamptz not null default now()
);

create table if not exists job_applications (
  id text primary key,
  user_id text not null,
  job_id text not null references jobs(id),
  status text not null default 'applied' check (status in ('applied','shortlisted','interview','offered','rejected','hired')),
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);
create index if not exists job_app_user_idx on job_applications (user_id);

create table if not exists interviews (
  id text primary key,
  user_id text not null,
  employer_id text,
  candidate_name text not null,
  role text not null,
  company text not null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table if not exists resumes (
  id text primary key,
  user_id text not null unique,
  full_name text not null,
  email text,
  phone text,
  city text,
  headline text,
  education text not null default '[]',
  skills text not null default '[]',
  projects text not null default '[]',
  internships text not null default '[]',
  certifications text not null default '[]',
  achievements text not null default '[]',
  sports text not null default '[]',
  extras text not null default '[]',
  template text not null default 'editorial',
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  title text not null,
  body text not null,
  kind text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on notifications (user_id, created_at desc);

create table if not exists payments (
  id text primary key,
  user_id text not null,
  kind text not null,
  ref_id text,
  amount integer not null,
  status text not null default 'paid' check (status in ('pending','paid','refunded','failed')),
  provider text not null default 'ledger',
  created_at timestamptz not null default now()
);
create index if not exists pay_user_idx on payments (user_id);

create table if not exists saved_candidates (
  id text primary key,
  user_id text not null,
  candidate_user_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, candidate_user_id)
);

create table if not exists campus_drives (
  id text primary key,
  college_name text not null,
  company text not null,
  role text not null,
  drive_date date not null,
  status text not null default 'upcoming'
);

create table if not exists audit_logs (
  id text primary key,
  actor_id text,
  action text not null,
  entity text not null,
  entity_id text,
  created_at timestamptz not null default now()
);
