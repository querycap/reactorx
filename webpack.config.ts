import HtmlWebpackPlugin from "html-webpack-plugin";
import { toLower } from "lodash";
import path from "path";
import { Configuration, DefinePlugin, LoaderOptionsPlugin, optimize } from "webpack";
import TerserPlugin from "terser-webpack-plugin";

const {
  AggressiveMergingPlugin,
  ModuleConcatenationPlugin,
} = optimize;

const getEnv = () => toLower(process.env.NODE_ENV || "development");
const inDev = getEnv() !== "production";

const webpackConfig: Configuration = {
  context: path.join(process.cwd(), "docs"),
  entry: {
    app: "./index.ts",
  },
  output: {
    path: path.join(process.cwd(), "public", `/__built__/`),
    publicPath: `/__built__/`,
    chunkFilename: "[name].[chunkhash].js",
    filename: "[name].[hash].js",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: [
      process.cwd(),
      "node_modules",
    ],
    mainFields: ["browser", "jsnext:main", "module", "main"],
    alias: {
      lodash$: "lodash-es",
      // to make react use the same version
      "react$": path.join(process.cwd(), "node_modules", "react"),
      "react-dom$": path.join(process.cwd(), "node_modules", "react-dom"),
    },
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loaders: [
        {
          loader: "babel-loader",
          options: {
            plugins: ["babel-plugin-pure-calls-annotation"],
          },
        },
        {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            compilerOptions: {
              target: "es5",
              module: "es6",
              sourceMap: inDev,
            },
          },
        },
      ],
    }],
  },
  plugins: [
    new DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(getEnv()),
      },
    }),
    new HtmlWebpackPlugin({
      template: "./index.html",
      filename: "../index.html",
    }),
    ...(!inDev ? [
      new LoaderOptionsPlugin({
        minimize: true,
        debug: false,
      }),
      new ModuleConcatenationPlugin(),
      new AggressiveMergingPlugin({}),
    ] : []),
  ],
  mode: inDev ? "development" : "production",
  optimization: {
    minimize: !inDev,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        terserOptions: {
          compress: true,
          mangle: true,
          output: {
            comments: false,
          },
        },
        sourceMap: false,
      }),
    ],
    splitChunks: {
      name: true,
      cacheGroups: {
        vendors: {
          // no name for dynamic
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: "all",
          reuseExistingChunk: true,
        },
        common: {
          test: /[\\/]node_modules[\\/](react|redux|rxjs|lodash)/,
          chunks: "all",
        },
      },
    },
  },
};

module.exports = webpackConfig;
