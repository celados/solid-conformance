import { renderToStream, generateHydrationScript } from "@solidjs/web";
import { App } from "./App.ssr.mjs";
let html = "";
await new Promise((resolve) => renderToStream(() => App()).pipe({ write: (c) => { html += c; }, end: resolve }));
process.stdout.write(`<!doctype html><html><head>${generateHydrationScript()}</head><body><div id="root">${html}</div><script src="client.js"></script></body></html>`);