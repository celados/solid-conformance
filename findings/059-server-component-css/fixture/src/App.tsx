import { createSignal, Loading } from 'solid-js'
import { dynamic, getRequestEvent, isServer } from '@solidjs/web'
import { getNotes } from './server'

function PageB() {
	const Notes = dynamic(() => getNotes())
	return <Loading fallback="Loading"><Notes /></Loading>
}

export default function App() {
	const pathname = isServer
		? new URL(getRequestEvent()!.request.url).pathname
		: window.location.pathname
	const [showNotes, setShowNotes] = createSignal(pathname === '/b')
	return (
		<main>
			<button id="to-b" onClick={() => setShowNotes(true)}>Show notes</button>
			{showNotes() ? <PageB /> : <p>Plain page</p>}
		</main>
	)
}
