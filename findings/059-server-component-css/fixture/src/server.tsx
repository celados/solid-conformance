'use server'

import { Notes } from './notes'

export async function getNotes() {
	return () => <Notes />
}
