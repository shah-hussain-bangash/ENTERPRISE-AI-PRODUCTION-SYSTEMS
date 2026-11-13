import {createHmac,randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export const SESSION_COOKIE='zenith_portal_session';
export const SESSION_SECONDS=60*60*8;
const validHash=h=>/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(h||'');
export function authMode(env=process.env){
 const fields=[env.PORTAL_ADMIN_EMAIL,env.PORTAL_PASSWORD_HASH,env.PORTAL_SESSION_SECRET];
 if(fields.some(Boolean))return fields.every(Boolean)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields[0])&&validHash(fields[1])&&fields[2].length>=32?'password':'invalid';
 return (env.WORKSPACE_ACCESS_MODE||'local')==='local'?'preview':'gateway';
}
export async function hashPassword(password,salt=randomBytes(16).toString('hex')){
 if(typeof password!=='string'||password.length<12||password.length>128)throw new Error('Use a password of 12 to 128 characters.');
 const key=await scrypt(password,salt,64);
 return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password,hash){
 if(typeof password!=='string'||password.length>128||!validHash(hash))return false;
 const [,salt,key]=hash.split('$');
 const actual=await scrypt(password,salt,64);
 return timingSafeEqual(actual,Buffer.from(key,'hex'));
}
export function createSession(env=process.env,now=Date.now()){
 if(authMode(env)!=='password')throw new Error('Owner login is not configured.');
 const body=Buffer.from(JSON.stringify({sub:env.PORTAL_ADMIN_EMAIL.toLowerCase(),iat:Math.floor(now/1000),exp:Math.floor(now/1000)+SESSION_SECONDS,v:1})).toString('base64url');
 return body+'.'+createHmac('sha256',env.PORTAL_SESSION_SECRET).update(body).digest('base64url');
}
export function verifySession(token,env=process.env,now=Date.now()){
 if(authMode(env)!=='password'||typeof token!=='string'||token.length>2048)return false;
 try{
  const parts=token.split('.');if(parts.length!==2)return false;
  const expected=createHmac('sha256',env.PORTAL_SESSION_SECRET).update(parts[0]).digest();
  const supplied=Buffer.from(parts[1],'base64url');
  if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return false;
  const p=JSON.parse(Buffer.from(parts[0],'base64url').toString());const time=Math.floor(now/1000);
  return p.v===1&&p.sub===env.PORTAL_ADMIN_EMAIL.toLowerCase()&&Number.isInteger(p.exp)&&Number.isInteger(p.iat)&&p.iat<=time&&p.exp>time&&p.exp-p.iat===SESSION_SECONDS;
 }catch{return false}
}
export function allowedOrigin(origin,url,env=process.env){
 try{const expected=new URL(env.PORTAL_PUBLIC_ORIGIN||url);return !!origin&&new URL(origin).origin===expected.origin&&origin===new URL(origin).origin}catch{return false}
}
// Single-process owner-demo limiter. Use gateway/WAF distributed limits on AWS.
const attempts=new Map();
export function consumeLoginAttempt(key,now=Date.now()){
 for(const [k,v]of attempts)if(v.until<=now)attempts.delete(k);
 let value=attempts.get(key);
 if(!value){if(attempts.size>=1000)return false;value={count:0,until:now+15*60*1000};attempts.set(key,value)}
 return ++value.count<=8;
}
