import nextEnv from '@next/env';
import {getConnectionSnapshot} from '../lib/integration-service.mjs';
nextEnv.loadEnvConfig(process.cwd(),true);
const snapshot=await getConnectionSnapshot();
for(const c of snapshot.connections)console.log(`${c.name}: ${c.state}${c.httpStatus?' (HTTP '+c.httpStatus+')':''}\n  ${c.message}`);
console.log('\nHealth checks do not authenticate users or execute business workflows.');
if(snapshot.connections.some(c=>c.enabled&&c.state!=='healthy'&&c.state!=='launch_only'))process.exitCode=1;
