import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const args=process.argv.slice(2);
let hostname='127.0.0.1',port=process.env.PORT||'3000';
for(let i=0;i<args.length;i++){
 if(['--host','--hostname','-H'].includes(args[i]))hostname=args[++i];
 else if(['--port','-p'].includes(args[i]))port=args[++i];
 else if(args[i]!=='--strictPort')throw new Error('Unsupported development option: '+args[i]);
}
if(!hostname||!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)throw new Error('Use a valid hostname and port.');
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--webpack','--hostname',hostname,'--port',port],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
child.on('error',()=>{console.error('Could not launch Next.js. Run npm ci first.');process.exitCode=1});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(!child.killed)child.kill(signal)});
child.on('exit',(code)=>{process.exitCode=code??0});
