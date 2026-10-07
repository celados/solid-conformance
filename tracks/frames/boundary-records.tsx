import { OBSERVE, Loading, Reveal, createMemo } from "solid-js";
import { isDev, renderToString, renderToStream } from "@solidjs/web";
import { equal, ok, runCases, type DocCase } from "../docs/registry";
const cases: DocCase[] = [];
const snapshots: any[] = [];
function doc(id: string, statement: string, run: DocCase["run"]) {
  cases.push({ id: "08/boundary-render-" + id, file: "08-dev-diagnostics.md", statement, run });
}
async function records(run: () => unknown | Promise<unknown>, listenBoundary = true) {
  const boundary: any[] = [],
    render: any[] = [];
  const offB = listenBoundary
    ? OBSERVE?.records.subscribe("boundary", (event, live) => boundary.push({ event, live }))
    : undefined;
  const offR = OBSERVE?.records.subscribe("render", (event, live) => render.push({ event, live }));
  try {
    await run();
    await new Promise((r) => setTimeout(r, 5));
    snapshots.push({ boundary, render });
    return { boundary, render };
  } finally {
    offB?.();
    offR?.();
  }
}
function consumed(stream: ReturnType<typeof renderToStream>) {
  return new Promise<void>((resolve) => stream.pipe({ write() {}, end: resolve }));
}
function measure(event: any) {
  ok(typeof event.at === "number");
  ok(event.durationMs >= 0);
  ok(event.at <= performance.now());
}
function AsyncPart(props: { promise: Promise<string>; deferStream?: boolean }) {
  const value = createMemo(() => props.promise, { deferStream: props.deferStream });
  return <b>{value()}</b>;
}
doc(
  "sync-silent",
  "A first-pass ready Loading boundary emits no boundary wait record, while its string render ends complete.",
  async () => {
    const result = await records(() =>
      renderToString(() => (
        <Loading fallback="loading">
          <b>ready</b>
        </Loading>
      )),
    );
    equal(result.boundary, []);
    equal(result.render.length, OBSERVE ? 1 : 0);
    if (OBSERVE) {
      const e = result.render[0].event;
      equal(e.mode, "string");
      equal(e.outcome, "complete");
      equal(e.boundaries, 0);
      measure(e);
      ok(e.shellMs >= 0);
      equal(result.render[0].live.event, undefined);
      ok(result.render[0].live.trace);
    }
  },
);
doc(
  "one-wait",
  "One asynchronous streamed boundary has passes:2, settled outcome, streamed:true and zero heldMs.",
  async () => {
    const result = await records(async () => {
      await consumed(
        renderToStream(() => (
          <Loading fallback="loading">
            <AsyncPart promise={new Promise((r) => setTimeout(() => r("ready"), 10))} />
          </Loading>
        )),
      );
    });
    equal(result.boundary.length, OBSERVE ? 1 : 0);
    equal(result.render.length, OBSERVE ? 1 : 0);
    if (OBSERVE) {
      const e = result.boundary[0].event;
      measure(e);
      equal(e.passes, 2);
      equal(e.outcome, "settled");
      equal(e.streamed, true);
      equal(e.heldMs, 0);
      ok(e.id);
      const r = result.render[0].event;
      equal(r.mode, "stream");
      equal(r.outcome, "complete");
      equal(r.boundaries, 0);
      ok(r.durationMs >= r.shellMs);
    }
  },
);
doc(
  "string-fallback",
  "A renderToString async boundary ships fallback final, records outcome:fallback and cannot stream.",
  async () => {
    const pending = new Promise<string>(() => {});
    const result = await records(() => {
      const html = renderToString(() => (
        <Loading fallback="final-fallback">
          <AsyncPart promise={pending} />
        </Loading>
      ));
      ok(html.includes("final-fallback"));
    });
    equal(result.boundary.length, OBSERVE ? 1 : 0);
    if (OBSERVE) {
      const e = result.boundary[0].event;
      equal(e.outcome, "fallback");
      equal(e.streamed, false);
      measure(e);
      equal(result.render[0].event.outcome, "complete");
      equal(result.render[0].event.boundaries, 0);
    }
  },
);
doc(
  "client-outcome",
  "ssrSource:client makes a waited boundary yield its content to the client and records outcome:client.",
  async () => {
    function ClientPart() {
      const value = createMemo(() => Promise.resolve("client"), { ssrSource: "client" });
      return <b>{value()}</b>;
    }
    const result = await records(async () => {
      await renderToStream(() => (
        <Loading fallback="client-fallback">
          <ClientPart />
        </Loading>
      ));
    });
    equal(result.boundary.length, OBSERVE ? 1 : 0);
    if (OBSERVE) {
      const e = result.boundary[0].event;
      equal(e.outcome, "client");
      measure(e);
      equal(e.heldMs, 0);
    }
  },
);
doc(
  "error-original",
  "A rejected boundary records outcome:error and carries the original thrown value as live.error.",
  async () => {
    const original = new Error("boundary rejection");
    const reports: any[] = [];
    const result = await records(async () => {
      await renderToStream(
        () => (
          <Loading fallback="loading">
            <AsyncPart
              promise={new Promise((_r, reject) => setTimeout(() => reject(original), 5))}
            />
          </Loading>
        ),
        { onError: (error, site) => reports.push({ error, site }) },
      );
    });
    equal(result.boundary.length, OBSERVE ? 1 : 0);
    if (OBSERVE) {
      const e = result.boundary[0].event;
      equal(e.outcome, "error");
      equal(result.boundary[0].live.error, original);
      equal(e.id, reports[0].site.boundary);
      measure(e);
    }
    equal(reports[0].error, original);
  },
);
doc(
  "reveal-held",
  "Reveal together names revealGroup and measures finished content held behind its slower sibling.",
  async () => {
    const result = await records(async () => {
      await renderToStream(() => (
        <Reveal order="together">
          <Loading fallback="a">
            <AsyncPart promise={new Promise((r) => setTimeout(() => r("a"), 5))} />
          </Loading>
          <Loading fallback="b">
            <AsyncPart promise={new Promise((r) => setTimeout(() => r("b"), 40))} />
          </Loading>
        </Reveal>
      ));
    });
    equal(result.boundary.length, OBSERVE ? 2 : 0);
    if (OBSERVE) {
      const events = result.boundary.map((v) => v.event);
      for (const e of events) {
        equal(e.outcome, "settled");
        ok(e.revealGroup);
        measure(e);
      }
      equal(events[0].revealGroup, events[1].revealGroup);
      ok(events.some((e) => e.heldMs > 10));
    }
  },
);
doc(
  "shell-waited",
  "Only deferStream boundaries count toward render.boundaries, and their record says streamed:false.",
  async () => {
    const result = await records(async () => {
      await consumed(
        renderToStream(() => (
          <Loading fallback="loading">
            <AsyncPart promise={Promise.resolve("ready")} deferStream />
          </Loading>
        )),
      );
    });
    equal(result.boundary.length, OBSERVE ? 1 : 0);
    if (OBSERVE) {
      equal(result.boundary[0].event.streamed, false);
      equal(result.render[0].event.boundaries, 1);
    }
  },
);
doc(
  "render-only-count",
  "Observe render boundaries require a boundary listener; a render listener alone sees zero.",
  async () => {
    const result = await records(async () => {
      await consumed(
        renderToStream(() => (
          <Loading fallback="loading">
            <AsyncPart promise={Promise.resolve("ready")} deferStream />
          </Loading>
        )),
      );
    }, false);
    equal(result.boundary, []);
    if (OBSERVE) equal(result.render[0].event.boundaries, isDev ? 1 : 0);
  },
);
doc(
  "render-initial-failed",
  "A string render throwing before its shell records error outcome and no shellMs, while the caller gets its original throw.",
  async () => {
    const original = new Error("initial failed");
    let thrown: unknown;
    const result = await records(() => {
      try {
        renderToString(
          () => {
            throw original;
          },
          { onError() {} },
        );
      } catch (error) {
        thrown = error;
      }
    });
    equal(thrown, original);
    equal(result.render.length, OBSERVE ? 1 : 0);
    if (OBSERVE) {
      const e = result.render[0].event;
      equal(e.outcome, "error");
      equal(e.shellMs, undefined);
      measure(e);
    }
  },
);
doc(
  "render-abandoned",
  "A consumer cancelling after shell yields one render record with outcome:abandoned and shell timing.",
  async () => {
    const result = await records(async () => {
      const stream = renderToStream(() => (
        <Loading fallback="loading">
          <AsyncPart promise={new Promise(() => {})} />
        </Loading>
      ));
      const reader = stream.readable.getReader();
      await reader.read();
      await reader.cancel();
    });
    equal(result.render.length, OBSERVE ? 1 : 0);
    if (OBSERVE) {
      const e = result.render[0].event;
      equal(e.outcome, "abandoned");
      ok(e.shellMs >= 0);
      measure(e);
    }
  },
);
doc(
  "unobserved-clocks",
  "An unobserved render and its Loading wait take no performance clock readings in observe/production.",
  async () => {
    let clocks = 0;
    const original = performance.now;
    Object.defineProperty(performance, "now", {
      configurable: true,
      value: () => {
        clocks++;
        return original.call(performance);
      },
    });
    try {
      await consumed(
        renderToStream(() => (
          <Loading fallback="pending">
            <AsyncPart promise={Promise.resolve("settled")} />
          </Loading>
        )),
      );
      if (!isDev) equal(clocks, 0);
      else ok(clocks > 0);
    } finally {
      Object.defineProperty(performance, "now", { configurable: true, value: original });
    }
  },
);
export const run = () => runCases(cases);
export const evidence = snapshots;
