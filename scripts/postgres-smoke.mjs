import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {execute} from './lib/queue.mjs';
import assert from 'node:assert/strict';
import {getDb} from './lib/db.mjs';import {migrate} from './migrate.mjs';import {seed} from './seed.mjs';import {checkDomain} from './check-domain.mjs';
if(!process.env.TEST_DATABASE_URL)throw Error('TEST_DATABASE_URL must name an empty disposable database');
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'freight-pg-test-'));process.env.OUTPUT_DIR=tmp;
const db=await getDb();try{const existing=await db.query("select tablename from pg_tables where schemaname='public'");if(existing.length)throw Error('Refusing nonempty test database');await migrate(db);await seed(db);await checkDomain(db,tmp);
await execute(db,'arrive',[],{location:'Test office',service:'unsafe',token:'RACE-1',actor:'test'});
await execute(db,'arrive',[],{location:'Test office',service:'unsafe',token:'RACE-2',actor:'test'});
const db2=await getDb();try {
 const race=await Promise.allSettled([execute(db,'call',['RACE-1'],{clerk:'Test Clerk',actor:'first'}),execute(db2,'call',['RACE-2'],{clerk:'Test Clerk',actor:'second'})]);
 assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(race.filter(r=>r.status==='rejected').length,1);
 assert.match(race.find(r=>r.status==='rejected').reason.message,/open call/);
}finally{await db2.close();}
console.log('PASS PostgreSQL including simultaneous calls from two connections');}finally{await db.close();fs.rmSync(tmp,{recursive:true,force:true});}
