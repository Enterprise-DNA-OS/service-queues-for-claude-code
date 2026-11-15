import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {REPO_ROOT} from './lib/db.mjs';
const root=fs.mkdtempSync(path.join(REPO_ROOT,'.data-demo-'));const env={...process.env,DATABASE_URL:'',DATA_DIR:path.join(root,'db'),OUTPUT_DIR:root};
for(const [file,...args] of [['migrate.mjs'],['seed.mjs'],['queue.mjs','queue-now'],['queue.mjs','wait-review'],['queue.mjs','compliance'],['view.mjs'],['docs.mjs']]){
 const r=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts',file),...args],{env,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
}
console.log('Demo database and reports: '+root);
