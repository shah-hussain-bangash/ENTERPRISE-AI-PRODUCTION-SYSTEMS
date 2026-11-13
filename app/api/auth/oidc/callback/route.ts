import {NextRequest,NextResponse} from 'next/server';
import {authMode,createSession,SESSION_COOKIE,SESSION_SECONDS} from '../../../../../lib/portal-auth.mjs';
import {oidcConfig,readTransaction,matchesState,validateToken} from '../../../../../lib/portal-oidc.mjs';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 let config;try{config=oidcConfig()}catch{return new Response('Shared sign-in is not configured.',{status:503})}
 if(!config||authMode()!=='password')return new Response('Shared sign-in is not configured.',{status:503});
 const fail=()=>{const response=new NextResponse('Shared sign-in could not be verified. Please try again.',{status:401,headers:{'Cache-Control':'no-store'}});response.cookies.set('zenith_oidc_tx','',{httpOnly:true,sameSite:'lax',path:'/api/auth/oidc',maxAge:0});return response};
 try{
  const tx=readTransaction(request.cookies.get('zenith_oidc_tx')?.value||'',config),state=request.nextUrl.searchParams.get('state'),code=request.nextUrl.searchParams.get('code');
  if(!tx||!matchesState(state,tx.state)||!code||code.length>4096)return fail();
  const body=new URLSearchParams({grant_type:'authorization_code',client_id:config.clientId,client_secret:config.clientSecret,code,redirect_uri:config.origin+'/api/auth/oidc/callback',code_verifier:tx.verifier});
  const result=await fetch(config.issuer+'/protocol/openid-connect/token',{method:'POST',body,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});if(!result.ok)return fail();
  const data=await result.json();if(typeof data.id_token!=='string')return fail();await validateToken(data.id_token,config,tx.nonce);
  const response=NextResponse.redirect(new URL('/workspace',config.origin));response.headers.set('Cache-Control','no-store');response.cookies.set('zenith_oidc_tx','',{httpOnly:true,sameSite:'lax',path:'/api/auth/oidc',maxAge:0});response.cookies.set(SESSION_COOKIE,createSession(),{httpOnly:true,secure:config.origin.startsWith('https:'),sameSite:'lax',path:'/',maxAge:SESSION_SECONDS});return response;
 }catch{return fail()}
}
