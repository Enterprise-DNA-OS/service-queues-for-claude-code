do $$
declare loc uuid; annex uuid; general uuid; permits uuid; annex_line uuid; maya uuid; leo uuid; v uuid;
begin
 if exists(select 1 from locations) then return; end if;
 insert into locations(name,collection_purpose,retention_days) values('Harbour Service Centre','Manage a requested counter service and review waiting times',90) returning id into loc;
 insert into locations(name,collection_purpose,retention_days) values('Ridge Service Centre','Manage a requested counter service and review waiting times',90) returning id into annex;
 insert into services(location_id,name,target_minutes) values(loc,'General enquiries',15) returning id into general;
 insert into services(location_id,name,target_minutes) values(loc,'Permit enquiries',20) returning id into permits;
 insert into services(location_id,name,target_minutes) values(annex,'General enquiries',15) returning id into annex_line;
 insert into clerks(location_id,name) values(loc,'Maya Patel') returning id into maya;
 insert into clerks(location_id,name) values(loc,'Leo Chen') returning id into leo;
 insert into clerks(location_id,name) values(annex,'Maya Roberts');
 insert into visits(token,purpose,retention_review_on) values('H-101','Requested counter service',current_date+90) returning id into v;
 insert into interactions(visit_id,service_id,queued_at) values(v,general,now()-interval '37 minutes');
 insert into visits(token,purpose,retention_review_on) values('H-102','Requested counter service',current_date+90) returning id into v;
 insert into interactions(visit_id,service_id,queued_at) values(v,permits,now()-interval '8 minutes');
 insert into visits(token,purpose,retention_review_on) values('H-103','Requested counter service',current_date+90) returning id into v;
 insert into interactions(visit_id,service_id,clerk_id,status,queued_at,called_at) values(v,general,maya,'called',now()-interval '105 minutes',now()-interval '81 minutes');
 insert into visits(token,purpose,retention_review_on) values('H-104','Requested counter service',current_date+90) returning id into v;
 insert into interactions(visit_id,service_id,clerk_id,status,queued_at,called_at,ended_at) values(v,general,leo,'served',now()-interval '2 days 50 minutes',now()-interval '2 days 25 minutes',now()-interval '2 days 10 minutes');
 insert into visits(token,purpose,retention_review_on) values('H-105','Requested counter service',current_date+90) returning id into v;
 insert into interactions(visit_id,service_id,clerk_id,status,queued_at,called_at,ended_at) values(v,permits,leo,'no-show',now()-interval '1 day 30 minutes',now()-interval '1 day 10 minutes',now()-interval '1 day 8 minutes');
 insert into visits(token,purpose,retention_review_on) values('H-106',null,current_date-7) returning id into v;
 insert into interactions(visit_id,service_id,status,queued_at,ended_at) values(v,general,'removed',now()-interval '100 days',now()-interval '100 days'+interval '8 minutes');
 insert into visits(token,purpose,retention_review_on) values('H-107','Requested counter service',current_date+90) returning id into v;
 insert into interactions(visit_id,service_id,queued_at) values(v,permits,now()-interval '1 day 15 minutes');
 insert into visits(token,purpose,retention_review_on) values('R-201','Requested counter service',current_date+90) returning id into v;
 insert into interactions(visit_id,service_id,queued_at) values(v,annex_line,now()-interval '22 minutes');
end $$;
