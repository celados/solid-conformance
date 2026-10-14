import { hydrate, render } from '@solidjs/web'
import { App } from './app'
const root = document.getElementById('root')!
if (new URL(location.href).searchParams.has('hydrate')) hydrate(() => <App />, root, {renderId: 'app'})
else render(() => <App />, root)
