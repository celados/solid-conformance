import {test,expect} from 'bun:test'
import {createServer,resolveConfig} from 'vite'
import {resolve} from 'node:path'
import {mkdir,rm} from 'node:fs/promises'
// RFC 08 L1216: test the >= next.46 plugin snapshot the docs explicitly name, not the older npm next tag.
test('RFC 08 L1216: Vite dev injects tracks before the app; options pass through; build/preview/test opt out',async()=>{
 const manifest=await Bun.file('.upstream/vite-built.json').json(),pluginModule=await import(manifest.directory+'/dist/esm/index.mjs'),solid=pluginModule.default
 const root=resolve('.scratch','vite-performance-'+process.pid);await mkdir(root,{recursive:true});await Bun.write(root+'/index.html','<html><head><script type="module" src="/main.ts"></script></head><body>fixture</body></html>');await Bun.write(root+'/main.ts','window.__viteFixture=true')
 const results=[]
 try{
  for(const options of [undefined,false,{minMs:2,rich:true,attribution:{values:'none',checks:true}}]){
   const server=await createServer({root,configFile:false,plugins:solid({diagnostics:false,performanceTracks:options}),server:{middlewareMode:true},logLevel:'silent',optimizeDeps:{noDiscovery:true}})
   try{
    const html=await server.transformIndexHtml('/',await Bun.file(root+'/index.html').text())
    if(options===false)expect(html).not.toContain('virtual:solid-performance-tracks')
    else{expect(html.indexOf('virtual:solid-performance-tracks')).toBeGreaterThan(0);expect(html.indexOf('virtual:solid-performance-tracks')).toBeLessThan(html.indexOf('/main.ts'));const loaded=await server.pluginContainer.load('virtual:solid-performance-tracks');const code=typeof loaded==='string'?loaded:loaded?.code;expect(code).toContain('enablePerformanceTracks('+JSON.stringify(options??{})+')');results.push({options,code,html})}
   }finally{await server.close()}
  }
  for(const [command,mode,preview] of [['build','production',false],['serve','test',false],['serve','production',true]] as const){const config=await resolveConfig({root,configFile:false,plugins:solid({diagnostics:false}),mode,logLevel:'silent'},command,mode,undefined,preview);expect(config.plugins.some(p=>p.name==='solid:performance-tracks')).toBe(false);results.push({command,mode,preview})}
  await Bun.write('artifacts/vite-performance.json',JSON.stringify({manifest,results},null,2))
 }finally{await rm(root,{recursive:true,force:true})}
},60000)
