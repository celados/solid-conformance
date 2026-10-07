import {renderToString,generateHydrationScript} from '@solidjs/web'
import {Shape} from './shape'
export function markup(){return renderToString(()=><Shape clicked={()=>{}}/>)}
export function html(){return generateHydrationScript()+'<main id="root">'+markup()+'</main>'}
