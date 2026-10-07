import {OBSERVE,flush} from 'solid-js'
import {render,hydrate} from '@solidjs/web'
import {App,navigate,gate,moduleGate} from './postmount-shape'
import {ticks} from '../../harness/timing'
const capture=OBSERVE?.diagnostics.capture()
const stop=(location.search.includes('hydrate')?hydrate:render)(App,document.getElementById('root')!)
;(window as any).postmount={async run(){const initial=document.getElementById('root')!.textContent;const phases:string[]=[];navigate('/pending');flush();await ticks(8);phases.push(document.getElementById('root')!.textContent!);gate.resolve('ready');await ticks(12);const ready=document.getElementById('root')!.textContent;navigate('/lazy');flush();await ticks(8);phases.push(document.getElementById('root')!.textContent!);moduleGate.resolve({default:()=> <span>lazy-ready</span>});await ticks(12);return{initial,ready,phases,final:document.getElementById('root')!.textContent,events:capture?.events.filter(e=>e.code==='ASYNC_OUTSIDE_LOADING_BOUNDARY')??[]}},stop(){stop();capture?.stop()}}
