const webpack = require("webpack");
const path = require("path");

module.exports = {
  mode: "production",
  context: path.resolve(__dirname, "."),
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "lib"),
    filename: "index.js"
  },
  // This is necessary due to the fact that emscripten puts both Node and web
  // code into one file. The node part uses Node’s `fs` module to load the wasm
  // file.
  // Issue: https://github.com/kripken/emscripten/issues/6542.
  node: {
    fs: "empty" 
  },
  mode: "development",
  module: {
    rules: [
      // Emscripten JS files define a global. With `exports-loader` we can 
      // load these files correctly (provided the global’s name is the same
      // as the file name).
      {
        test: /jsgeoda\.js$/,
        loader: "exports-loader"
      },
      // wasm files should not be processed but just be emitted and we want
      // to have their public URL. 
      // Note: currently the wasm is converted to arraybuffer and inserted
      // into the index.js
      {
        test: /jsgeoda\.wasm$/,
        type: "javascript/auto",
        loader: "file-loader",
        options: {
          //publicPath: "dist/"
          name: "jsgeoda.wasm"
        }
      }
    ]
  },
};