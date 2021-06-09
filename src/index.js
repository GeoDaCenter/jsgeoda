// load webassembly
// https://gist.github.com/surma/b2705b6cca29357ebea1c9e6e15684cc
import jsgeoda from './jsgeoda';
import GeoDaWasm from './geoda-proxy';

// jsgeoda_wasm is a global variable that caches the return from
// initialization of libgeoda WASM module
// var jsgeoda_wasm = null;

/**
 * Create a `GeoDaWasm` instance built using WASM.
 *
 * @example
 * const jsgeoda = require('jsgeoda')
 * let geoda = await jsgeoda.New()
 *
 * @returns {Object} geoda - a GeoDaWasm instance built from WASM
 */
function New() {
  return new Promise((resolve) => {
    jsgeoda().then((wasm) => {
      // jsgeoda_wasm = wasm;
      const geoda = new GeoDaWasm(wasm);
      resolve(geoda);
    });
  });
}

exports.New = New;
