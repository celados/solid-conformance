import {Loading} from 'solid-js';import {dynamic} from '@solidjs/web';import {story} from './api';
export function App(){const Story=dynamic(()=>story());return <Loading fallback={<i>waiting</i>}><Story/></Loading>}
