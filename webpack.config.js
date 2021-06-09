// const webpack = require('webpack');
const path = require('path');
// const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  mode: 'production',
  context: path.resolve(__dirname, '.'),
  entry: {
    main: path.resolve(__dirname, './src/index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.js',
  },
  // This is necessary due to the fact that emscripten puts both Node and web
  // code into one file. The node part uses Node’s `fs` module to load the wasm
  // file.
  // Issue: https://github.com/kripken/emscripten/issues/6542.
  resolve: {
    fallback: {
      fs: false,
      path: require.resolve('path-browserify'),
    },
  },
};
