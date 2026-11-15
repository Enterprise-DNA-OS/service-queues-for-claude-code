create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table locations (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name))>0),
 collection_purpose text not null, retention_days integer not null check(retention_days between 1 and 3650),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table services (
 id uuid primary key default gen_random_uuid(), location_id uuid not null references locations,
 name text not null check(length(trim(name))>0), target_minutes integer not null check(target_minutes between 1 and 1440),
 unique(location_id,name), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table clerks (
 id uuid primary key default gen_random_uuid(), location_id uuid not null references locations,
 name text not null check(length(trim(name))>0), active boolean not null default true,
 unique(location_id,name), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table visits (
 id uuid primary key default gen_random_uuid(), token text not null unique check(length(trim(token))>0),
 purpose text, retention_review_on date, imported boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table interactions (
 id uuid primary key default gen_random_uuid(), visit_id uuid not null references visits,
 sequence integer not null default 1 check(sequence>0), service_id uuid not null references services,
 clerk_id uuid references clerks, status text not null default 'waiting' check(status in ('waiting','called','served','no-show','removed','forwarded','returned')),
 queued_at timestamptz not null, called_at timestamptz, ended_at timestamptz,
 source_fingerprint text unique, source_status text,
 unique(visit_id,sequence),
 check(called_at is null or called_at>=queued_at),
 check(ended_at is null or ended_at>=coalesce(called_at,queued_at)),
 check((status='waiting' and called_at is null and ended_at is null and clerk_id is null)
   or (status='called' and called_at is not null and ended_at is null and clerk_id is not null)
   or (status in ('served','no-show') and called_at is not null and ended_at is not null and clerk_id is not null)
   or (status in ('removed','forwarded','returned') and (ended_at is not null or source_fingerprint is not null))),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_open_interaction on interactions(visit_id) where status in ('waiting','called');
create unique index one_live_call_per_clerk on interactions(clerk_id) where status='called' and source_fingerprint is null;
create table audit_events (
 id uuid primary key default gen_random_uuid(), interaction_id uuid references interactions,
 action text not null, actor text not null check(length(trim(actor))>0), note text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_runs (
 id uuid primary key default gen_random_uuid(), batch text not null unique, digest text not null,
 range_start timestamptz not null, range_end timestamptz not null,
 row_count integer not null, location_id uuid not null references locations,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function check_clerk_location() returns trigger language plpgsql as $$ begin
 if new.clerk_id is not null and not exists(select 1 from clerks c join services s on s.location_id=c.location_id where c.id=new.clerk_id and s.id=new.service_id) then
 raise exception 'Clerk and service must belong to the same location'; end if; return new; end $$;
create trigger interaction_clerk_location before insert or update on interactions for each row execute function check_clerk_location();
do $$ declare t text; begin
 foreach t in array array['locations','services','clerks','visits','interactions','audit_events','import_runs'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop; end $$;
create view ticket_summary as
 select i.id,v.token,i.sequence,l.name location,s.name service,c.name clerk,i.status,i.queued_at,i.called_at,i.ended_at,
 round((extract(epoch from (coalesce(i.called_at,i.ended_at,case when not v.imported then now() end)-i.queued_at))/60)::numeric,1) wait_minutes,
 case when i.called_at is not null then round((extract(epoch from (coalesce(i.ended_at,case when not v.imported then now() end)-i.called_at))/60)::numeric,1) end service_minutes,
 s.target_minutes,v.imported,v.retention_review_on,i.visit_id,i.service_id,i.clerk_id
 from interactions i join visits v on v.id=i.visit_id join services s on s.id=i.service_id join locations l on l.id=s.location_id left join clerks c on c.id=i.clerk_id;
create view queue_now as select token,sequence,location,service,clerk,status,wait_minutes,service_minutes,target_minutes,queued_at
 from ticket_summary where status in ('waiting','called') and not imported;
create view attention as
 select token,location,service,'WAIT_TARGET' reason,wait_minutes minutes from ticket_summary where status='waiting' and not imported and wait_minutes>target_minutes
 union all select token,location,service,'CALL_OPEN_OVER_HOUR',service_minutes from ticket_summary where status='called' and not imported and service_minutes>60
 union all select token,location,service,'PREVIOUS_DAY_OPEN',wait_minutes from ticket_summary where status in ('waiting','called') and not imported and queued_at::date<current_date;
create view daily_performance as
 select queued_at::date as service_date,location,service,imported,count(*) interactions,
 count(*) filter(where status='served') served,count(*) filter(where status='no-show') no_shows,
 count(*) filter(where status='removed') removed,count(*) filter(where status in ('forwarded','returned')) handovers,
 round(avg(wait_minutes) filter(where called_at is not null),1) mean_wait_minutes,
 round(avg(service_minutes) filter(where ended_at is not null and called_at is not null),1) mean_service_minutes,
 count(*) filter(where called_at is not null and wait_minutes>target_minutes) over_target
 from ticket_summary group by queued_at::date,location,service,imported;
create view clerk_performance as
 select location,clerk,imported,count(*) filter(where status='served') served,
 count(*) filter(where status='called') calls_open,
 round(avg(service_minutes) filter(where status='served'),1) mean_served_minutes
 from ticket_summary where clerk is not null group by location,clerk,imported;
create view compliance_findings as
 select token,'COLLECTION_PURPOSE' rule,'Record a necessary collection purpose' finding from visits where nullif(trim(purpose),'') is null
 union all select token,'RETENTION_REVIEW','Review the lawful need to retain this record' from visits where retention_review_on is null or retention_review_on<current_date;
revoke all on ticket_summary,queue_now,attention,daily_performance,clerk_performance,compliance_findings from public;
