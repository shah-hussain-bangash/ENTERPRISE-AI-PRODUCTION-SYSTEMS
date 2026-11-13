import {getConnectionSnapshot} from '../../../lib/integration-service.mjs';
import {cookies} from 'next/headers';
import {authMode,verifySession,SESSION_COOKIE} from '../../../lib/portal-auth.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 const mode=authMode();
 if(mode==='invalid'||(mode==='password'&&!verifySession((await cookies()).get(SESSION_COOKIE)?.value)))return Response.json({error:'Sign in to access connections.'},{status:401,headers:{'Cache-Control':'no-store'}});
 return Response.json(await getConnectionSnapshot(),{headers:{'Cache-Control':'no-store, max-age=0'}});
}
