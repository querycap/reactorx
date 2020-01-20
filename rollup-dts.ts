import path from "path";
import { rollup } from "rollup";
import dts from "rollup-plugin-dts";
import { existsSync } from "fs";
import del from "del";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require(path.join(process.cwd(), "package.json"));

const dtsIndex = pkg.main.replace(".js", ".d.ts");

if (existsSync(dtsIndex)) {
  (async () => {
    const bundle = await rollup({
      input: dtsIndex,
      plugins: [dts()],
    });

    await bundle.write({
      file: dtsIndex,
      format: "es",
    });

    del.sync(path.join(process.cwd(), "dist/declarations"));
  })().catch((e) => {
    console.error(`${pkg.name}`, e);
    throw e;
  });
}
