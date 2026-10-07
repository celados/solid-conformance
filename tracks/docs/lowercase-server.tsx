import {renderToString,generateHydrationScript} from '@solidjs/web'
import {Shape} from './lowercase-shape'
export function html(mode:string){return generateHydrationScript()+'<div id="root">'+renderToString(()=> <Shape mode={mode} handler={()=>{}}/> )+'</div>'}
