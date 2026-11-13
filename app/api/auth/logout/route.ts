import {NextRequest,NextResponse} from 'next/server';
import {allowedOrigin,SESSION_COOKIE} from '../../../../lib/portal-auth.mjs';
export async function POST(request:NextRequest){
 if(!allowedOrigin(request.headers.get('origin'),request.url))return NextResponse.json({error:'Request origin was not accepted.'},{status:403});
 const response=NextResponse.redirect(new URL('/sign-in',process.env.PORTAL_PUBLIC_ORIGIN||request.url),303);
 response.headers.set('Cache-Control','no-store');
 response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,sameSite:'lax',path:'/',maxAge:0});
 return response;
}

