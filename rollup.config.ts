import chalk from "chalk";
import glob from "glob";
import path, { resolve } from "path";
import { OutputOptions, rollup, RollupOptions } from "rollup";
// @ts-ignore
import rollupBabel from "rollup-plugin-babel";
import dts from "rollup-plugin-dts";
import nodeResolve from "@rollup/plugin-node-resolve";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require(path.join(process.cwd(), "package.json"));

if (pkg.ts) {
  (async () => {
    const rootNodeModules = path.resolve(__dirname, "node_modules");
    const localNodeModules = path.resolve(process.cwd(), "node_modules");

    const external = [
      // @ts-ignore
      ...Object.keys(process.binding("natives")),
      ...getPkgPaths("@babel/runtime", rootNodeModules),
      ...[...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})].reduce(
        (results: string[], pkgName: string) => {
          return [
            ...results,
            pkgName,
            ...getPkgPaths(pkgName, rootNodeModules),
            ...getPkgPaths(pkgName, localNodeModules),
          ];
        },
        [],
      ),
    ];

    const opts: Array<RollupOptions> = [
      {
        output: [
          {
            file: pkg.main,
            format: "cjs",
          },
          {
            file: pkg.module,
            format: "es",
          },
        ],
        input: pkg.ts,
        external: external,
        plugins: [
          nodeResolve({
            extensions: [".ts", ".tsx", ".js", ".jsx"],
          }),
          rollupBabel({
            babelrc: false,
            exclude: "node_modules/**",
            runtimeHelpers: true,
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            presets: [
              [
                "@babel/preset-env",
                pkg.babelPresetEnv || {
                  targets: {
                    chrome: 50,
                    ie: 11,
                    esmodules: true,
                  },
                },
              ],
              "@querycap/babel-preset",
            ],
          }),
        ],
      },
      // for d.ts
      {
        input: path.join(
          __dirname,
          process
            .cwd()
            .replace(__dirname, "")
            .replace("@reactorx", ".tmp/@reactorx"),
          "src/index.d.ts",
        ),
        external: external,
        output: [
          {
            file: pkg.types,
            format: "es",
          },
        ],
        plugins: [dts()],
      },
    ];

    const mod = path.relative(__dirname, process.cwd());

    console.log(chalk.yellow("bundling", mod));

    const files = await Promise.all(
      opts.map((o) =>
        rollup(o).then((bundle) => {
          return Promise.all(
            ([] as OutputOptions[]).concat(o.output!).map((output) => {
              return bundle.write(output).then(() => output.file);
            }),
          );
        }),
      ),
    );

    files.flat().forEach((file) => {
      console.log(chalk.green("bundled", mod, file));
    });
  })();
}

function getPkgPaths(from: string, nodeModules: string) {
  const cwd = resolve(nodeModules, from);

  return glob
    .sync("**/*.js", {
      absolute: true,
      cwd,
    })
    .map((p) =>
      path
        .relative(nodeModules, p)
        .replace(/.js$/, "")
        .replace(/\/index$/, ""),
    );
}
