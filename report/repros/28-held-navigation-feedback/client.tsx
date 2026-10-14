import { createEffect, createSignal, latest, Show } from 'solid-js'
import { render } from '@solidjs/web'
import { createRouter, memoryHistory, useIsRouting, useNavigate, type RouteDefinition } from '@solidjs/router'

let release!: (value: {default: RouteDefinition[]}) => void
const routes = new Promise<{default: RouteDefinition[]}>(resolve => {release = resolve})
const history = memoryHistory()
const Router = createRouter({history, scrollRestoration: false, routes: [
  {path: '/', component: () => <p>old</p>},
  {path: '/slow', component: (props: {children?: import('@solidjs/web').JSX.Element}) => <>{props.children}</>, children: () => routes},
]})

function Feedback() {
  const pending = useIsRouting(), navigate = useNavigate()
  const [elapsed, setElapsed] = createSignal(false)
  createEffect(pending, value => {
    if (!value) {setElapsed(false); return}
    const timer = setTimeout(() => setElapsed(true), 300)
    return () => clearTimeout(timer)
  })
  return <><button onClick={() => navigate('/slow')}>Navigate</button><Show when={pending() && latest(elapsed)}><b role="status">waiting</b></Show></>
}

render(() => <Router>{props => <><Feedback />{props.children}</>}</Router>, document.getElementById('root')!)
declare global {var releaseNavigation: () => void; var navigationURL: () => string}
window.releaseNavigation = () => release({default: [{path: '/', component: () => <p>new</p>}]})
window.navigationURL = () => history.get()
