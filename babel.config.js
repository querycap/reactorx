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
    "@querycap/babel-preset"
  ]
});
