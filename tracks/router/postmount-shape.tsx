import {createMemo,lazy} from 'solid-js'
import {createRouter,memoryHistory,useNavigate} from '@solidjs/router'
import {deferred} from '../../harness/timing'
export const gate=deferred<string>(),moduleGate=deferred<{default:()=>any}>()
export let navigate!:ReturnType<typeof useNavigate>
const Later=lazy(()=>moduleGate.promise)
function Pending(){const value=createMemo(()=>gate.promise);return <span>{value()}</span>}
const Router=createRouter({history:memoryHistory('/'),routes:[{path:'/',component:()=> <span>home</span>},{path:'/pending',component:Pending},{path:'/lazy',component:Later}]})
export function App(){return <Router>{p=>{navigate=useNavigate();return <main>{p.children}</main>}}</Router>}
