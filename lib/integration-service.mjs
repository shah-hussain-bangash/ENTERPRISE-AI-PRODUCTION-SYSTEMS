// Server-only integration boundary. URLs come exclusively from administrator
// environment variables. There is no arbitrary URL/path forwarding endpoint.
const definitions=[
 {id:'nawa',name:'Nawa',prefix:'NAWA',web:'http://127.0.0.1:5173',api:'http://127.0.0.1:8000',path:'/health/ready',value:'ready',auth:'Native cookie / OIDC session',verified:true},
 {id:'finagent',name:'FinAgent',prefix:'FINAGENT',web:'',api:'',path:'',value:'',auth:'Verify in your FinAgent source',verified:false},
 {id:'supplypilot',name:'SupplyPilot',prefix:'SUPPLYPILOT',web:'http://127.0.0.1:8001',api:'http://127.0.0.1:8001',path:'/health',value:'ok',auth:'Native login / bearer token',verified:true},
 {id:'industrial',name:'IndustrialAI Sentinel',prefix:'INDUSTRIAL',web:'http://127.0.0.1:8127',api:'http://127.0.0.1:8127',path:'/api/health',value:'ok',auth:'Native IndustrialAI session',verified:true},
];
const loopback=new Set(['localhost','127.0.0.1','[::1]']);
export function safeBaseUrl(raw){
 if(!raw)return '';
 const url=new URL(raw);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('invalid_url');
 if(url.protocol==='http:'&&!loopback.has(url.hostname))throw new Error('insecure_remote_url');
 if(url.pathname!=='/'&&(/%|\/\//.test(url.pathname)||url.pathname.split('/').some(p=>p==='..'||p==='.')))throw new Error('invalid_base_path');
 return url.href.replace(/\/$/,'');
}
export function safeHealthPath(raw){
 if(!raw)return '';
 if(!/^\/[A-Za-z0-9_./-]*$/.test(raw)||raw.startsWith('//')||raw.split('/').some(p=>p==='..'||p==='.'))throw new Error('invalid_health_path');
 return raw;
}
export function loadConnections(env=process.env){
 return definitions.map(d=>{
  const p=d.prefix;const enabled=(env[p+'_ENABLED']??(d.id==='finagent'?'false':'true'))==='true';
  const base={id:d.id,name:d.name,enabled,auth:d.auth,sourceVerified:d.verified,webUrl:'',apiUrl:'',healthPath:'',healthKey:env[p+'_HEALTH_KEY']??'status',expected:env[p+'_HEALTH_VALUE']??d.value,configError:false};
  try{return {...base,webUrl:safeBaseUrl(env[p+'_WEB_URL']??d.web),apiUrl:safeBaseUrl(env[p+'_API_URL']??d.api),healthPath:safeHealthPath(env[p+'_HEALTH_PATH']??d.path)}}
  catch{return {...base,configError:true}};
 });
}
export async function readBoundedJson(response,limit=32768){
 const type=response.headers.get('content-type')||'';
 if(!/^application\/(?:[\w.-]+\+)?json(?:;|$)/i.test(type))throw new Error('invalid_json');
 if(Number(response.headers.get('content-length')||0)>limit)throw new Error('response_too_large');
 if(!response.body)throw new Error('invalid_json');
 const reader=response.body.getReader();let total=0;const chunks=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>limit)throw new Error('response_too_large');chunks.push(value)}}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function probeConnection(connection,{fetchImpl=fetch,timeoutMs=3000,now=()=>new Date()}={}){
 const {healthKey,expected,configError,...publicConfig}=connection;
 const checkedAt=now().toISOString();const base={...publicConfig,state:'not_configured',message:'Configure this project in .env.local.',checkedAt,latencyMs:null,httpStatus:null,version:null};
 if(!connection.enabled)return {...base,state:'disabled',message:'Enable this project after configuring its URLs.'};
 if(configError)return {...base,state:'configuration_error',message:'Use a valid HTTP loopback or HTTPS URL and a relative health path. Credentials, query strings and fragments are not allowed.'};
 if(!connection.webUrl)return base;
 if(!connection.apiUrl||!connection.healthPath||!expected)return {...base,state:'launch_only',message:'Launch URL configured. Set the verified health path, JSON field and expected value to check the API.'};
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);const started=performance.now();
 try{
  const response=await fetchImpl(connection.apiUrl+connection.healthPath,{method:'GET',headers:{Accept:'application/json'},cache:'no-store',redirect:'manual',signal:controller.signal});
  const result={...base,httpStatus:response.status,latencyMs:Math.round(performance.now()-started)};
  if(response.status>=300&&response.status<400)return {...result,state:'redirect_blocked',message:'Health endpoint redirected. Configure its final direct URL; sign in within the separate application.'};
  if(response.status===401||response.status===403)return {...result,state:'authentication_required',message:'Endpoint reached but requires authentication. Open the native application to sign in; no credentials were forwarded.'};
  if(!response.ok)return {...result,state:'http_error',message:'The configured health endpoint returned HTTP '+response.status+'.'};
  let data;try{data=await readBoundedJson(response)}catch{return {...result,state:'invalid_response',message:'Expected a bounded JSON health response. HTML, oversized or invalid responses are not accepted.'}};
  if(!data||typeof data!=='object'||typeof data[healthKey]!=='string'||data[healthKey]!==expected)return {...result,state:'contract_mismatch',message:'Endpoint reached, but its JSON health field did not match the configured healthy value.'};
  const version=typeof data.version==='string'&&/^[A-Za-z0-9.+_-]{1,40}$/.test(data.version)?data.version:null;
  return {...result,state:'healthy',message:'The configured health contract passed. User authorization and business workflows are checked separately.',version};
 }catch{return {...base,state:controller.signal.aborted?'timeout':'unreachable',message:controller.signal.aborted?'Health check timed out. Confirm the project is running and the endpoint responds.':'Could not reach the API from the dashboard server. Check the URL, port and project process.'}}
 finally{clearTimeout(timer);controller.abort()}
}
export async function getConnectionSnapshot(env=process.env,options={}){
 const configured=loadConnections(env);const parsed=Number(env.CONNECTION_TIMEOUT_MS||3000);const timeoutMs=Number.isFinite(parsed)?Math.min(10000,Math.max(250,parsed)):3000;
 const connections=await Promise.all(configured.map(c=>probeConnection(c,{...options,timeoutMs})));
 return {schemaVersion:1,checkedAt:new Date().toISOString(),connections};
}
