import {NextResponse} from 'next/server';
import {authMode} from '../../../../../lib/portal-auth.mjs';
import {oidcConfig,newTransaction,challenge} from '../../../../../lib/portal-oidc.mjs';
export const runtime='nodejs';
export async function GET(){
 try{
  const config=oidcConfig(); if(!config||authMode()!=='password')return new Response('Shared sign-in is not configured.',{status:503});
  const tx=newTransaction(config),url=new URL(config.issuer+'/protocol/openid-connect/auth');
  for(const [k,v] of Object.entries({client_id:config.clientId,redirect_uri:config.origin+'/api/auth/oidc/callback',response_type:'code',scope:'openid',state:tx.state,nonce:tx.nonce,code_challenge:challenge(tx.verifier),code_challenge_method:'S256'}))url.searchParams.set(k,v as string);
  const response=NextResponse.redirect(url);response.headers.set('Cache-Control','no-store');response.cookies.set('zenith_oidc_tx',tx.cookie,{httpOnly:true,secure:config.origin.startsWith('https:'),sameSite:'lax',path:'/api/auth/oidc',maxAge:300});return response;
 }catch{return new Response('Shared sign-in is not configured.',{status:503,headers:{'Cache-Control':'no-store'}})}
}
