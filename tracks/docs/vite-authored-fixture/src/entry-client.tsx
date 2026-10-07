import {hydrate} from '@solidjs/web'
import {installServerComponents} from '@solidjs/web/frames'
import App from './app'
installServerComponents()
hydrate(App,document.getElementById('root')!,{renderId:'app'})
