#!/usr/bin/env node
import { getDb } from './lib/db.mjs';
import { execute, reads } from './lib/queue.mjs';
import { table } from './lib/format.mjs';
const argv=process.argv.slice(2),options={},args=[];
for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');options[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else args.push(a);}
const allowed=new Set('json help actor name purpose retention-days location service target token at clerk reason note until evidence batch offset retain-until mapping dry-run'.split(' '));
for(const [key,value] of Object.entries(options)){if(!allowed.has(key)||(!['json','help','dry-run'].includes(key)&&value===true)||(['json','help','dry-run'].includes(key)&&value!==true)){console.error('Unknown or malformed option: --'+key);process.exit(1);}}
const command=args.shift();
if(!command||command==='help'||options.help){console.log('Service queue desk\n'+[...Object.keys(reads),'ticket <token>','insights','weekly-review','draft-handover','arrive --location=... --service=... --token=... --actor=...','call <token> --clerk=... --actor=...','serve <token> --actor=...','no-show|remove <token> --reason=... --actor=...','forward <token> --location=... --service=... --reason=... --actor=...','return-to-queue <token> --reason=... --actor=...','log <token> --note=... --actor=...','review-retention <token> --until=YYYY-MM-DD --purpose=... --evidence=... --actor=...','add-location --name=... --purpose=... --retention-days=... --actor=...','add-service --location=... --name=... --target=... --actor=...','add-clerk --location=... --name=... --actor=...','import qminder <xlsx-or-csv> --location=... --batch=... --offset=+13:00 --purpose=... --retain-until=YYYY-MM-DD --target=15 --actor=... [--dry-run]','export'].join('\n')+'\nUse --json. Read docs/cli.md for exact input rules.');process.exit(0);}
function print(value,label=''){
 if(label)console.log('\n'+label);
 if(Array.isArray(value)){
  if(value[0]?.question){for(const v of value)print(v.rows,v.question);return;}
  console.log(value.length?table(value,Object.keys(value[0]).filter(k=>!['id','visit_id','service_id','clerk_id'].includes(k)).map(key=>({key,label:key,width:45}))):'  (none)');
 }else if(value&&typeof value==='object'){for(const[k,v]of Object.entries(value)){if(Array.isArray(v)||typeof v==='object')print(v,k);else console.log(`${k}: ${v}`);}}
 else console.log(value);
}
let db;
try{db=await getDb();const result=await execute(db,command,args,options);if(options.json)console.log(JSON.stringify(result,null,2));else print(result);}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
