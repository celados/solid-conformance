import { render, hydrate } from "@solidjs/web";
import { Shape } from "./shape";
let count = 0;
const stop = (location.search.includes("csr") ? render : hydrate)(
  () => <Shape clicked={() => count++} />,
  document.getElementById("root")!,
);
(window as any).inspect = () => ({
  count,
  nested: !!document.querySelector("#root>div>button"),
  text: document.getElementById("root")!.textContent,
});
(window as any).stop = stop;
