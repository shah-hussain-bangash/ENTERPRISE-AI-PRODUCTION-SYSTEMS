// Controlled HTTP fixtures, not the user's business services. Requires npm run build.
import {createServer,request as httpRequest} from 'node:http';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const servers=[];let app;let logs='';
async function listen(handler){const server=createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));servers.push(server);return 'http://127.0.0.1:'+server.address().port}
let nawaMode='ready',supplyMode='auth';const received=[];
try{
 const nawa=await listen((req,res)=>{received.push(req.headers);if(nawaMode==='redirect'){res.writeHead(302,{Location:'/login'});res.end();return}res.writeHead(nawaMode==='down'?503:200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:nawaMode,version:'qa-fixture'}))});
 const supply=await listen((req,res)=>{received.push(req.headers);res.writeHead(supplyMode==='auth'?401:200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'ok'}))});
 const reservation=createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));const base='http://127.0.0.1:'+port;
 app=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:process.cwd(),env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',WORKSPACE_ACCESS_MODE:'local',NAWA_ENABLED:'true',NAWA_WEB_URL:nawa,NAWA_API_URL:nawa,NAWA_HEALTH_PATH:'/health/ready',NAWA_HEALTH_KEY:'status',NAWA_HEALTH_VALUE:'ready',SUPPLYPILOT_ENABLED:'true',SUPPLYPILOT_WEB_URL:supply,SUPPLYPILOT_API_URL:supply,SUPPLYPILOT_HEALTH_PATH:'/health',SUPPLYPILOT_HEALTH_KEY:'status',SUPPLYPILOT_HEALTH_VALUE:'ok',FINAGENT_ENABLED:'true',FINAGENT_WEB_URL:nawa,FINAGENT_API_URL:'',FINAGENT_HEALTH_PATH:'',FINAGENT_HEALTH_VALUE:''},stdio:['ignore','pipe','pipe']});
 app.stdout.on('data',d=>logs+=d);app.stderr.on('data',d=>logs+=d);
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break}}catch{}if(app.exitCode!==null)break;await new Promise(resolve=>setTimeout(resolve,100))}assert.ok(ready,'Production server failed to start. '+logs.slice(-1500));
 assert.equal((await fetch(base+'/')).status,200);
 const alias=await fetch(base+'/health');assert.equal(alias.status,200);assert.equal((await alias.json()).status,'ok');
 const get=async()=>{const response=await fetch(base+'/api/connections',{headers:{Authorization:'Bearer test-do-not-forward',Cookie:'private=test-do-not-forward'}});assert.equal(response.headers.get('cache-control'),'no-store, max-age=0');assert.equal(response.status,200);return response.json()};
 let snapshot=await get();assert.deepEqual(snapshot.connections.map(c=>c.state),['healthy','launch_only','authentication_required']);
 assert.ok(received.every(h=>!h.authorization&&!h.cookie),'Browser credentials must never cross the probe boundary.');
 supplyMode='ok';snapshot=await get();assert.equal(snapshot.connections[2].state,'healthy');
 nawaMode='down';snapshot=await get();assert.equal(snapshot.connections[0].state,'http_error');assert.equal(snapshot.connections[0].httpStatus,503);
 nawaMode='redirect';snapshot=await get();assert.equal(snapshot.connections[0].state,'redirect_blocked');
 assert.equal((await fetch(base+'/api/connections',{method:'POST'})).status,405);
 const denied=await new Promise((resolve,reject)=>{const req=httpRequest(base+'/api/health',{headers:{Host:'untrusted.example.com'}},res=>{res.resume();resolve(res.statusCode)});req.on('error',reject);req.end()});assert.equal(denied,403,'Untrusted Host must be rejected at the Next.js boundary.');
 console.log('PASS: production homepage, health API, runtime connection contracts, auth boundary, offline/redirect states, no credential forwarding, GET-only route and remote-host denial.');
}catch(error){console.error(error.message);process.exitCode=1}
finally{if(app&&app.exitCode===null){app.kill('SIGTERM');await new Promise(resolve=>app.once('exit',resolve))}await Promise.all(servers.map(server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)})))}
