import { test, expect } from "bun:test";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
for (const variant of ["development", "observe", "production"] as BuildMode[])
  test("RFC08 boundary and render timing record contracts " + variant, async () => {
    const dir = resolve(".build", "boundary-records-" + process.pid + "-" + variant);
    try {
      await build(dir, variant, { client: [], server: ["tracks/frames/boundary-records.tsx"] });
      // A first-pass stream throw (017) does not finish its render context;
      // isolate that real failure from later test files without removing it.
      const child=Bun.spawn([process.execPath,"-e",`const module=await import(${JSON.stringify(dir+"/boundary-records.js")});const results=await module.run();process.stdout.write(JSON.stringify({results,records:module.evidence}));`],{stdout:"pipe",stderr:"pipe"});
      const deadline=setTimeout(()=>child.kill(),10000);
      let payload:any;
      try{const [stdout,stderr,exit]=await Promise.all([new Response(child.stdout).text(),new Response(child.stderr).text(),child.exited]);if(exit!==0)throw new Error("boundary subprocess failed: "+exit+" "+stderr);payload=JSON.parse(stdout)}finally{clearTimeout(deadline)}
      const results=payload.results;
      await Bun.write(
        "artifacts/boundary-records-" + variant + ".json",
        JSON.stringify(payload, null, 2),
      );
      const failures=results.filter((r:any)=>r.error);
      const known=failures.filter((r:any)=>variant!=="production"&&r.id==="08/boundary-render-render-initial-failed-stream"&&r.error==="Error: Expected 1, received 0");
      // 017's sibling keeps its strict red oracle in renderrecord-repro.test.ts.
      expect(failures.filter((r:any)=>!known.includes(r))).toEqual([]);
      expect(known.length).toBeLessThanOrEqual(variant==="production"?0:1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
