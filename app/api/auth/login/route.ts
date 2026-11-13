import {NextRequest,NextResponse} from 'next/server';
import {authMode,verifyPassword,createSession,allowedOrigin,consumeLoginAttempt,SESSION_COOKIE,SESSION_SECONDS} from '../../../../lib/portal-auth.mjs';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
 if(!allowedOrigin(request.headers.get('origin'),request.url))return reply('Request origin was not accepted.',403);
 if(authMode()!=='password')return reply('Owner login is not configured. Contact the workspace owner.',503);
 if(!consumeLoginAttempt('owner-login'))return reply('Too many attempts. Please try again in 15 minutes.',429);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply('Use a JSON sign-in request.',415);
 if(Number(request.headers.get('content-length')||0)>4096)return reply('Request is too large.',413);
 const text=await request.text();if(text.length>4096)return reply('Request is too large.',413);
 let input;try{input=JSON.parse(text)}catch{return reply('The sign-in request could not be read.',400)}
 if(!input||typeof input.email!=='string'||typeof input.password!=='string')return reply('Enter your email and password.',400);
 const validPassword=await verifyPassword(input.password,process.env.PORTAL_PASSWORD_HASH);
 if(input.email.trim().toLowerCase()!==process.env.PORTAL_ADMIN_EMAIL?.toLowerCase()||!validPassword)return reply('Email or password is incorrect.',401);
 const response=NextResponse.json({ok:true,redirect:'/workspace'},{headers:{'Cache-Control':'no-store'}});
 const origin=new URL(process.env.PORTAL_PUBLIC_ORIGIN||request.url);
 response.cookies.set(SESSION_COOKIE,createSession(),{httpOnly:true,secure:origin.protocol==='https:',sameSite:'lax',path:'/',maxAge:SESSION_SECONDS});
 return response;
}
