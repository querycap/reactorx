module.exports = ({
  presets: [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current",
        },
      },
    ],
  ],
  plugins: [
    "@babel/plugin-transform-runtime",
    "babel-plugin-typescript-iife-enum",
    ["@babel/plugin-transform-typescript", { isTSX: true }],
    "@babel/plugin-transform-react-jsx",
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "babel-plugin-pure-calls-annotation",
  ],
});
