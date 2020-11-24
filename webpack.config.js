const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  target: 'node',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'salesforceWebhooks',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    alias: {
      handlebars: 'handlebars/runtime.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.handlebars$/,
        loader: 'handlebars-loader',
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  optimization: {
    minimize: true,
  },
};
