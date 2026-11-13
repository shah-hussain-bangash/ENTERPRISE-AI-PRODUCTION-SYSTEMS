import type {Metadata} from 'next';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import SignIn from '../../components/portal-sign-in';
import {authMode,verifySession,SESSION_COOKIE} from '../../lib/portal-auth.mjs';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Sign in | Zenith Enterprise AI Platform',description:'Explore document, financial and procurement intelligence in the Zenith Enterprise AI Platform.'};
export default async function SignInPage({searchParams}:{searchParams:Promise<{show?:string}>}){
 const mode=authMode();
 if(mode==='password'&&(await searchParams).show!=='1'&&verifySession((await cookies()).get(SESSION_COOKIE)?.value))redirect('/workspace');
 return <SignIn mode={mode} sharedSignIn={process.env.PORTAL_OIDC_ENABLED==='true'}/>;
}
