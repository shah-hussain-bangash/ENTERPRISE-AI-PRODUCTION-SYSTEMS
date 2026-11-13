import test from 'node:test';
import assert from 'node:assert/strict';
import {authMode,hashPassword,verifyPassword,createSession,verifySession,allowedOrigin,consumeLoginAttempt,SESSION_SECONDS} from '../lib/portal-auth.mjs';
const env={PORTAL_ADMIN_EMAIL:'owner@example.test',PORTAL_PASSWORD_HASH:await hashPassword('synthetic-owner-only-123'),PORTAL_SESSION_SECRET:'s'.repeat(48)};
test('password hashing verifies correct credentials and rejects malformed hashes',async()=>{
 assert.equal(await verifyPassword('synthetic-owner-only-123',env.PORTAL_PASSWORD_HASH),true);
 assert.equal(await verifyPassword('incorrect-password',env.PORTAL_PASSWORD_HASH),false);
 assert.equal(await verifyPassword('x','plaintext'),false);
 await assert.rejects(()=>hashPassword('short'));
 assert.notEqual(await hashPassword('synthetic-owner-only-123'),env.PORTAL_PASSWORD_HASH);
});
test('partial owner configuration fails closed and local preview is explicit',()=>{
 assert.equal(authMode({}),'preview');assert.equal(authMode({WORKSPACE_ACCESS_MODE:'gateway'}),'gateway');
 assert.equal(authMode({PORTAL_ADMIN_EMAIL:'owner@example.test'}),'invalid');
 assert.equal(authMode({...env,PORTAL_PASSWORD_HASH:'bad'}),'invalid');assert.equal(authMode(env),'password');
});
test('signed sessions reject tampering, expiry, future issue time, changed owner and rotated keys',()=>{
 const now=100000000;const token=createSession(env,now);
 assert.equal(verifySession(token,env,now+1000),true);
 assert.equal(verifySession(token+'x',env,now),false);
 assert.equal(verifySession(token,env,now+SESSION_SECONDS*1000),false);
 assert.equal(verifySession(token,env,now-1000),false);
 assert.equal(verifySession(token,{...env,PORTAL_SESSION_SECRET:'t'.repeat(48)},now),false);
 assert.equal(verifySession(token,{...env,PORTAL_ADMIN_EMAIL:'other@example.test'},now),false);
 assert.equal(verifySession('bad',env,now),false);
});
test('origin checks reject missing, foreign and opaque origins and respect explicit HTTPS origin',()=>{
 assert.equal(allowedOrigin(null,'http://127.0.0.1:3000',{}),false);
 assert.equal(allowedOrigin('https://evil.example','http://127.0.0.1:3000',{}),false);
 assert.equal(allowedOrigin('http://127.0.0.1:3000','http://127.0.0.1:3000/api/auth/login',{}),true);
 assert.equal(allowedOrigin('null','http://127.0.0.1:3000',{}),false);
 assert.equal(allowedOrigin('https://workspace.example','http://private:3000',{PORTAL_PUBLIC_ORIGIN:'https://workspace.example'}),true);
});
test('login limiter blocks repeated attempts and recovers after its window',()=>{
 const key='fixture';for(let i=0;i<8;i++)assert.equal(consumeLoginAttempt(key,1000),true);
 assert.equal(consumeLoginAttempt(key,1000),false);assert.equal(consumeLoginAttempt(key,1000+15*60*1000),true);
});
