import { monobuild } from "@querycap-dev/monobundle";

(async () => {
  await monobuild(__dirname, (pkg) => ({
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
      "@querycap-dev/babel-preset",
    ],
  }));
})();
