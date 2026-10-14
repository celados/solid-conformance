import {hydrate,render} from '@solidjs/web'
import {App} from './app'
const element = document.getElementById('root')!
if(new URL(location.href).searchParams.has('hydrate')) hydrate(() => <App/>, element, {renderId:'app'})
else render(() => <App/>, element)
