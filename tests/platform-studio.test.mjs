import test from 'node:test';
import assert from 'node:assert/strict';
import {accessPreview,releasePreview,executionPreview,routingPreview} from '../lib/platform-simulator.mjs';
test('sample access denies cross-tenant and unauthorized approval',()=>{
 assert.equal(accessPreview('Independent reviewer','approve',false).allowed,false);
 assert.equal(accessPreview('Buyer','approve',true).allowed,false);
 assert.equal(accessPreview('Read-only analyst','create',true).allowed,false);
 assert.equal(accessPreview('Independent reviewer','approve',true).allowed,true);
});
test('sample release blocks critical failures even with a low quality threshold',()=>{
 assert.equal(releasePreview('regression',0).allowed,false);
 assert.equal(releasePreview('safe',95).allowed,false);
 assert.equal(releasePreview('safe',90).allowed,true);
});
test('sample uncertain dispatch cannot create a second order and reconciles once',()=>{
 let s={phase:'ready',orders:0,events:[]};
 s=executionPreview(s,'dispatch');assert.equal(s.orders,0);
 for(const event of ['start','approve','dispatch'])s=executionPreview(s,event);
 assert.equal(s.phase,'uncertain');assert.equal(s.orders,1);
 const blocked=executionPreview(s,'dispatch');assert.deepEqual(blocked,s);
 s=executionPreview(s,'reconcile');assert.equal(s.phase,'complete');assert.equal(s.orders,1);
 assert.deepEqual(executionPreview(s,'reconcile'),s);
});
test('cancelled sample cannot dispatch',()=>{
 let s={phase:'ready',orders:0,events:[]};for(const event of ['start','cancel','dispatch'])s=executionPreview(s,event);
 assert.equal(s.phase,'cancelled');assert.equal(s.orders,0);
});
test('sample model routing enforces budget before fallback',()=>{
 assert.equal(routingPreview(true,1.21,1.2).state,'Blocked');
 assert.equal(routingPreview(true,10,1.2).state,'Fallback');
 assert.equal(routingPreview(false,10,1.2).state,'Routed');
});
