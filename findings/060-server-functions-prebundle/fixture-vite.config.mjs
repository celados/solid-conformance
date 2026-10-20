const { default: solid } = await import(process.env.PREBUNDLE_TARGET === 'head' ? '@solidjs/vite-plugin-head' : '@solidjs/vite-plugin')

export default {
  root: import.meta.dirname,
  plugins: [solid({ ssr: true, start: { app: './src/App.tsx' }, serverFunctions: { components: true }, performanceTracks: false })],
  optimizeDeps: {
    exclude: ['@solidjs/web'],
    include: process.env.PREBUNDLE_CLIENT === '1' ? ['@solidjs/web/server-functions/client'] : [],
  },
  server: { host: '127.0.0.1', port: Number(process.env.PROBE_PORT), strictPort: true },
  ssr: { noExternal: true },
  logLevel: 'warn',
}
