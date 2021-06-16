const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const baseConfig = {
  target: "node",
  entry: "./src/index.js",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    library: "salesforceWebhooks",
    libraryTarget: "umd",
    globalObject: "this",
  },
  resolve: {
    alias: {
      handlebars: "handlebars/runtime.js",
    },
  },
  module: {
    rules: [
      {
        test: /\.handlebars$/,
        loader: "handlebars-loader",
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
};

const productionConfig = {
  devtool: "hidden-source-map",
  optimization: {
    minimize: true,
    moduleIds: "size",
    removeAvailableModules: true,
  },
};

const developmentConfig = {
  devtool: "eval-source-map",
  optimization: {
    moduleIds: "named",
  },
};

module.exports = (_, argv) => {
  const { mode = "production" } = argv;

  if (mode === "production") {
    return {
      ...baseConfig,
      ...productionConfig,
    };
  }

  if (mode === "development") {
    return {
      ...baseConfig,
      ...developmentConfig,
    };
  }
};
