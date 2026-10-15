-- GenZ360 Phase 1: Core Entity Models & Database Schema Expansion
-- Defines first-class schema for Student, College, Ground Owner, Employer, Internship, Project, Certificate, Placement

-- 1. College Entity
create table if not exists colleges (
  id text primary key,
  name text not null,
  slug text not null unique,
  code text unique,
  city text not null,
  state text,
  address text,
  accreditation text default 'NAAC A+',
  tpo_name text,
  tpo_email text,
  tpo_phone text,
  logo_url text,
  banner_url text,
  mou_signed boolean not null default false,
  partnership_tier text not null default 'silver' check (partnership_tier in ('bronze', 'silver', 'gold', 'platinum')),
  sports_facilities text default 'Box Cricket,Football,Badminton,Gymnasium',
  total_students integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists colleges_city_idx on colleges(city);

-- 2. Ground Owner Entity
create table if not exists ground_owners (
  id text primary key,
  user_id text not null unique,
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  payout_bank_upi text,
  commission_rate numeric(4,2) not null default 10.00,
  verified boolean not null default false,
  grounds_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ground_owners_user_idx on ground_owners(user_id);

-- 3. Employer Entity
create table if not exists employers (
  id text primary key,
  user_id text not null unique,
  company_name text not null,
  slug text not null unique,
  logo_url text,
  website text,
  industry text not null default 'Technology',
  company_size text not null default '50-200' check (company_size in ('1-10', '11-50', '51-200', '201-500', '500+')),
  headquarters text,
  city text,
  about text,
  hiring_tier text not null default 'standard' check (hiring_tier in ('standard', 'growth', 'enterprise')),
  verified boolean not null default false,
  active_jobs_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists employers_slug_idx on employers(slug);

-- 4. Student Entity (Rich Lifecycle Extension linked to User Profile)
create table if not exists students (
  id text primary key,
  user_id text not null unique,
  college_id text references colleges(id) on delete set null,
  roll_number text,
  degree text not null default 'B.Tech',
  branch text not null default 'Computer Science',
  batch_year integer not null default 2026,
  cgpa numeric(3,2) default 8.20,
  active_backlogs integer not null default 0,
  wellness_score integer not null default 78,
  sports_attendance_count integer not null default 12,
  primary_sport text not null default 'Box Cricket',
  resume_url text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  placement_status text not null default 'seeking' check (placement_status in ('seeking', 'shortlisted', 'placed', 'higher_studies', 'opted_out')),
  skills_matrix text not null default '[]',
  points_balance integer not null default 250,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists students_college_idx on students(college_id);
create index if not exists students_placement_idx on students(placement_status);

-- 5. Foreign Key & Enrichment Columns on Existing Entities

-- Add employer reference to internships
alter table internships add column if not exists employer_id text references employers(id) on delete set null;
alter table internships add column if not exists work_mode text default 'hybrid' check (work_mode in ('remote', 'hybrid', 'onsite'));
alter table internships add column if not exists openings integer default 2;
alter table internships add column if not exists status text default 'active' check (status in ('draft', 'active', 'closed'));
alter table internships add column if not exists college_credit_eligible boolean default true;

-- Add employer/sponsor reference to live projects
alter table projects add column if not exists employer_id text references employers(id) on delete set null;
alter table projects add column if not exists difficulty text default 'intermediate' check (difficulty in ('beginner', 'intermediate', 'advanced'));
alter table projects add column if not exists stipend_reward integer default 5000;
alter table projects add column if not exists certification_eligible boolean default true;
alter table projects add column if not exists deliverables text default 'Repository, Demo Video, Executive Pitch Deck';

-- 6. Verifiable Certificate Enrichment
alter table certificates add column if not exists cert_code text unique;
alter table certificates add column if not exists issuer_type text default 'genz360' check (issuer_type in ('genz360', 'employer', 'college', 'partner'));
alter table certificates add column if not exists issuer_id text;
alter table certificates add column if not exists badge_icon_url text;
alter table certificates add column if not exists verification_url text;
alter table certificates add column if not exists credential_hash text;

-- 7. Placements & Offer Tracking Entity
create table if not exists placements (
  id text primary key,
  student_id text not null references students(id) on delete cascade,
  employer_id text not null references employers(id) on delete cascade,
  college_id text references colleges(id) on delete set null,
  job_id text references jobs(id) on delete set null,
  package_lpa numeric(5,2) not null,
  designation text not null,
  status text not null default 'offered' check (status in ('offered', 'accepted', 'joined', 'rejected')),
  offer_letter_url text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists placements_student_idx on placements(student_id);
create index if not exists placements_college_idx on placements(college_id);
create index if not exists placements_employer_idx on placements(employer_id);

-- 8. Campus Placement Drives
create table if not exists placement_drives (
  id text primary key,
  college_id text not null references colleges(id) on delete cascade,
  employer_id text not null references employers(id) on delete cascade,
  role_title text not null,
  drive_date date not null,
  status text not null default 'upcoming' check (status in ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  eligible_branches text not null default 'Computer Science, Information Technology, Electronics',
  min_cgpa numeric(3,2) not null default 7.00,
  max_backlogs integer not null default 0,
  registered_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists drives_college_idx on placement_drives(college_id);
