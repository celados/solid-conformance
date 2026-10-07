import { defineConfig } from 'vite-plus'

import { oxfmt } from './tooling/oxfmt'
export default defineConfig({ fmt: oxfmt })
