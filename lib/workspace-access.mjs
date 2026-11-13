import {timingSafeEqual} from 'node:crypto';
export function isWorkspaceAllowed(host,gatewayKey,env=process.env){
 const mode=env.WORKSPACE_ACCESS_MODE||'local';
 if(mode==='local'){
  try{return ['127.0.0.1','localhost','[::1]'].includes(new URL('http://'+host).hostname)}catch{return false}
 }
 if(mode!=='gateway')return false;
 const expected=env.WORKSPACE_GATEWAY_SECRET||'';
 if(expected.length<32||!gatewayKey)return false;
 const a=Buffer.from(expected),b=Buffer.from(gatewayKey);
 return a.length===b.length&&timingSafeEqual(a,b);
}
