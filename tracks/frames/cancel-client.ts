import {
  invoke,
  GET,
  createServerReference,
} from "@solidjs/web/server-functions/client";
const abort = new AbortController();
const reason = new Error("caller-stop");
const timer = setTimeout(() => abort.abort(reason), 150);
const fn = GET(createServerReference("pending"));
let caught: unknown;
try {
  await invoke(fn, { signal: abort.signal });
} catch (error) {
  caught = error;
} finally {
  clearTimeout(timer);
}
(window as any).canceled = {
  sameReason: caught === reason,
  aborted: abort.signal.aborted,
};
