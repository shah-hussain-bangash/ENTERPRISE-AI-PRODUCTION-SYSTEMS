// Run locally with node. Never paste your password into chat or shell arguments.
import {createInterface,emitKeypressEvents} from 'node:readline';
import {stdin,stdout} from 'node:process';
import {readFile,writeFile,copyFile,rename} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {hashPassword} from '../lib/portal-auth.mjs';
const path=fileURLToPath(new URL('../.env.local',import.meta.url));
function ask(prompt){const rl=createInterface({input:stdin,output:stdout});return new Promise(resolve=>rl.question(prompt,answer=>{rl.close();resolve(answer.trim())}))}
function hidden(prompt){
 if(!stdin.isTTY)throw new Error('Use an interactive terminal to enter your password privately.');
 stdout.write(prompt);emitKeypressEvents(stdin);stdin.setRawMode(true);stdin.resume();let value='';
 return new Promise((resolve,reject)=>{
  const cleanup=()=>{stdin.off('keypress',key);stdin.setRawMode(false);stdin.pause();stdout.write('\n')};
  const key=(text,event={})=>{if(event.ctrl&&event.name==='c'){cleanup();reject(new Error('Cancelled.'));return}if(event.name==='return'){cleanup();resolve(value);return}if(event.name==='backspace'){value=value.slice(0,-1);return}if(!event.ctrl&&!event.meta&&text&&![...text].some(c=>c<' '||c==='\x7f'))value+=text};
  stdin.on('keypress',key);
 });
}
try{
 const email=(await ask('Owner email: ')).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
 const password=await hidden('New portal password (12–128 characters; hidden): ');
 if(password!==await hidden('Confirm password (hidden): '))throw new Error('Passwords do not match. Nothing changed.');
 const hash=await hashPassword(password);
 let text='';try{text=await readFile(path,'utf8');await copyFile(path,path+'.backup-'+Date.now())}catch(error){if(error.code!=='ENOENT')throw error}
 const settings={PORTAL_ADMIN_EMAIL:email,PORTAL_PASSWORD_HASH:hash,PORTAL_SESSION_SECRET:randomBytes(48).toString('hex')};
 for(const [key,value]of Object.entries(settings)){const line=key+'='+value.replaceAll('$','\\$');const pattern=new RegExp('^[ \\t]*'+key+'[ \\t]*=.*$','gm');text=pattern.test(text)?text.replace(pattern,()=>line):text.trimEnd()+'\n'+line+'\n'}
 await writeFile(path+'.tmp',text,{encoding:'utf8',mode:0o600});await rename(path+'.tmp',path);
 console.log('Owner login configured. Existing connection settings preserved. Restart ONLY the portal, then open /sign-in.');
}catch(error){console.error(error.message);process.exitCode=1}
