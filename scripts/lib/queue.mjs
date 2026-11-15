import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { parseCsv, pick } from './csv.mjs';
import { REPO_ROOT } from './db.mjs';

export const reads = {
 locations:'select name,collection_purpose,retention_days from locations order by name',
 services:'select s.id,l.name location,s.name service,s.target_minutes from services s join locations l on l.id=s.location_id order by l.name,s.name',
 clerks:'select c.id,l.name location,c.name,c.active from clerks c join locations l on l.id=c.location_id order by l.name,c.name',
 'queue-now':'select * from queue_now order by queued_at,token',
 'wait-review':'select * from attention order by minutes desc,token',
 'service-review':'select * from daily_performance order by service_date desc,location,service',
 'clerk-review':'select * from clerk_performance order by location,clerk',
 'no-shows':"select token,location,service,clerk,queued_at,ended_at,imported from ticket_summary where status='no-show' order by queued_at desc",
 'handover':"select token,sequence,location,service,clerk,status,wait_minutes,service_minutes from ticket_summary where not imported and status in ('waiting','called') order by location,service,queued_at",
 compliance:'select * from compliance_findings order by token,rule',
 history:'select token,sequence,location,service,clerk,status,queued_at,called_at,ended_at,wait_minutes,service_minutes,imported from ticket_summary order by queued_at desc,token,sequence',
 audit:'select e.created_at,e.actor,e.action,v.token,e.note from audit_events e left join interactions i on i.id=e.interaction_id left join visits v on v.id=i.visit_id order by e.created_at,e.id',
 imports:'select batch,digest,row_count,created_at from import_runs order by created_at',
};
export const questions = [
 ['Which waiting tickets exceed their own service target?',"select token,location,service,wait_minutes,target_minutes from ticket_summary where not imported and status='waiting' and wait_minutes>target_minutes order by wait_minutes desc"],
 ['Which calls have stayed open for more than an hour?',"select token,location,clerk,service_minutes from ticket_summary where not imported and status='called' and service_minutes>60"],
 ['Which queues still contain a ticket from a previous UTC day?',"select token,location,service,queued_at from ticket_summary where not imported and status in ('waiting','called') and queued_at::date<current_date"],
 ['Which services have the most completed waits above their own target?',"select location,service,count(*) late_calls from ticket_summary where called_at is not null and wait_minutes>target_minutes group by location,service order by late_calls desc"],
 ['Which service lines lost visits as no-shows or removals?',"select location,service,status,count(*) interactions from ticket_summary where status in ('no-show','removed') group by location,service,status order by interactions desc"],
 ['Which visits required more than one service interaction?',"select token,count(*) interactions,round(sum(wait_minutes),1) total_wait_minutes from ticket_summary group by token having count(*)>1"],
 ['Which retention reviews are overdue while a visit is still open?',"select token,location,service,retention_review_on from ticket_summary where status in ('waiting','called') and (retention_review_on is null or retention_review_on<current_date)"],
 ['Which services are waiting while a local active clerk has no open call?',"select q.location,q.service,count(distinct q.token) waiting,string_agg(distinct c.name,', ') available_clerks from queue_now q join locations l on l.name=q.location join clerks c on c.location_id=l.id and c.active where q.status='waiting' and not exists(select 1 from interactions i join visits v on v.id=i.visit_id where i.clerk_id=c.id and i.status='called' and not v.imported) group by q.location,q.service"],
 ['How much imported history is still marked unfinished?',"select location,status,count(*) interactions from ticket_summary where imported and status in ('waiting','called') group by location,status"],
 ['Which visits have incomplete privacy review records?',"select token,string_agg(rule,', ' order by rule) findings from compliance_findings group by token"],
];
export function outputDir(){return path.resolve(REPO_ROOT,process.env.OUTPUT_DIR||'.');}
function need(s,label){if(typeof s!=='string'||!s.trim())throw Error(`${label} is required`);return s.trim();}
function integer(v,label){if(!/^\d+$/.test(String(v)))throw Error(`${label} must be a whole number`);return Number(v);}
export function instant(value){
 const s=need(value,'timestamp');
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(s)||!Number.isFinite(Date.parse(s)))throw Error('Timestamp needs ISO date, time and explicit offset');
 const date=s.slice(0,10);if(new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid calendar date');
 const hour=Number(s.slice(11,13)),minute=Number(s.slice(14,16));if(hour>23||minute>59)throw Error('Invalid clock time');
 return new Date(s).toISOString();
}
function day(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))throw Error('Date must be YYYY-MM-DD');instant(s+'T00:00:00Z');return s;}
async function transaction(db,fn){await db.exec('BEGIN');try{await db.exec('LOCK TABLE interactions IN SHARE ROW EXCLUSIVE MODE');const value=await fn();await db.exec('COMMIT');return value;}catch(e){await db.exec('ROLLBACK');throw e;}}
export async function resolve(db,table,value,where='',params=[]){
 const allowed={locations:'name',services:'name',clerks:'name',visits:'token'};if(!allowed[table])throw Error('Unknown record type');
 const q=need(value,table);const col=allowed[table];
 const all=await db.query(`select * from ${table} ${where?`where ${where}`:''} order by ${col},id`,params);
 const exact=all.filter(r=>r.id===q||r[col].toLowerCase()===q.toLowerCase());
 const found=exact.length?exact:all.filter(r=>r.id.startsWith(q)||r[col].toLowerCase().includes(q.toLowerCase()));
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'Not found'} ${table}: ${q}. Candidates: ${(found.length?found:all).map(r=>`${r[col]} (${r.id})`).join(', ')}`);
 return found[0];
}
async function event(db,id,action,actor,note){await db.query('insert into audit_events(interaction_id,action,actor,note) values($1,$2,$3,$4)',[id,action,need(actor,'--actor'),note]);}
async function service(db,o){const l=await resolve(db,'locations',o.location);return resolve(db,'services',o.service,'location_id=$1',[l.id]);}
export async function insights(db){return Promise.all(questions.map(async([question,sql])=>({question,rows:await db.query(sql)})));}
export async function execute(db,command,args=[],o={}){
 if(reads[command])return db.query(reads[command]);
 if(command==='insights')return insights(db);
 if(command==='weekly-review')return {queue:await execute(db,'queue-now'),waits:await execute(db,'wait-review'),services:await execute(db,'service-review'),privacy:await execute(db,'compliance')};
 if(command==='ticket'){
  const v=await resolve(db,'visits',args[0]);return {visit:v,interactions:await db.query('select * from ticket_summary where visit_id=$1 order by sequence',[v.id]),events:await db.query('select e.* from audit_events e join interactions i on i.id=e.interaction_id where i.visit_id=$1 order by e.created_at,e.id',[v.id])};
 }
 if(command==='draft-handover'){
  const data=await execute(db,'weekly-review');const dir=path.join(outputDir(),'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,`handover-${randomUUID()}.md`);
  fs.writeFileSync(file,'# Service desk handover draft\n\nInternal only. Verify open visits with the desk. Nothing sent.\n\n```json\n'+JSON.stringify(data,null,2)+'\n```\n',{mode:0o600});return {file};
 }
 if(command==='export'){
  const dir=path.join(outputDir(),'exports');fs.mkdirSync(dir,{recursive:true,mode:0o700});const snapshot={format:'service-queues-v1',exported_at:new Date().toISOString()};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ');try {for(const table of ['locations','services','clerks','visits','interactions','audit_events','import_runs'])snapshot[table]=await db.query(`select * from ${table} order by id`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  const file=path.join(dir,`queues-${randomUUID()}.json`);fs.writeFileSync(file,JSON.stringify(snapshot,null,2)+'\n',{mode:0o600});return {file,visits:snapshot.visits.length,interactions:snapshot.interactions.length};
 }
 if(command==='import'){if(args[0]!=='qminder')throw Error('Use import qminder <xlsx-or-csv>');return importQminder(db,args[1],o);}
 const actor=need(o.actor,'--actor');
 return transaction(db,async()=>{
  if(command==='add-location'){
   const rows=await db.query('insert into locations(name,collection_purpose,retention_days) values($1,$2,$3) returning id,name',[need(o.name,'--name'),need(o.purpose,'--purpose'),integer(o['retention-days'],'retention days')]);await event(db,null,command,actor,rows[0].name);return rows;
  }
  if(command==='add-service'||command==='add-clerk'){
   const l=await resolve(db,'locations',o.location);const name=need(o.name,'--name');
   const rows=command==='add-service'?await db.query('insert into services(location_id,name,target_minutes) values($1,$2,$3) returning id,name',[l.id,name,integer(o.target,'target')]):await db.query('insert into clerks(location_id,name) values($1,$2) returning id,name',[l.id,name]);await event(db,null,command,actor,`${l.name}: ${name}`);return rows;
  }
  if(command==='arrive'){
   const s=await service(db,o);const l=(await db.query('select * from locations where id=$1',[s.location_id]))[0];const at=instant(o.at||new Date().toISOString());
   if(Date.parse(at)>Date.now()+60000)throw Error('Arrival cannot be in the future');
   const v=(await db.query('insert into visits(token,purpose,retention_review_on) values($1,$2,($3::timestamptz)::date+$4::integer) returning id',[need(o.token,'--token'),need(l.collection_purpose,'location collection purpose'),at,l.retention_days]))[0];
   const i=(await db.query('insert into interactions(visit_id,service_id,queued_at) values($1,$2,$3) returning id',[v.id,s.id,at]))[0];await event(db,i.id,'arrive',actor,'Staff recorded arrival');return db.query('select * from ticket_summary where id=$1',[i.id]);
  }
  const v=await resolve(db,'visits',args[0]);
  if(command==='review-retention'){
   const until=day(o.until);if(until<new Date().toISOString().slice(0,10))throw Error('Retention review date must be today or later');
   await db.query('update visits set purpose=$1,retention_review_on=$2 where id=$3',[need(o.purpose,'--purpose'),until,v.id]);await event(db,null,command,actor,`${v.token}: ${need(o.evidence,'--evidence')}`);return [{token:v.token,retention_review_on:until}];
  }
  if(v.imported)throw Error('Imported history is archived. It cannot enter the live queue');
  const i=(await db.query("select * from interactions where visit_id=$1 and status in ('waiting','called') for update",[v.id]))[0];
  if(!i)throw Error('This visit has no open interaction');
  if(command==='log'){await event(db,i.id,'note',actor,need(o.note,'--note'));return [{token:v.token,logged:true}];}
  const at=instant(o.at||new Date().toISOString());
  if(Date.parse(at)>Date.now()+60000||Date.parse(at)<Date.parse(i.called_at||i.queued_at))throw Error('Action timestamp must follow the latest event and cannot be in the future');
  if(command==='call'){
   if(i.status!=='waiting')throw Error('Only waiting tickets can be called');
   const s=(await db.query('select * from services where id=$1',[i.service_id]))[0];const c=await resolve(db,'clerks',o.clerk,'location_id=$1',[s.location_id]);
   if(!c.active)throw Error('Clerk is inactive');
   if((await db.query("select id from interactions where clerk_id=$1 and status='called' and source_fingerprint is null",[c.id])).length)throw Error('Clerk already has an open call');
   await db.query("update interactions set status='called',clerk_id=$1,called_at=$2 where id=$3",[c.id,at,i.id]);
  }else if(['serve','no-show','remove'].includes(command)){
   if(command!=='remove'&&i.status!=='called')throw Error('Serve and no-show require a called ticket');
   if(command!=='serve')need(o.reason,'--reason');
   await db.query('update interactions set status=$1,ended_at=$2 where id=$3',[{serve:'served','no-show':'no-show',remove:'removed'}[command],at,i.id]);
  }else if(command==='forward'||command==='return-to-queue'){
   need(o.reason,'--reason');if(command==='return-to-queue'&&i.status!=='called')throw Error('Only called tickets return to the queue');
   const nextService=command==='forward'?(await service(db,o)).id:i.service_id;
   await db.query('update interactions set status=$1,ended_at=$2 where id=$3',[command==='forward'?'forwarded':'returned',at,i.id]);
   await db.query('insert into interactions(visit_id,sequence,service_id,queued_at) values($1,$2,$3,$4)',[v.id,i.sequence+1,nextService,at]);
  }else throw Error(`Unknown command: ${command}`);
  await event(db,i.id,command,actor,o.reason||'Staff recorded service action; no notification sent');
  return db.query('select * from ticket_summary where visit_id=$1 order by sequence',[v.id]);
 });
}

const hash=s=>createHash('sha256').update(s).digest('hex');
async function spreadsheet(file){
 if(/\.csv$/i.test(file))return parseCsv(fs.readFileSync(file,'utf8'));
 if(!/\.xlsx$/i.test(file))throw Error('Use .xlsx or UTF-8 .csv');
 const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.readFile(file);
 const sheet=book.getWorksheet('Ticket List')||book.getWorksheet('Visitors');if(!sheet)throw Error('Workbook requires Ticket List (or legacy Visitors) worksheet');
 const cell=v=>{if(v===null||v===undefined)return '';if(v instanceof Date)return v; if(typeof v==='object')throw Error('Formula, rich text and linked cells require plain values before import');return String(v);};
 const header=sheet.getRow(1).values.slice(1).map(x=>String(cell(x)).trim());
 if(header.some(x=>!x)||new Set(header.map(x=>x.toLowerCase())).size!==header.length)throw Error('Workbook needs unique, nonempty headers');
 const rows=[];sheet.eachRow((row,n)=>{if(n===1)return; if(row.cellCount>header.length)throw Error(`Row ${n} has extra cells`);rows.push(Object.fromEntries(header.map((h,j)=>[h,cell(row.getCell(j+1).value)])));});return rows;
}
export function exportTimestamp(v,offset){
 if(v===''||v===null||v===undefined)return null;
 if(!/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(offset||'')||(/^[-+]14:/.test(offset)&&!offset.endsWith(':00')))throw Error('--offset must be the export timezone offset, such as +13:00');
 // Excel stores a wall-clock date without a timezone. ExcelJS represents it as a UTC Date.
 if(v instanceof Date)return instant(v.toISOString().slice(0,23)+offset);
 let s=String(v).trim();
 if(/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s))return instant(s);
 const d=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4}) (\d{1,2}):(\d{2})(?::(\d{2}))?$/);
 if(d){const year=d[3].length===2?'20'+d[3]:d[3];s=`${year}-${d[2].padStart(2,'0')}-${d[1].padStart(2,'0')}T${d[4].padStart(2,'0')}:${d[5]}:${d[6]||'00'}`;}
 else s=s.replace(' ','T');
 return instant(s+offset);
}
export async function importQminder(db,file,o){
 need(file,'export file');need(o.batch,'--batch');const actor=o['dry-run']?'preview':need(o.actor,'--actor');need(o.purpose,'--purpose');const until=day(o['retain-until']);
 const l=await resolve(db,'locations',o.location);const source=await spreadsheet(file);if(!source.length)throw Error('Empty export');
 const map=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8')):{};
 const field=(row,key,...aliases)=>pick(row,map[key]||key,...aliases);
 const rows=source.map((raw,n)=>{
  try{
   const queued=exportTimestamp(field(raw,'Taken','Queued At'),o.offset);if(!queued)throw Error('Taken is required');
   const called=exportTimestamp(field(raw,'Called'),o.offset),ended=exportTimestamp(field(raw,'Service Ended','Service ended'),o.offset);
   const statusText=String(field(raw,'Status')).trim();const statuses={'served':'served','waiting':'waiting','called':'called','no show':'no-show','no-show':'no-show','cancelled by clerk':'removed','canceled by clerk':'removed','removed':'removed','forwarded':'forwarded','returned to waiting':'returned'};
   const status=statuses[statusText.toLowerCase()];if(!status)throw Error(`Unsupported status ${statusText}`);
   const line=String(field(raw,'Line','Service','Service Line')||o.service||'').trim();if(!line)throw Error('Line is required (or supply --service)');
   const clerk=String(field(raw,'Clerk')).trim();
   if(status==='waiting'&&(called||ended))throw Error('Waiting row has conflicting call/end timestamps');
   if(status==='called'&&(!called||!clerk||ended))throw Error('Called row needs a clerk and call time, with no end');
   if(['served','no-show'].includes(status)&&(!called||!ended||!clerk))throw Error('Finished service needs clerk, Called and Service Ended');
   if(called&&Date.parse(called)<Date.parse(queued)||ended&&Date.parse(ended)<Date.parse(called||queued))throw Error('Timestamps are out of order');
   const sourceId=String(field(raw,'Ticket ID','ID')).trim();
   const r={queued,called,ended,status,line,clerk:called?clerk:null,source_status:statusText,source_id:sourceId};
   r.fingerprint=hash(JSON.stringify({location:l.id,...r}));return r;
  }catch(e){throw Error(`Row ${n+2}: ${e.message}`);}
 });
 if(new Set(rows.map(r=>r.fingerprint)).size!==rows.length)throw Error('Indistinguishable duplicate rows: add a stable Ticket ID column before import');
 const range=rows.map(r=>r.queued).sort();const rangeStart=range[0],rangeEnd=range.at(-1);
 const digest=hash(JSON.stringify({location:l.id,purpose:o.purpose,until,rows}));
 return transaction(db,async()=>{
  const prev=(await db.query('select * from import_runs where batch=$1',[o.batch]))[0];
  if(prev){if(prev.digest!==digest)throw Error('This batch already exists with different content or retention settings. Reconcile changes before importing');return {batch:o.batch,rows:prev.row_count,already_imported:true};}
  if((await db.query('select id from import_runs where location_id=$1 and range_start<=$2 and range_end>=$3',[l.id,rangeEnd,rangeStart])).length)throw Error('Export overlaps an existing import time range. Use non-overlapping ranges for each location');
  for(const row of rows)if((await db.query('select id from interactions where source_fingerprint=$1',[row.fingerprint])).length)throw Error('Export overlaps an existing import. Use a non-overlapping date range');
  for(const row of rows)if(!(await db.query('select id from services where location_id=$1 and lower(name)=lower($2)',[l.id,row.line])).length){const t=integer(o.target,'--target for a new imported service');if(t<1||t>1440)throw Error('New service target must be between 1 and 1440 minutes');}
  if(o['dry-run'])return {batch:o.batch,rows:rows.length,dry_run:true,states:[...new Set(rows.map(r=>r.status))],services:[...new Set(rows.map(r=>r.line))]};
  for(const row of rows){
   // New imported services get an explicit operator-selected target, never a guessed one.
   let s=(await db.query('select * from services where location_id=$1 and lower(name)=lower($2)',[l.id,row.line]))[0];
   if(!s){const target=integer(o.target,'--target for a new imported service');s=(await db.query('insert into services(location_id,name,target_minutes) values($1,$2,$3) returning *',[l.id,row.line,target]))[0];}
   let c=null;if(row.clerk){c=(await db.query('select * from clerks where location_id=$1 and lower(name)=lower($2)',[l.id,row.clerk]))[0];if(!c)c=(await db.query('insert into clerks(location_id,name) values($1,$2) returning *',[l.id,row.clerk]))[0];}
   const v=(await db.query('insert into visits(token,purpose,retention_review_on,imported) values($1,$2,$3,true) returning *',['IMP-'+row.fingerprint.slice(0,20),o.purpose,until]))[0];
   const i=(await db.query('insert into interactions(visit_id,service_id,clerk_id,status,queued_at,called_at,ended_at,source_fingerprint,source_status) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',[v.id,s.id,c?.id||null,row.status,row.queued,row.called,row.ended,row.fingerprint,row.source_status]))[0];await event(db,i.id,'import',actor,`Batch ${o.batch}; source row ${rows.indexOf(row)+2}`);
  }
  await db.query('insert into import_runs(batch,digest,row_count,location_id,range_start,range_end) values($1,$2,$3,$4,$5,$6)',[o.batch,digest,rows.length,l.id,rangeStart,rangeEnd]);return {batch:o.batch,rows:rows.length,imported:true};
 });
}
