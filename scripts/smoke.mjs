import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';import {migrate} from './migrate.mjs';import {seed} from './seed.mjs';import {checkDomain} from './check-domain.mjs';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'queue-smoke-'));process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(tmp,'db');process.env.OUTPUT_DIR=tmp;
const db=await getDb();try{await migrate(db);assert.equal((await migrate(db)).ran.length,0);await seed(db);await seed(db);assert.equal((await db.query('select count(*) n from visits'))[0].n,8);await checkDomain(db,tmp);}finally{await db.close();}
try{
 for(const file of ['view.mjs','docs.mjs']){const r=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts',file)],{encoding:'utf8',env:process.env});assert.equal(r.status,0,r.stderr);}
 assert.equal(fs.readdirSync(path.join(tmp,'views')).length,3);const html=fs.readFileSync(path.join(tmp,'views','performance.html'),'utf8');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>unsafe</script>'));
 const r=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts/queue.mjs'),'ticket','H-101','--json'],{encoding:'utf8',env:process.env});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).interactions.length,3);
 const bad=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts/queue.mjs'),'ticket','H-1'],{encoding:'utf8',env:process.env});assert.equal(bad.status,1);assert.match(bad.stderr,/Ambiguous/);
 const typo=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts/queue.mjs'),'import','qminder','examples/qminder.csv','--dryrun'],{encoding:'utf8',env:process.env});assert.equal(typo.status,1);assert.match(typo.stderr,/Unknown or malformed/);
 console.log('PASS CLI, idempotent seed/migrations, three dashboards and two document types');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
