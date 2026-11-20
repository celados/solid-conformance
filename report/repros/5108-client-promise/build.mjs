// Compiles App.jsx for the server and the browser with @solidjs/compiler (`dev: true`
// keeps <Show> a component), renders it with renderToStream, bundles the client.
import { transform } from "@solidjs/compiler";
import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync("App.jsx", "utf8");
for (const generate of ["ssr", "dom"])
  writeFileSync(`App.${generate}.mjs`, transform(src, { filename: "App.jsx", generate, hydratable: true, dev: true }).code);
writeFileSync("client-entry.mjs", `import { hydrate } from "@solidjs/web";
import { App } from "./App.dom.mjs";
hydrate(() => App(), document.getElementById("root"));\n`);
