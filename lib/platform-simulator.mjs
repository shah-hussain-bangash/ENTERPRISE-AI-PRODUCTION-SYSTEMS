// Browser-only demonstrations. These functions do not authorize real users or call business services.
export function accessPreview(role,action,sameTenant){
 if(!sameTenant)return {allowed:false,reason:'Tenant boundary: the resource belongs to a different organization.'};
 if(action==='approve'&&role!=='Independent reviewer')return {allowed:false,reason:'This action requires an independent reviewer.'};
 if(action==='create'&&role==='Read-only analyst')return {allowed:false,reason:'The selected role can read evidence but cannot create a proposal.'};
 return {allowed:true,reason:'The selected sample policy permits this action within the same tenant.'};
}
export function releasePreview(candidate,minQuality){
 const result=candidate==='regression'?{quality:84,citations:89,critical:1,cost:0.038,latency:2400}:{quality:94,citations:97,critical:0,cost:0.046,latency:2800};
 return {...result,allowed:result.quality>=minQuality&&result.critical===0};
}
export function executionPreview(state,event){
 if(event==='reset')return {phase:'ready',orders:0,events:['Sample scenario reset.']};
 const add=(phase,message,orders=state.orders)=>({phase,orders,events:[...state.events,message]});
 if(event==='start'&&state.phase==='ready')return add('review','Proposal revision 2 prepared; independent review required.');
 if(event==='approve'&&state.phase==='review')return add('approved','Synthetic approval bound to proposal revision 2.');
 if(event==='dispatch'&&state.phase==='approved')return add('uncertain','Simulator accepted order DEMO-0041; response timed out. Dispatch is blocked pending reconciliation.',1);
 if(event==='reconcile'&&state.phase==='uncertain')return add('complete','Reconciliation found DEMO-0041. No additional order was created.');
 if(event==='cancel'&&['review','approved'].includes(state.phase))return add('cancelled','Sample workflow cancelled before dispatch.');
 return state;
}
export function routingPreview(primaryDown,budget,spent){
 if(spent+0.046>budget)return {state:'Blocked',provider:'None',reason:'The sample request would exceed the configured budget.'};
 if(primaryDown)return {state:'Fallback',provider:'Approved secondary model',reason:'Primary timeout simulated. The approved secondary handles this sample task.'};
 return {state:'Routed',provider:'Approved primary model',reason:'The sample policy allows this request within its budget.'};
}
