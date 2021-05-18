// load webassembly
// https://gist.github.com/surma/b2705b6cca29357ebea1c9e6e15684cc
import jsgeoda from './jsgeoda.js';
import GeoDaProxy from './geoda-proxy.js';

// jsgeoda_wasm is a global variable that caches the return from 
// initialization of libgeoda WASM module
var jsgeoda_wasm = null;

function New() {
  return new Promise((res, rej) => {
    jsgeoda().then(wasm=>{
      jsgeoda_wasm = wasm;
      let geoda_proxy = new GeoDaProxy.GeoDaProxy(wasm);
      res(geoda_proxy);
    });
  });
}

/**
 * Create a `GeoDaProxy` instance built using WASM.
 * 
 * @example
 * const jsgeoda = require('jsgeoda')
 * let geoda = await jsgeoda.New()
 * 
 * @returns {Object} geoda - a GeoDaProxy instance built from WASM
 */
exports.New = New;