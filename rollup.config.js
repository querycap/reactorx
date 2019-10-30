import path, { resolve } from "path";
import glob from "glob";
import rollupBabel from "rollup-plugin-babel";
import dts from "rollup-plugin-dts";
import nodeResolve from "rollup-plugin-node-resolve";

const rootNodeModules = path.resolve(__dirname, "node_modules");
const localNodeModules = path.resolve(process.cwd(), "node_modules");

const getPkgPaths = (from, nodeModules) => {
  const cwd = resolve(nodeModules, from);

  return glob.sync("**/*.js", {
    absolute: true,
    cwd,
  }).map((p) => path.relative(nodeModules, p).replace(/.js$/, ""));
};

const pkg = require(path.join(process.cwd(), "package.json"));

const external = [
  ...Object.keys(process.binding("natives")),
  ...getPkgPaths("@babel/runtime", rootNodeModules),
  ...[
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].reduce((results, pkgName) => {
    return [
      ...results,
      pkgName,
      ...getPkgPaths(pkgName, rootNodeModules),
      ...getPkgPaths(pkgName, localNodeModules),
    ];
  }, []),
];

module.exports = [
  {
    input: pkg.ts,
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
        ...require("./babel.config"),
        overrides: [
          {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    chrome: 50,
                    ie: 11,
                    esmodules: true,
                  },
                },
              ],
            ],
          },
        ],
      }),
    ],
  },
  {
    input: path.join(__dirname, process.cwd().replace(__dirname, "").replace("@reactorx", "tmp"), "src/index.d.ts"),
    output: [{
      file: pkg.types,
      format: "es",
    }],
    plugins: [dts()],
  },
];
