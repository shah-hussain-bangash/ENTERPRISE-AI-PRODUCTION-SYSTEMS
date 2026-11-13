import {createCipheriv,createDecipheriv,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {createRemoteJWKSet,jwtVerify} from 'jose';

// Explicit configuration keeps the existing owner login available until setup is complete.
export function oidcConfig(env=process.env){
 if(env.PORTAL_OIDC_ENABLED!=='true') return null;
 const {PORTAL_OIDC_ISSUER:issuer,PORTAL_OIDC_CLIENT_ID:clientId,PORTAL_OIDC_CLIENT_SECRET:clientSecret,PORTAL_OIDC_SUBJECT:subject,PORTAL_PUBLIC_ORIGIN:origin,PORTAL_SESSION_SECRET:secret}=env;
 if(!issuer||!clientId||!clientSecret||!subject||!origin||!secret||secret.length<32) throw new Error('Shared sign-in is not configured.');
 const base=new URL(issuer), app=new URL(origin);
 if(!['http:','https:'].includes(base.protocol)||!['http:','https:'].includes(app.protocol)||base.username||base.password||app.username||app.password||app.origin!==origin) throw new Error('Invalid shared sign-in configuration.');
 if((base.protocol==='http:'&&!['127.0.0.1','localhost'].includes(base.hostname))||(app.protocol==='http:'&&!['127.0.0.1','localhost'].includes(app.hostname))) throw new Error('HTTPS is required outside local development.');
 return {issuer:issuer.replace(/\/$/,''),clientId,clientSecret,subject,origin,secret};
}
export function newTransaction(config){
 const state=randomBytes(32).toString('base64url'),nonce=randomBytes(32).toString('base64url'),verifier=randomBytes(32).toString('base64url');
 const key=createHash('sha256').update('zenith-oidc-transaction:').update(config.secret).digest(), iv=randomBytes(12);
 const cipher=createCipheriv('aes-256-gcm',key,iv); const body=Buffer.concat([cipher.update(JSON.stringify({state,nonce,verifier,exp:Date.now()+300000})),cipher.final()]);
 return {state,nonce,verifier,cookie:Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url')};
}
export function readTransaction(cookie,config){
 try{const b=Buffer.from(cookie,'base64url');if(b.length<29||b.length>4096)return null;const key=createHash('sha256').update('zenith-oidc-transaction:').update(config.secret).digest();const decipher=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));decipher.setAuthTag(b.subarray(12,28));const tx=JSON.parse(Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString());return typeof tx.state==='string'&&typeof tx.nonce==='string'&&typeof tx.verifier==='string'&&Number.isFinite(tx.exp)&&tx.exp>Date.now()?tx:null}catch{return null}
}
export function matchesState(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export function challenge(verifier){return createHash('sha256').update(verifier).digest('base64url')}
export async function validateToken(token,config,nonce){
 const jwks=createRemoteJWKSet(new URL(config.issuer+'/protocol/openid-connect/certs'));
 const {payload}=await jwtVerify(token,jwks,{issuer:config.issuer,audience:config.clientId,algorithms:['RS256'],requiredClaims:['sub','exp','iat'],maxTokenAge:'5m'});
 if(payload.sub!==config.subject||payload.nonce!==nonce||(Array.isArray(payload.aud)&&payload.aud.length>1&&payload.azp!==config.clientId))throw new Error('Identity is not authorized.');
 return payload;
}
