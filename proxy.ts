import {NextResponse,type NextRequest} from 'next/server';
import {isWorkspaceAllowed} from './lib/workspace-access.mjs';
export function proxy(request:NextRequest){
 if(!isWorkspaceAllowed(request.headers.get('host')||'',request.headers.get('x-workspace-gateway-key')||''))return new NextResponse('Workspace access is restricted. Use the local URL or the configured authenticated gateway.',{status:403,headers:{'Cache-Control':'no-store'}});
 const response=NextResponse.next();response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','same-origin');response.headers.set('X-Frame-Options','DENY');return response;
}

