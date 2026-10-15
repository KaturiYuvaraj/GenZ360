-- GenZ360 Phase 2: Job Aggregation & ATS Extension Schema
-- Extends existing jobs and employers tables, adds job_sources table.
-- Fully preserves existing native GenZ360 employer jobs and applications.

-- 1. Extend employers table for external companies
alter table employers alter column user_id drop not null;
alter table employers add column if not exists is_external boolean not null default false;
alter table employers add column if not exists ats_type text;
alter table employers add column if not exists ats_identifier text;
alter table employers add column if not exists careers_url text;

create index if not exists employers_ats_idx on employers(ats_type, ats_identifier);

-- 2. Job Sources Table: tracks ATS board configurations and sync telemetry
create table if not exists job_sources (
  id text primary key,
  name text not null,
  company_id text references employers(id) on delete set null,
  company_name text not null,
  company_slug text not null,
  board_identifier text not null,
  careers_url text,
  enabled boolean not null default true,
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  error_count integer not null default 0,
  total_jobs_count integer not null default 0,
  metadata text default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, board_identifier)
);

create index if not exists job_sources_name_idx on job_sources(name);
create index if not exists job_sources_company_slug_idx on job_sources(company_slug);
create index if not exists job_sources_enabled_idx on job_sources(enabled);

-- 3. Extend jobs table for aggregation & ATS integration
alter table jobs add column if not exists source text not null default 'genz360';
alter table jobs add column if not exists source_job_id text;
alter table jobs add column if not exists source_url text;
alter table jobs add column if not exists application_url text;
alter table jobs add column if not exists external_job boolean not null default false;
alter table jobs add column if not exists employer_id text references employers(id) on delete set null;
alter table jobs add column if not exists job_source_id text references job_sources(id) on delete set null;
alter table jobs add column if not exists last_seen_at timestamptz default now();
alter table jobs add column if not exists source_updated_at timestamptz;
alter table jobs add column if not exists ingestion_status text not null default 'active' check (ingestion_status in ('active', 'closed', 'expired', 'paused', 'error'));
alter table jobs add column if not exists content_hash text;
alter table jobs add column if not exists department text;
alter table jobs add column if not exists country text;
alter table jobs add column if not exists city text;
alter table jobs add column if not exists remote_type text default 'onsite' check (remote_type in ('remote', 'hybrid', 'onsite'));
alter table jobs add column if not exists employment_type text default 'full_time' check (employment_type in ('full_time', 'part_time', 'contract', 'internship'));
alter table jobs add column if not exists experience_level text check (experience_level in ('entry', 'mid', 'senior', 'lead', 'executive'));
alter table jobs add column if not exists salary_min numeric(10,2);
alter table jobs add column if not exists salary_max numeric(10,2);
alter table jobs add column if not exists currency text;

-- 4. High performance indexes for job querying & deduplication
create index if not exists jobs_source_idx on jobs(source);
create index if not exists jobs_source_job_id_idx on jobs(source, source_job_id);
create index if not exists jobs_employer_id_idx on jobs(employer_id);
create index if not exists jobs_ingestion_status_idx on jobs(ingestion_status);
create index if not exists jobs_location_idx on jobs(location);
create index if not exists jobs_created_at_idx on jobs(created_at desc);
create index if not exists jobs_content_hash_idx on jobs(content_hash);
create index if not exists jobs_last_seen_at_idx on jobs(last_seen_at);
create index if not exists jobs_remote_type_idx on jobs(remote_type);
