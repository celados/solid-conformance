import {lazy,Loading} from 'solid-js'
const Lazy = lazy(() => import('./part'))
export function App(){return <><span>A</span><Loading fallback="pending"><span>B</span><Lazy/></Loading></>}
