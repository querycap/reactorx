import path from "path";
import { rollup } from "rollup";
import dts from "rollup-plugin-dts";
import { existsSync, writeFileSync } from "fs";
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

    writeFileSync(
      path.join(process.cwd(), "package.json"),
      JSON.stringify(
        {
          name: pkg.name,
          version: pkg.version,
          types: dtsIndex,
          ...pkg,
        },
        null,
        2,
      ),
    );
  })().catch((e) => {
    console.error(`${pkg.name}`, e);
    throw e;
  });
}
