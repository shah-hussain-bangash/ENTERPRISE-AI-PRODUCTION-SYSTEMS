import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedOrigin} from '../lib/portal-auth.mjs';
test('sign-out origin accepts the configured address and rejects missing or foreign origins',()=>{
 const env={PORTAL_PUBLIC_ORIGIN:'http://127.0.0.1:3014'};
 assert.equal(allowedOrigin('http://127.0.0.1:3014','http://localhost:3014/api/auth/logout',env),true);
 assert.equal(allowedOrigin('http://localhost:3014','http://localhost:3014/api/auth/logout',env),false);
 assert.equal(allowedOrigin(null,'http://localhost:3014/api/auth/logout',env),false);
});
