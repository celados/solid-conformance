import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
// Real page visibility needs the public noDefaults CDP connection; ordinary
// Playwright launch installs focus emulation even for headed task windows.
export async function naturalChrome(profile:string){
 await mkdir(profile,{recursive:true});
 const process=Bun.spawn(['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','about:blank'],{stdout:'ignore',stderr:'ignore'});
 try{
  let port='';for(let i=0;i<100&&!port;i++){try{port=(await Bun.file(profile+'/DevToolsActivePort').text()).split('\n')[0]!}catch{}if(!port)await new Promise(r=>setTimeout(r,50))}
  if(!port)throw new Error('System Chrome did not expose its task-owned loopback CDP endpoint');
  const browser=await chromium.connectOverCDP('http://127.0.0.1:'+port,{noDefaults:true});const context=browser.contexts()[0]!;
  return {browser,context,async close(){try{await(await browser.newBrowserCDPSession()).send('Browser.close')}catch{}await browser.close().catch(()=>{});process.kill();await process.exited}};
 }catch(error){process.kill();await process.exited;throw error}
}
