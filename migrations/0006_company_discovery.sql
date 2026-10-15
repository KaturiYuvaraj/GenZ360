-- GenZ360 Phase 3: Automated Company Discovery & ATS Source Registration Schema
-- Extends employers table with discovery lifecycle tracking,
-- adds discovery_runs and discovered_company_sources tables.
-- Fully preserves existing native GenZ360 employers and job sources.

-- 1. Extend employers table with discovery tracking columns
alter table employers add column if not exists discovery_status text default 'discovered' check (discovery_status in ('discovered', 'website_pending', 'career_page_pending', 'ats_detected', 'source_registered', 'unsupported_source', 'needs_review', 'discovery_failed'));
alter table employers add column if not exists discovery_provider text;
alter table employers add column if not exists provider_id text;
alter table employers add column if not exists discovery_confidence numeric(3,2) default 0.50;
alter table employers add column if not exists review_notes text;
alter table employers add column if not exists last_discovered_at timestamptz;

alter table employers alter column company_size set default '51-200';

create index if not exists employers_discovery_status_idx on employers(discovery_status);
create index if not exists employers_provider_id_idx on employers(discovery_provider, provider_id);

-- 2. Discovery Runs Table: tracks background pipeline execution telemetry
create table if not exists discovery_runs (
  id text primary key,
  provider text not null,
  query text,
  location text,
  industry text,
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'paused')),
  companies_found integer not null default 0,
  companies_processed integer not null default 0,
  duplicates_found integer not null default 0,
  websites_verified integer not null default 0,
  career_pages_found integer not null default 0,
  ats_detected integer not null default 0,
  sources_validated integer not null default 0,
  sources_registered integer not null default 0,
  needs_review_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  metadata text default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists discovery_runs_status_idx on discovery_runs(status);
create index if not exists discovery_runs_created_at_idx on discovery_runs(created_at desc);

-- 3. Discovered Company Sources Table: tracks ATS candidate detections and review decisions
create table if not exists discovered_company_sources (
  id text primary key,
  company_id text references employers(id) on delete cascade,
  company_name text not null,
  website text,
  career_page_url text,
  ats_type text not null,
  board_identifier text not null,
  confidence numeric(3,2) not null default 0.80,
  evidence text not null default '[]',
  validation_status text not null default 'pending' check (validation_status in ('pending', 'valid', 'invalid', 'approved', 'rejected')),
  validation_error text,
  job_source_id text references job_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_name, ats_type, board_identifier)
);

create index if not exists disc_sources_company_id_idx on discovered_company_sources(company_id);
create index if not exists disc_sources_validation_status_idx on discovered_company_sources(validation_status);
