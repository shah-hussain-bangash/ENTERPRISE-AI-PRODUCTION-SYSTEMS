import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {ConnectionProvider} from '../../components/local-connections';
import Workspace from '../workspace-view';
import {authMode,verifySession,SESSION_COOKIE} from '../../lib/portal-auth.mjs';
export const dynamic='force-dynamic';
export default async function WorkspacePage(){
 const mode=authMode();
 if(mode==='invalid'||(mode==='password'&&!verifySession((await cookies()).get(SESSION_COOKIE)?.value)))redirect('/sign-in');
 return <ConnectionProvider><Workspace/></ConnectionProvider>;
}
