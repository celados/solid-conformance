import {Loading,createSignal} from 'solid-js'
import {dynamic} from '@solidjs/web'
import {story} from './functions'
export default function App(){const Story=dynamic(()=>story(1));const[count,set]=createSignal(0);return <main><Loading fallback={<i>pending</i>}><Story/></Loading><button onClick={()=>set(n=>n+1)}>{count()}</button></main>}
