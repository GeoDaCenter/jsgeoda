// author: lixun910@gmail.com
// date: 10/7/2020 version 0.0.4
// date: 5/14/2021 version 0.0.8

import GeoDaLisa from './geoda-lisa.js';

/**
 * Use jsgeoda.New() to get an instance of GeoDaWasm. See New() {@link New}
 * @see New
 * @class
 * @classdesc GeoDaWasm is a class that wraps all the APIs of libgeoda WASM.
 * Always use jsgeoda.{@link New}() to get an instance of GeoDaWasm.
 */
export default class GeoDaWasm {

  /**
   * Should not be called directy. 
   * Always use jsgeoda.New() to get an instance of GeoDaWasm.
   * @constructs GeoDaWasm 
   * @param {Object} wasm The object of libgeoda WASM  
   */
  constructor(wasm) {
    this.version = '0.0.8';
    this.wasm = wasm;
    this.geojson_maps = {};
  }

  /**
   * Help function: create a unique id for a Geojson map 
   * @returns {String}
   */
  generate_uid() {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (let i = 0; i < 12; i++) {
      result.push(characters.charAt(Math.floor(Math.random() *  charactersLength)));
    }
    return "map-" + result.join('');
  }

  //   
  /**
   * Read a geojson map from a file object in the format of ArrayBuffer.
   * You can use {@link readFileSync} in fs to read the geojson file and return a {@link ArrayBuffer};
   * Or use FileReader.{@link readAsArrayBuffer} to read the content of a specified {@link Blob} of {@link File}.
   * @example
   * // In node.js
   * const fs = require('fs');
   * const jsgeoda = require('jsgeoda');
   * const geoda = await jsgeoda.New();
   * 
   * let ab = fs.readFileSync("NAT.geojson").buffer;
   * let nat = geoda.read_geojson(ab);
   * let num_obs = geoda.get_numobs(nat);
   * 
   * @param {String} map_uid A unique string that represent the geojson map. E.g. the geojson file name.
   * @param {ArrayBuffer} ab The content of the geojson file in format of ArrayBuffer.
   * @returns {String} A unique id of the geoda object.
   */
  read_geojson(ab) {
    const map_uid = this.generate_uid();

    //evt.target.result is an ArrayBuffer. In js, 
    const uint8_t_arr = new Uint8Array(ab);
    //First we need to allocate the wasm memory. 
    const uint8_t_ptr = this.wasm._malloc(uint8_t_arr.length);
    //Now that we have a block of memory we can copy the file data into that block
    this.wasm.HEAPU8.set(uint8_t_arr, uint8_t_ptr);
    // pass the address of the this.wasm memory we just allocated to our function
    this.wasm.new_geojsonmap(map_uid, uint8_t_ptr, uint8_t_arr.length);
    //this.wasm.ccall("new_geojsonmap", null, ["string", "number", "number"], [map_uid, uint8_t_ptr, uint8_t_arr.length]);

    //Lastly, according to the docs, we should call ._free here.
    this.wasm._free(uint8_t_ptr);

    // store the map and map type
    let map_type = this.wasm.get_map_type(map_uid);
    this.geojson_maps[map_uid] = map_type;

    return map_uid;
  }

  /**
   * Get map type
   * @param {String} map_uid 
   * @returns 
   */
  get_map_type(map_uid) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }
    return this.geojson_maps[map_uid];
  }

  /**
   * Deprecated!! Read from shapefile: .shp/.dbf/.shx
   * @param {String} map_uid 
   * @param {ArrayBuffer} data 
   * @returns {String}
   */
  read_shapefile(map_uid, data) {
    const uint8_t_shp = new Uint8Array(data.shp);
    const uint8_t_dbf = new Uint8Array(data.dbf);
    const uint8_t_shx = new Uint8Array(data.shx);
    // canread, canwrite, canown
    this.wasm.FS_createDataFile('/', map_uid + '.shp', uint8_t_shp, true, true, true);
    this.wasm.FS_createDataFile('/', map_uid + '.dbf', uint8_t_dbf, true, true, true);
    this.wasm.FS_createDataFile('/', map_uid + '.shx', uint8_t_shx, true, true, true);
    this.wasm.new_shapefilemap(map_uid);
    return map_uid;
  }

  /**
   * Check if a geojson map has been read into GeoDaWasm.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @returns {Boolean} Returns True if the geojson map has been read. Otherwise, returns False.
   */
  has(map_uid) {
    return map_uid in this.geojson_maps;
  }

  /**
   * Free the memory used by wasm
   */
  free() {
    this.wasm.free_geojsonmap();
  }

  /**
   * Get map bounds
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @returns {Array}
   */
  get_bounds(map_uid) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }
    const bounds = this.wasm.get_bounds(map_uid);
    return this.parseVecDouble(bounds);
  }

  /**
   * Get viewport for e.g. Deck.gl or GoogleMaps
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Number} map_height 
   * @param {Number} map_width 
   * @returns {Object}
   */
  get_viewport(map_uid, map_height, map_width) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }

    const bounds = this.get_bounds(map_uid);

    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 21;

    function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    const ne = {'lng': bounds[1], 'lat' : bounds[2] };//.getNorthEast();
    const sw = {'lng': bounds[0], 'lat': bounds[3]};//.getSouthWest();

    const latFraction = Math.abs(latRad(ne.lat) - latRad(sw.lat)) / Math.PI;

    const lngDiff = ne.lng - sw.lng;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const map_dim = Math.min(map_height, map_width);
    const latZoom = zoom(map_dim, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(map_dim, WORLD_DIM.width, lngFraction);

    const z = Math.min(latZoom, lngZoom, ZOOM_MAX);

    return {
      'longitude': (bounds[0]  + bounds[1])/2.0,
      'latitude': (bounds[2] + bounds[3]) /2.0,
      'zoom': z -1
    }
  }

  /**
   * Get the centroids of geojson map.
   * Same as GEOS.algorithm.Centroid: the centroid were computed as a weighted sum of the centroids of a decomposition of the area 
   * into (possibly overlapping) triangles. The algorithm has been extended to handle holes and multi-polygons
   * @example
   * // In node.js
   * const fs = require('fs');
   * const jsgeoda = require('jsgeoda');
   * const geoda = await jsgeoda.New();
   * 
   * let ab = fs.readFileSync("NAT.geojson").buffer;
   * let nat = geoda.read_geojson("NAT", ab);
   * let cent = geoda.get_centroids(nat);
   * 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @returns {Array} Returns an array of [x,y] coordinates (no projection applied) of the centroids.
   */
  get_centroids(map_uid) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }
    let cc = this.wasm.get_centroids(map_uid);
    let xx = cc.get_x();
    let yy = cc.get_y();
    var centroids = [];
    for (let i = 0; i < xx.size(); ++i) {
      centroids.push([xx.get(i), yy.get(i)]);
    }
    return centroids;
  }

  /**
   * Get the number of observations or rows in the geojson map.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @returns {Number} Returns the number of observations or rows in the geojson map.
   */
  get_numobs(map_uid) {
    let n = this.wasm.get_num_obs(map_uid);
    return n;
  }

  /**
   * 
   * @param {String} map_uid  A unique string represents the geojson map that has been read into GeoDaWasm.
   * @returns Returns the map type of the geojson map
   */
  get_maptype(map_uid) {
    return this.geojson_maps[map_uid];
  }

  /**
   * Get the column names of the geojson map
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @returns {Array} Returns the column names
   */
  get_colnames(map_uid) {
    const names = this.wasm.get_col_names(map_uid);
    return this.parseVecString(names);
  }

  /**
   * Get the values (numeric|string) of a column or field. 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {String} col_name A string of column or field name.
   * @returns {Array} Returns the values of a column of field. 
   */
  get_col(map_uid, col_name) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }

    const is_numeric = this.wasm.is_numeric_col;
    if (is_numeric) {
      const vals = this.wasm.get_numeric_col(map_uid, col_name);
      return this.parseVecDouble(vals); 
    } else {
      const vals = this.wasm.get_string_col(map_uid, col_name);
      return this.parseVecString(vals); 
    }
  }

  

  /**
   * Create a Rook contiguity weights.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} include_lower_order Indicate if include lower order when creating weights
   * @param {Number} precision_threshold Used when the precision of the underlying shape file is insufficient to allow for an exact match of coordinates to determine which polygons are neighbors. 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  rook_weights(map_uid, order, include_lower_order, precision_threshold) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }
    if (order == null) order = 1;
    if (include_lower_order == null) include_lower_order = false;
    if (precision == null) precision = 0.0;

    let w_uid = this.wasm.rook_weights(map_uid, order, include_lower_order, precision_threshold);
    return w_uid;
  }

  /**
   * Create a contiguity weights.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} include_lower_order Indicate if include lower order when creating weights
   * @param {Number} precision_threshold Used when the precision of the underlying shape file is insufficient to allow for an exact match of coordinates to determine which polygons are neighbors. 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  queen_weights(map_uid, order, include_lower_order, precision) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }
    if (order == null) order = 1;
    if (include_lower_order == null) include_lower_order = false;
    if (precision == null) precision = 0.0;

    let w_uid = this.wasm.queen_weights(map_uid, order, include_lower_order, precision);
    return w_uid;
  }

  /**
   * Get a distance that guarantees that every observation has at least 1 neighbor.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  min_distthreshold(map_uid, is_arc, is_mile) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }
    if (is_arc == null) is_arc = false;
    if (is_mile == null) is_mile = true;

    let val = this.wasm.min_distance_threshold(map_uid, is_arc, is_mile);
    return val;
  }

  /**
   * Create a K-Nearest Neighbors weights.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Number} k A positive integer number for k-nearest neighbors
   * @param {Number} power  The power (or exponent) indicates how many times to use the number in a multiplication.
   * @param {Boolean} is_inverse A bool flag indicates whether or not to apply inverse on distance value.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  knn_weights(map_uid, k, power, is_inverse, is_arc, is_mile) {
    if (!this.has(map_uid)) {
      console.log("map_uid is not recognized: ", map_uid);
      return;
    }
    if (power == null) power = 1.0;
    if (is_inverse == null) is_inverse = false;
    if (is_arc == null) is_arc = false;
    if (is_mile == null) is_mile = true;

    let w = this.wasm.knn_weights(map_uid, k, power, is_inverse, is_arc, is_mile);
    return w;
  }

  /**
   * Create a Distance-based weights.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Number} dist_thres A positive numeric value of distance threshold used to find neighbors. 
   * @param {Number} power  The power (or exponent) indicates how many times to use the number in a multiplication.
   * @param {Boolean} is_inverse A bool flag indicates whether or not to apply inverse on distance value.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  distance_weights(map_uid, dist_thres, power, is_inverse, is_arc, is_mile) {
    if (power == null) power = 1.0;
    if (is_inverse == null) is_inverse = false;
    if (is_arc == null) is_arc = false;
    if (is_mile == null) is_mile = true;

    let w = this.wasm.dist_weights(map_uid, dist_thres, power, is_inverse, is_arc, is_mile);
    return w;
  }

  /**
   * Create a (adaptive) KNN kernel weights.
   * 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Number} k A positive integer number for k-nearest neighbors
   * @param {String} kernel The name of the kernel function, which could be one of the following: * triangular * uniform * quadratic * epanechnikov * quartic * gaussian
   * @param {Boolean} adaptive_bandwidth A bool flag indicates whether to use adaptive bandwidth or the max distance of all observation to their k-nearest neighbors. 
   * @param {Boolean} use_kernel_diagonals A bool flag indicates whether or not the lower order neighbors should be included in the weights structure.
   * @param {Number} power  The power (or exponent) indicates how many times to use the number in a multiplication.
   * @param {Boolean} is_inverse A bool flag indicates whether or not to apply inverse on distance value.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  kernel_knn_weights(map_uid, k, kernel, adaptive_bandwidth, use_kernel_diagonals, power, is_inverse, is_arc, is_mile) {
    if (!(kernel in  {'triangular':true, 'uniform':true, 'epanechnikov':true, 'quartic':true, 'gaussian':true})) {
      console.log("kernel has to be one of  {'triangular', 'uniform', 'epanechnikov', 'quartic', 'gaussian'}");
      return null;
    }
    if (use_kernel_diagonals == null) use_kernel_diagonals = false;
    if (power == null) power = 1.0;
    if (is_inverse == null) is_inverse = false;
    if (is_arc == null) is_arc = false;
    if (is_mile == null) is_mile = true;

    let w = this.wasm.kernel_weights(map_uid, k, kernel, adaptive_bandwidth, use_kernel_diagonals, power, is_inverse, is_arc, is_mile);
    return w;
  }

  /**
   * 
   * Create a kernel weights with fixed bandwidth.
   * 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Number} bandwidth The bandwidth (distance threshold).
   * @param {String} kernel The name of the kernel function, which could be one of the following: * triangular * uniform * quadratic * epanechnikov * quartic * gaussian
   * @param {Boolean} adaptive_bandwidth A bool flag indicates whether to use adaptive bandwidth or the max distance of all observation to their k-nearest neighbors. 
   * @param {Boolean} use_kernel_diagonals A bool flag indicates whether or not the lower order neighbors should be included in the weights structure.
   * @param {Number} power  The power (or exponent) indicates how many times to use the number in a multiplication.
   * @param {Boolean} is_inverse A bool flag indicates whether or not to apply inverse on distance value.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights} 
   */
  kernel_weights(map_uid, bandwidth, kernel, use_kernel_diagonals, power, is_inverse, is_arc, is_mile) {
    if (!(kernel in  {'triangular':true, 'uniform':true, 'epanechnikov':true, 'quartic':true, 'gaussian':true})) {
      console.log("kernel has to be one of  {'triangular', 'uniform', 'epanechnikov', 'quartic', 'gaussian'}");
      return null;
    }
    if (use_kernel_diagonals == null) use_kernel_diagonals = false;
    if (power == null) power = 1.0;
    if (is_inverse == null) is_inverse = false;
    if (is_arc == null) is_arc = false;
    if (is_mile == null) is_mile = true;

    let w = this.wasm.kernel_bandwidth_weights(map_uid, bandwidth, kernel, use_kernel_diagonals, power, is_inverse, is_arc, is_mile);
    return w;
  }

  /**
   * Get neighbors (indices) of an observation.
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Number} idx An integer number represents the index of which observation to get its neighbors.
   * @returns {Array} The indices of neighbors.
   */
  get_neighbors(weights, idx) {
    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    
    let nbrs = this.wasm.get_neighbors(map_uid, w_uid, idx);
    return this.parseVecInt(nbrs);
  }

  /**
   * Get connectivity graph from a weights object
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @returns {Object} {arcs, targets, sources}
   */
  get_connectivity(weights) {
    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();

    const centroids = this.get_centroids(map_uid);
    const numobs = this.get_numobs(map_uid);
    const arcs = [];
    const targets = [];
    const sources = [];

    for (let i=0; i<numobs; ++i) {
      const nbrs = this.get_neighbors(weights, i);
      for (let j=0; j<nbrs.length; ++j) {
        const nn = nbrs[j];
        // add point at arc source
        sources.push({
          position: centroids[nn],
          target: centroids[i],
          name: String(j),
          radius: 1,
          gain: 0
        });
        // add arc
        arcs.push({
          target: centroids[i],
          source: centroids[nn],
          value: 3
        })
      }
      // add point at arc target
      targets.push({
        position: centroids[i],
        name: String(i),
      });
    }
    return {arcs, targets, sources};
  }

  /**
   * Help function: check if number is an integer.
   *  
   * @param {Number} n 
   * @returns {Boolean}
   */
  isInt(n) {
    return Number(n) === n && n % 1 === 0;
  }
  
  /**
   * Help function: convert GeoDa std::vector to javascript Array e.g. []
   * @param {Array} input 
   * @returns {Object}
   */
  parseVecInt(vi) {
    let result = [];
    for (let j = 0; j < vi.size(); ++j) {
      result.push(vi.get(j));
    }
    return result;
  }

  /**
   * Help function: convert GeoDa 2d std::vector to javascript 2d Array e.g. [[]]
   * @param {Array} input 
   * @returns {Object}
   */
  parseVecVecInt(vvi) {
    let result = [];
    for (let i = 0; i < vvi.size(); ++i) {
      let sub = [];
      let vi = vvi.get(i);
      for (let j = 0; j < vi.size(); ++j) {
        sub.push(vi.get(j));
      }
      result.push(sub);
    }
    return result;
  }

  /**
   * Help function: convert GeoDa 2d std::vector to javascript 2d Array e.g. [[]]
   * @param {Array} input 
   * @returns {Object}
   */
  parseVecVecDouble(vvd) {
    let result = [];
    for (let i = 0; i < vvd.size(); ++i) {
      let sub = [];
      let vd = vvd.get(i);
      for (let j = 0; j < vd.size(); ++j) {
        sub.push(vd.get(j));
      }
      result.push(sub);
    }
    return result;
  }

  /**
   * Help function: convert GeoDa std::vector to javascript Array e.g. []
   * @param {Array} input 
   * @returns {Object}
   */
  parseVecDouble(vd) {
    let result = []
    for (let i = 0; i < vd.size(); ++i) {
      result.push(vd.get(i));
    }
    return result;
  }

  /**
   * Help function: convert GeoDa std::vector to javascript Array e.g. []
   * @param {Array} input 
   * @returns {Object}
   */
  parseVecString(vd) {
    let result = []
    for (let i = 0; i < vd.size(); ++i) {
      result.push(vd.get(i));
    }
    return result;
  }

  /**
   * Help function: convert javascript Array e.g. [] to GeoDa std::vector
   * @param {Array} input 
   * @returns {Object}
   */
  toVecString(input) {
    let vs = new this.wasm.VectorString();
    for (let i = 0; i < input.length; ++i) {
      vs.push_back(input[i]);
    }
    return vs;
  }

  /**
   * Help function: convert javascript Array e.g. [] to GeoDa std::vector
   * @param {Array} input 
   * @returns {Object}
   */
  toVecInt(input) {
    let vs = new this.wasm.VectorInt();
    for (let i = 0; i < input.length; ++i) {
      vs.push_back(input[i]);
    }
    return vs;
  }

  /**
   * Help function: convert javascript Array e.g. [] to GeoDa std::vector
   * @param {Array} input 
   * @returns {Object}
   */
  toVecDouble(input) {
    let vs = new this.wasm.VectorDouble();
    for (let i = 0; i < input.length; ++i) {
      if (isNaN(input[i]) || input[i] == Infinity)
        vs.push_back(0);
      else
        vs.push_back(input[i]);
    }
    return vs;
  }

  /**
   * Help function: convert javascript 2d Array e.g. [[]] to GeoDa 2d std::vector
   * @param {Array} input 
   * @returns {Object}
   */
  toVecVecDouble(input) {
    let vvs = new this.wasm.VecVecDouble();
    let iis = new this.wasm.VecVecInt();

    for (let i = 0; i < input.length; ++i) {
      let vs = new this.wasm.VectorDouble();
      let is = new this.wasm.VectorInt();

      for (let j=0; j < input[i].length; ++j) {
        if (isNaN(input[i][j]) || input[i][j] == Infinity) {
          vs.push_back(0);
          is.push_back(1);
        } else {
          vs.push_back(input[i][j]);
          is.push_back(0);
        }
      }
      vvs.push_back(vs);
      iis.push_back(is);
    }
    return {"values": vvs, "undefs": iis};
  }

  /**
   * Natural breaks
   *  
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  natural_breaks(k, values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.natural_breaks(k, this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

  /**
   * Quantile breaks
   *  
   * @param {Number} k The number of breaks
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  quantile_breaks(k, values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.quantile_breaks(k, this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

   /**
   * Percentile breaks
   * 
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  percentile_breaks(values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.percentile_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

   /**
   * Standard deviation breaks 
   * 
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  stddev_breaks(values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.stddev_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

  /**
   * Boxplot (hinge=1.5) breaks, including the top, bottom, median, and two quartiles of the data
   * 
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  hinge15_breaks(values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.hinge15_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

  /**
   * Boxplot (hinge=3.0) breaks, including the top, bottom, median, and two quartiles of the data
   * 
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  hinge30_breaks(values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.hinge30_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

  /**
   * Custom breaks that wraps {'natural_breaks', 'quantile_breaks', 'stddev_breaks', 'hinge15_breaks', 'hinge30_breaks'}
   * 
   * @param {String} break_name The break name: {'natural_breaks', 'quantile_breaks', 'stddev_breaks', 'hinge15_breaks', 'hinge30_breaks'}
   * @param {*} values The values of selected variable.
   * @param {*} k The number of breaks.
   * @returns {Object} {'k','bins','breaks','id_array'}
   */
  custom_breaks(break_name, values, k) {
    var breaks = []; 
    if (break_name === 'natural_breaks') {
      breaks = this.natural_breaks(k, values);
    } else if (break_name === 'quantile_breaks') {
      breaks = this.quantile_breaks(k, values);
    } else if (break_name === 'percentile_breaks') {
      breaks = this.percentile_breaks(values);
    } else if (break_name === 'stddev_breaks') {
      breaks = this.stddev_breaks(values);
    } else if (break_name === 'hinge15_breaks') {
      breaks = this.hinge15_breaks(values);
    } else if (break_name === 'hinge30_breaks') {
      breaks = this.hinge30_breaks(values);
    } else  {
      console.log("break name is not valid.");
      return;
    }
    var orig_breaks = breaks;

    let bins = [];
    let id_array = [];
    for (let i = 0; i < breaks.length; ++i) {
      id_array.push([]);
      let txt = this.isInt(breaks[i]) ? breaks[i] : breaks[i].toFixed(2);
      bins.push("" + txt);
    }
    id_array.push([]);
    let txt = breaks[breaks.length - 1];
    if (txt != undefined) {
      txt = this.isInt(txt) ? txt : txt.toFixed(2);
      bins.push(">" + txt);
    }

    breaks.unshift(Number.NEGATIVE_INFINITY);
    breaks.push(Number.POSITIVE_INFINITY);

    for (let i = 0; i < values.length; ++i) {
      let v = values[i];
      for (let j = 0; j < breaks.length - 1; ++j) {
        let min_val = breaks[j];
        let max_val = breaks[j + 1];
        if (v >= min_val && v < max_val) {
          id_array[j].push(i);
          break;
        }
      }
    }

    return {
      'k': k,
      'bins': bins,
      'breaks': orig_breaks,
      'id_array': id_array
    }
  }

  /**
   * Excess Risk
   * 
   * @param {Array} event_values The values of an event variable.
   * @param {Array} base_values  The values of an base variable.
   * @returns {Array}
   */
  excess_risk(event_values, base_values) {
    const r = this.wasm.excess_risk(this.toVecDouble(event_values), this.toVecDouble(base_values));
    return this.parseVecDouble(r);
  }

  /**
   * Empirical Bayes (EB) Smoothed Rate
   * 
   * @param {Array} event_values The values of an event variable.
   * @param {Array} base_values  The values of an base variable.
   * @returns {Array}
   */
  eb_risk(event_values, base_values) {
    const r = this.wasm.eb_risk(this.toVecDouble(event_values), this.toVecDouble(base_values));
    return this.parseVecDouble(r);
  }

  /**
   * Compute spatially lagged variable.
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values of a selected variable.
   * @param {Boolean} is_binary The bool value indicates if the spatial weights is used as binary weights. Default: TRUE.
   * @param {Boolean} row_standardize The bool value indicates if use row-standardized weights. Default: TRUE
   * @param {Bollean} include_diagonal The bool value indicates if include diagonal of spatial weights. Default: FALSE
   * @returns {Array}
   */
  spatial_lag(weights, values, is_binary, row_standardize, include_diagonal) {
    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecDouble(values);

    if (is_binary == null) is_binary = true;
    if (row_standardize == null) row_standardize = true;
    if (include_diagonal == null) include_diagonal = false;

    const r = this.wasm.spatial_lag(map_uid, w_uid, data, is_binary, row_standardize, include_diagonal);
    return this.parseVecDouble(r);
  }

  /**
   * Spatial rate smoothing
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} event_values The values of an event variable.
   * @param {Array} base_values  The values of an base variable.
   * @returns {Array}
   */
  spatial_rate(weights, event_values, base_values) {
    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();

    const r = this.wasm.spatial_rate(this.toVecDouble(event_values), this.toVecDouble(base_values), map_uid, w_uid);
    return this.parseVecDouble(r);
  }

  /**
   * Spatial Empirical Bayes (EB) Smoothing
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} event_values The values of an event variable.
   * @param {Array} base_values  The values of an base variable.
   * @returns {Array}
   */
  spatial_eb(weights, event_values, base_values) {
    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();

    const r = this.wasm.spatial_eb(this.toVecDouble(event_values), this.toVecDouble(base_values), map_uid, w_uid);
    return this.parseVecDouble(r);
  }

  /**
   * Create cartogram using the values in the map. 
   * In cartograms, the size of a variable's value corresponds to the size of a shape. 
   * The location of the circles is aligned as closely as possible to the location of the associated area through a nonlinear optimization routine
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of circles, which is defined as: 
   * {
   *    "properties": { "id" : 1},
   *    "position": [0.01, 0.01],
   *    "radius": 0.1
   * }
   */
  cartogram(map_uid, values) {
    let cart = this.wasm.cartogram(map_uid, this.toVecDouble(values));
    let x = cart.get_x();
    let y = cart.get_y();
    let r = cart.get_radius();
    // rescale x, y [-100,0], [0, 45]
    let min_x = x.get(0);
    let max_x = x.get(0);
    let min_y = y.get(0);
    let max_y = y.get(0);
    for (let i = 0; i < x.size(); ++i) {
      if (min_x > x.get(i)) min_x = x.get(i);
      if (max_x < x.get(i)) max_x = x.get(i);
      if (min_y > y.get(i)) min_y = y.get(i);
      if (max_y < y.get(i)) max_y = y.get(i);
    }
    let scale_x = 100.0 / (max_x - min_x);
    let scale_y = 45.0 / (max_y - min_y);


    var result = [];
    for (let i = 0; i < x.size(); ++i) {
      let xx = (x.get(i) - min_x) * scale_x;
      let yy = (y.get(i) - min_y) * scale_y;
      result.push({
        'properties': {
          'id': i
        },
        'position': [x.get(i) / 10000.0, y.get(i) / 10000.0],
        'radius': r.get(i)
      });
    }
    return result;
  }


  /**
   * Apply local Moran statistics 
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method the permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed he seed for random number generator used in LISA statistics. Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_moran(weights, values, permutations, permutation_method, significance_cutoff, seed) {
    return this.call_lisa("local_moran", weights, values, permutations, permutation_method, significance_cutoff, seed);
  }

  /**
   * Apply local G statistics 
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method the permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed he seed for random number generator used in LISA statistics. Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_g(weights, values, permutations, permutation_method, significance_cutoff, seed) {
    return this.call_lisa("local_g", weights, values, permutations, permutation_method, significance_cutoff, seed);
  }

  /**
   * Apply local G* statistics 
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method the permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed he seed for random number generator used in LISA statistics. Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_gstar(weights, values, permutations, permutation_method, significance_cutoff, seed) {
    return this.call_lisa("local_gstar", weights, values, permutations, permutation_method, significance_cutoff, seed);
  }
  /**
   * Apply local Geary statistics 
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method the permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed he seed for random number generator used in LISA statistics. Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_geary(weights, values, permutations, permutation_method, significance_cutoff, seed) {
    return this.call_lisa("local_geary", weights, values, permutations, permutation_method, significance_cutoff, seed);
  }
  /**
   * Apply local Join Count statistics 
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method the permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed he seed for random number generator used in LISA statistics. Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_joincount(weights, values, permutations, permutation_method, significance_cutoff, seed) {
    return this.call_lisa("local_joincount", weights, values, permutations, permutation_method, significance_cutoff, seed);
  }
  /**
   * Apply Quantile LISA statistics 
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method the permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed he seed for random number generator used in LISA statistics. Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  quantile_lisa(weights, k , quantile, values, permutations, permutation_method, significance_cutoff, seed) {
    const map_uid = weights.get_map_uid();
    const weight_uid = weights.get_uid();

    if (permutations == null) permutations = 999;
    if (permutation_method == null) permutation_method = "lookup";
    if (significance_cutoff == null) significance_cutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutation_method in {'lookup':true, 'complete':true})) {
      consolo.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const undefs = values.map( v => isNaN(v) );
    const undefs_b = this.toVecInt(undefs);
    const vals = this.toVecDouble(values);

    const lisa_obj = this.wasm.quantile_lisa(map_uid, weight_uid, k, quantile, vals, undefs_b, significance_cutoff, permutations, permutation_method, seed);
    return lisa_obj != null ? new GeoDaLisa(lisa_obj, this) : null;
  }

  /**
   * Helper function: apply LISA statistics 
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method the permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed he seed for random number generator used in LISA statistics. Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  call_lisa(lisa_function, weights, values, permutations, permutation_method, significance_cutoff, seed) {
    const map_uid = weights.get_map_uid();
    const weight_uid = weights.get_uid();

    if (permutations == null) permutations = 999;
    if (permutation_method == null) permutation_method = "lookup";
    if (significance_cutoff == null) significance_cutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutation_method in {'lookup':true, 'complete':true})) {
      consolo.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const undefs = values.map( v => isNaN(v) );
    const undefs_b = this.toVecInt(undefs);
    const vals = this.toVecDouble(values);

    let lisa_obj = null;
    if (lisa_function === 'local_moran') {
      lisa_obj = this.wasm.local_moran(map_uid, weight_uid, vals, undefs_b, significance_cutoff, permutations, permutation_method, seed);
    } else if  (lisa_function === 'local_g') {
      lisa_obj = this.wasm.local_g(map_uid, weight_uid, vals, undefs_b, significance_cutoff, permutations, permutation_method, seed);
    } else if  (lisa_function === 'local_gstar') {
      lisa_obj = this.wasm.local_gstar(map_uid, weight_uid, vals, undefs_b, significance_cutoff, permutations, permutation_method, seed);
    } else if  (lisa_function === 'local_geary') {
      lisa_obj = this.wasm.local_geary(map_uid, weight_uid, vals, undefs_b, significance_cutoff, permutations, permutation_method, seed);
    } else if  (lisa_function === 'local_joincount') {
      lisa_obj = this.wasm.local_joincount(map_uid, weight_uid, vals, undefs_b, significance_cutoff, permutations, permutation_method, seed);
    } else {
      console.log("lisa_function is not valid: ", lisa_function);
    }

    return lisa_obj != null ? new GeoDaLisa(lisa_obj, this) : null;
  }

  /**
   * Help function: Get scale methods.
   * 
   * @returns {Object}
   */
  scale_methods() {
    return {
      'raw':true, 
      'standardize':true, 
      'demean': true, 
      'mad': true, 
      'range_standardize': true, 
      'range_adjust': true
    }
  }

  /**
   * Help function: Get distance methods.
   * 
   * @returns {Object}
   */
  distance_methods() {
    return {
      'euclidean': true, 
      'manhattan': true
    }
  }
  /**
   * The local neighbor match test is a method to identify significant locations by assessing the extent of overlap between k-nearest neighbors in geographical space and k-nearest neighbors in multi-attribute space.
   * 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaWasm.
   * @param {Number} knn k nearest neighbor for both attribute and geographical space
   * @param {Array} data The array of numeric columns that contains the values for neighbor match test
   * @param {String} scale_method The scaling method:  {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'}. Default: 'standardize'
   * @param {String} distance_method The distance method: {'euclidean', 'manhattan'}. Default: 'euclidean'.
   * @param {Number} power The power/exponent corresponds to the number of times the base (dist_band) is used as a factor. Default: 1.
   * @param {Boolean} is_inverse The bool value indicates if apply inverse on distance value. Default: False.
   * @param {Boolean} is_arc The bool value indicates if compute arc distance between two observations. Default: FALSE.
   * @param {Boolean} is_mile The bool value indicates if convert distance unit from mile to kilometer(KM). Default: TRUE.
   * @returns {Array} {'cardinality', 'probability'}
   */
  neighbor_match_test(map_uid, knn, data, scale_method, distance_method, power, is_inverse, is_arc, is_mile) {
    if (scale_method == null) scale_method = 'standardize';
    const defined_scale_methods = this.scale_methods();
    if (!(scale_method in defined_scale_methods)) {
      console.log("The scaling method is not valid.");
      return null;
    }

    if (distance_method == null) distance_method = 'euclidean';
    const defined_dist_methods = this.distance_methods();
    if (!(distance_method in defined_dist_methods)) {
      console.log("The distance method is not valid.");
      return null;
    }
    if (power == null) power = 1.0;
    if (is_inverse == null) is_inverse = false;
    if (is_arc == null) is_arc = false;
    if (is_mile == null) is_mile = true;

    const in_data = this.toVecVecDouble(data);
    const r = this.wasm.neighbor_match_test(map_uid, knn,  power, is_inverse, is_arc, is_mile, in_data['values'], scale_method, distance_method);
    const rr = this.parseVecVecDouble(r);

    return {
      'cardinality' : rr[0],
      'probability' : rr[1]
    }
  }

  /**
   * Multivariate local geary is a multivariate extension of local geary which measures the extent to which neighbors in multiattribute space are also neighbors in geographical space.
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} values1 The array of the numeric columns that contains the values for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method The permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significance_cutoff The cutoff value for significance p-values to filter not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {Object} LISA object {@link GeoDaLisa} 
   */
  local_multigeary(weights, values, permutations, permutation_method, significance_cutoff, seed) {
    const map_uid = weights.get_map_uid();
    const weight_uid = weights.get_uid();

    if (permutations == null) permutations = 999;
    if (permutation_method == null) permutation_method = "lookup";
    if (significance_cutoff == null) significance_cutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutation_method in {'lookup':true, 'complete':true})) {
      consolo.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const data = this.toVecVecDouble(values);
    const lisa_obj = this.wasm.local_multigeary(map_uid, weight_uid, data['values'], data['undefs'], significance_cutoff, permutations, permutation_method, seed);

    return lisa_obj != null ? new GeoDaLisa(lisa_obj, this) : null;
  }

  /**
   * Bivariate or no-colocation local join count works when two events cannot happen in the same location. It can be used to identify negative spatial autocorrelation.
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} values1 The first numeric column that contains the binary values (e.g. 0 and 1) for LISA statistics
   * @param {Array} values2 The second numeric column that contains the binary values (e.g. 0 and 1) for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method The permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significance_cutoff The cutoff value for significance p-values to filter not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {Object} LISA object {@link GeoDaLisa} 
   */
  local_bijoincount(weights, values1,  values2, permutations, permutation_method, significance_cutoff, seed) {
    const map_uid = weights.get_map_uid();
    const weight_uid = weights.get_uid();

    if (permutations == null) permutations = 999;
    if (permutation_method == null) permutation_method = "lookup";
    if (significance_cutoff == null) significance_cutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutation_method in {'lookup':true, 'complete':true})) {
      consolo.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const num_obs = values1.length;
    for (let i=0; i<num_obs; ++i) {
      if ((values1[i] != 0 && values1[i] != 1) || (values2[i] != 0 && values2[i] != 1)) {
        console.log("The input data is not binary.");
        return null;
      }
    }

    for (let i=0; i<num_obs; ++i) {
      if (values1[i] == 1 && values2[i] == 1) {
        console.log("The bivariate local join count only applies on two variables with no-colocation.");
        return null;
      }
    }

    const data = this.toVecVecDouble([values1, values2]);
    const lisa_obj = this.wasm.local_multigeary(map_uid, weight_uid, data['values'], data['undefs'], significance_cutoff, permutations, permutation_method, seed);

    return lisa_obj != null ? new GeoDaLisa(lisa_obj, this) : null;
  }

  /**
   * Multivariate or colocation local join count (2019) works when two or more events happen in the same location. 
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} values The array of numeric columns that contains the binary values (e.g. 0 and 1) for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method The permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significance_cutoff The cutoff value for significance p-values to filter not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {Object} LISA object {@link GeoDaLisa} 
   */
  local_multijoincount(weights, values, permutations, permutation_method, significance_cutoff, seed) {
    const map_uid = weights.get_map_uid();
    const weight_uid = weights.get_uid();

    if (permutations == null) permutations = 999;
    if (permutation_method == null) permutation_method = "lookup";
    if (significance_cutoff == null) significance_cutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutation_method in {'lookup':true, 'complete':true})) {
      consolo.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const num_vars = values.length;
    if (num_vars) {
      console.log("The input data is not from multivariate variables.");
      return;
    }

    const num_obs = values[0].length;
    for (let i=0; i<num_vars; ++i) {
      for (let j=0; j< num_obs; ++j) {
        if (values[i][j] != 0 && values[i][j] != 1) {
          console.log("The input data is not binary.");
          return null;
        }
      }
    }

    if (num_vars == 2) {
      for (let i=0; i<num_obs; ++i) {
        if (values[0][i] == 1 && values[1][i] == 1) {
          console.log("The input two variables have no colocations. Please use: local_bijoincount().");
          return null;
        }
      } 
    }

    const data = this.toVecVecDouble(values);
    const lisa_obj = this.wasm.local_multigeary(map_uid, weight_uid, data['values'], data['undefs'], significance_cutoff, permutations, permutation_method, seed);

    return lisa_obj != null ? new GeoDaLisa(lisa_obj, this) : null;
  }

  /**
   * Multivariate Quantile LISA (2019) is a type of local spatial autocorrelation that applies multivariate local join count statistics to quantiles of multiple continuous variables. 
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} ks The array of integer numbers that specify quantiles for each variable
   * @param {Array} quantiles The array of integer numbers that specify which quantile is used for each variable
   * @param {Array} values The array of numeric columns that contains the binary values (e.g. 0 and 1) for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * @param {String} permutation_method The permutation method used for the LISA computation. Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significance_cutoff The cutoff value for significance p-values to filter not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {Object} LISA object {@link GeoDaLisa} 
   */
  multi_quantile_lisa(weights, ks, quantiles, values, permutations, permutation_method, significance_cutoff, seed) {
    const map_uid = weights.get_map_uid();
    const weight_uid = weights.get_uid();

    if (permutations == null) permutations = 999;
    if (permutation_method == null) permutation_method = "lookup";
    if (significance_cutoff == null) significance_cutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutation_method in {'lookup':true, 'complete':true})) {
      consolo.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const num_vars = values.length;
    if (num_vars != ks.length || num_vars != quantiles.length) {
      console.log("The data size of ks, quantiles and values are not the same.");
      return;
    }

    const in_ks = this.toVecInt(ks);
    const in_quantiles = this.toVecInt(quantiles);
    const data = this.toVecVecDouble(values);

    const lisa_obj = this.wasm.multi_quantile_lisa(map_uid, weight_uid, in_ks, in_quantiles, data['values'], data['undefs'], significance_cutoff, permutations, permutation_method, seed);
    return lisa_obj != null ? new GeoDaLisa(lisa_obj, this) : null;
  }

  /**
   * Helper function: Get REDCAP methods.
   * 
   * @returns {Array}
   */
  redcap_methods() {
    return {
      "firstorder-singlelinkage":true, 
      "fullorder-completelinkage":true, 
      "fullorder-averagelinkage":true,
      "fullorder-singlelinkage":true, 
      "fullorder-wardlinkage":true
    }
  }

  /**
   * Spatial C(K)luster Analysis by Tree Edge Removal
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Number} k The number of clusters
   * @param {Array} values The list of numeric vectors of selected variable
   * @param {Number} min_bound The minimum value that the sum value of bounding variable int each cluster should be greater than 
   * @param {Array} bound_vals The numeric vector of selected bounding variable
   * @param {String} scale_method The scaling method: {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'} 
   * @param {String} distance_method The distance method: {"euclidean", "manhattan"}
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'
   */
  skater(weights, k, values, min_bound, bound_vals, scale_method, distance_method) {
    return this.redcap(weights, k, values, 'firstorder-singlelinkage', min_bound, bound_vals, scale_method, distance_method);
  }

  /**
   * Helper function: check if scale method is valid.
   * 
   * @param {String} scale_method 
   * @returns {Boolean}
   */
  check_scale_method(scale_method) {
    const defined_scale_methods = this.scale_methods();
    if (!(scale_method in defined_scale_methods)) {
      console.log("The scaling method is not valid.");
      return false;
    }
    return true;
  }

  /**
   * Helper function: check if distance method is valid.
   * 
   * @param {String} distance_method 
   * @returns {Boolean}
   */
  check_distance_method(distance_method) {
    const defined_dist_methods = this.distance_methods();
    if (!(distance_method in defined_dist_methods)) {
      console.log("The distance method is not valid.");
      return false;
    }
    return true;
  }

  /**
   * Helper function: get clustering results
   * 
   * @param {Object} r 
   * @returns {Object} {'clusters', 'total_ss', 'between_ss', 'within_ss', 'ratio'}
   */
  get_clustering_result(r) {
    if (r.is_valid()) {
      return {
        'clusters': this.parseVecInt(r.clusters()),
        'total_ss': r.total_ss(),
        'between_ss': r.between_ss(),
        'within_ss': this.parseVecDouble(r.within_ss()),
        'ratio': r.ratio(),
      }
    }
    return null;
  }
  /**
   * Regionalization with dynamically constrained agglomerative clustering and partitioning (REDCAP)
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Number} k The number of clusters
   * @param {Array} values The list of numeric vectors of selected variable
   * @param {String} method The REDCAP method: {'single-linkage', 'average-linkage', 'complete-linkage', 'Ward-linkage'}.
   * @param {Number} min_bound The minimum value that the sum value of bounding variable int each cluster should be greater than 
   * @param {Array} bound_vals The numeric vector of selected bounding variable
   * @param {String} scale_method The scaling method: {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'} 
   * @param {String} distance_method The distance method: {"euclidean", "manhattan"}
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  redcap(weights, k, values, method, min_bound, bound_vals, scale_method, distance_method) {
    const redcap_methods = this.redcap_methods();
    if (!(method in redcap_methods)) {
      consolo.log("Redcap method is not valid");
      return null;
    }

    if (scale_method == null) scale_method = 'standardize';
    if (distance_method == null) distance_method = 'euclidean';
    if (!this.check_scale_method(scale_method)) return null;
    if (!this.check_distance_method(distance_method)) return null;

    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecVecDouble(values);

    if (min_bound == null) min_bound = 0;
    if (bound_vals == null) bound_vals = [];
    
    const r = this.wasm.redcap(map_uid, w_uid, k, method, data['values'], this.toVecDouble(bound_vals), min_bound, scale_method, distance_method);
    return this.get_clustering_result(r); 
  }

  /**
   * Get the SCHC methods.
   * 
   * @returns {Array}
   */
  schc_methods() {
    return {
      "single" : true, 
      "complete" : true, 
      "average" : true,
      "ward": true
    }
  }

  /**
   * Spatially Constrained Hierarchical Clucstering (SCHC)
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Number} k The number of clusters
   * @param {Array} values The list of numeric vectors of selected variable
   * @param {String} method The method of agglomerative hierarchical clustering: {"single", "complete", "average","ward"}.
   * @param {Number} min_bound The minimum value that the sum value of bounding variable int each cluster should be greater than 
   * @param {Array} bound_vals The numeric vector of selected bounding variable
   * @param {String} scale_method The scaling method: {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'} 
   * @param {String} distance_method The distance method: {"euclidean", "manhattan"}
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  schc(weights, k, values, method, min_bound, bound_vals, scale_method, distance_method) {
    const schc_methods = this.schc_methods();
    if (!(method in schc_methods)) {
      consolo.log("schc method is not valid");
      return null;
    }

    if (scale_method == null) scale_method = 'standardize';
    if (distance_method == null) distance_method = 'euclidean';
    if (!this.check_scale_method(scale_method)) return null;
    if (!this.check_distance_method(distance_method)) return null;

    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecVecDouble(values);

    if (min_bound == null) min_bound = 0;
    if (bound_vals == null) bound_vals = [];
    
    const r = this.wasm.schc(map_uid, w_uid, k, method, data['values'], this.toVecDouble(bound_vals), min_bound, scale_method, distance_method);
    return this.get_clustering_result(r); 
  }

 
  /**
   * A greedy algorithm to solve the AZP problem 
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Number} k The number of spatially constrained clusters 
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} inits The number of construction re-runs, which is for ARiSeL "automatic regionalization with initial seed location"
   * @param {Array} init_region  The initial regions that the local search starts with. Default is empty. means the local search starts with a random process to "grow" clusters
   * @param {Array} min_bounds_values The list of numeric array of selected minimum bounding variables.
   * @param {Array} min_bounds The list of minimum value that the sum value of bounding variables in each cluster should be greater than.
   * @param {Array} max_bounds_values The list of numeric array of selected maximum bounding variables.
   * @param {Array} max_bounds The list of minimum value that the sum value of bounding variables in each cluster should be less than.
   * @param {String} scale_method The scaling methods {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distance_method The distance methods {"euclidean", "manhattan"}. Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.   
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  azp_greedy(weights, k, values, inits, init_region, min_bounds_values, min_bounds, max_bounds_values, max_bounds, scale_method, distance_method,  seed) {
    if (inits == null) inits = 0;
    if (init_region == null) init_region = [];

    if (scale_method == null) scale_method = 'standardize';
    if (distance_method == null) distance_method = 'euclidean';
    if (!this.check_scale_method(scale_method)) return null;
    if (!this.check_distance_method(distance_method)) return null;

    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecVecDouble(values);

    if (min_bounds_values == null) min_bounds_values = [];
    if (min_bounds == null) min_bounds = [];
    if (max_bounds_values == null) max_bounds_values = [];
    if (max_bounds == null) max_bounds = [];

    const in_min_bounds_values = this.toVecVecDouble(min_bounds_values)['values'];
    const in_min_bounds= this.toVecDouble(min_bounds);
    const in_max_bounds_values = this.toVecVecDouble(max_bounds_values)['values'];
    const in_max_bounds = this.toVecDouble(max_bounds);

    if (seed == null) seed = 123456789;
    
    const r = this.wasm.azp_greedy(map_uid, w_uid, k, data['values'], inits, this.toVecInt(init_region), scale_method, distance_method, in_min_bounds_values, in_min_bounds, in_max_bounds_values, in_max_bounds, seed);
    return this.get_clustering_result(r); 
  }

  /**
   * A simulated annealing algorithm to solve the AZP problem 
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Number} k The number of spatially constrained clusters 
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} cooling_rate  The number of iterations of simulated annealing. Defaults to 1
   * @param {Number} sa_maxit The number of iterations of simulated annealing. Defaults to 1
   * @param {Number} inits The number of construction re-runs, which is for ARiSeL "automatic regionalization with initial seed location"
   * @param {Array} init_region  The initial regions that the local search starts with. Default is empty. means the local search starts with a random process to "grow" clusters
   * @param {Array} min_bounds_values The list of numeric array of selected minimum bounding variables.
   * @param {Array} min_bounds The list of minimum value that the sum value of bounding variables in each cluster should be greater than.
   * @param {Array} max_bounds_values The list of numeric array of selected maximum bounding variables.
   * @param {Array} max_bounds The list of minimum value that the sum value of bounding variables in each cluster should be less than.
   * @param {String} scale_method The scaling methods {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distance_method The distance methods {"euclidean", "manhattan"}. Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.  
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  azp_sa(weights, k, values, cooling_rate, sa_maxit, inits, init_region, min_bounds_values, min_bounds, max_bounds_values, max_bounds, scale_method, distance_method,  seed) {
    if (cooling_rate == null) cooling_rate = 0.85;
    if (sa_maxit == null) sa_maxit = 1;
    if (inits == null) inits = 0;
    if (init_region == null) init_region = [];

    if (scale_method == null) scale_method = 'standardize';
    if (distance_method == null) distance_method = 'euclidean';
    if (!this.check_scale_method(scale_method)) return null;
    if (!this.check_distance_method(distance_method)) return null;

    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecVecDouble(values);

    if (min_bounds_values == null) min_bounds_values = [];
    if (min_bounds == null) min_bounds = [];
    if (max_bounds_values == null) max_bounds_values = [];
    if (max_bounds == null) max_bounds = [];

    const in_min_bounds_values = this.toVecVecDouble(min_bounds_values)['values'];
    const in_min_bounds= this.toVecDouble(min_bounds);
    const in_max_bounds_values = this.toVecVecDouble(max_bounds_values)['values'];
    const in_max_bounds = this.toVecDouble(max_bounds);

    if (seed == null) seed = 123456789;
    
    const r = this.wasm.azp_sa(map_uid, w_uid, k, cooling_rate, sa_maxit, data['values'], inits, this.toVecInt(init_region), scale_method, distance_method, in_min_bounds_values, in_min_bounds, in_max_bounds_values, in_max_bounds, seed);
    return this.get_clustering_result(r); 
  }

  /**
   * A tabu-search algorithm to solve the AZP problem.
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Number} k The number of spatially constrained clusters 
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} tabu_length The length of a tabu search heuristic of tabu algorithm. Defaults to 10.
   * @param {Number} conv_tabu The number of non-improving moves. Defaults to 10.
   * @param {Number} inits The number of construction re-runs, which is for ARiSeL "automatic regionalization with initial seed location"
   * @param {Array} init_region  The initial regions that the local search starts with. Default is empty. means the local search starts with a random process to "grow" clusters
   * @param {Array} min_bounds_values The list of numeric array of selected minimum bounding variables.
   * @param {Array} min_bounds The list of minimum value that the sum value of bounding variables in each cluster should be greater than.
   * @param {Array} max_bounds_values The list of numeric array of selected maximum bounding variables.
   * @param {Array} max_bounds The list of minimum value that the sum value of bounding variables in each cluster should be less than.
   * @param {String} scale_method The scaling methods {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distance_method The distance methods {"euclidean", "manhattan"}. Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator. 
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  azp_tabu(weights, k, values, tabu_length, conv_tabu, inits, init_region, min_bounds_values, min_bounds, max_bounds_values, max_bounds, scale_method, distance_method,  seed) {
    if (tabu_length == null) tabu_length = 10;
    if (conv_tabu == null) conv_tabu = 10;
    if (inits == null) inits = 0;
    if (init_region == null) init_region = [];

    if (scale_method == null) scale_method = 'standardize';
    if (distance_method == null) distance_method = 'euclidean';
    if (!this.check_scale_method(scale_method)) return null;
    if (!this.check_distance_method(distance_method)) return null;

    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecVecDouble(values);

    if (min_bounds_values == null) min_bounds_values = [];
    if (min_bounds == null) min_bounds = [];
    if (max_bounds_values == null) max_bounds_values = [];
    if (max_bounds == null) max_bounds = [];

    const in_min_bounds_values = this.toVecVecDouble(min_bounds_values)['values'];
    const in_min_bounds= this.toVecDouble(min_bounds);
    const in_max_bounds_values = this.toVecVecDouble(max_bounds_values)['values'];
    const in_max_bounds = this.toVecDouble(max_bounds);

    if (seed == null) seed = 123456789;
    
    const r = this.wasm.azp_tabu(map_uid, w_uid, k, tabu_length, conv_tabu, data['values'], inits, this.toVecInt(init_region), scale_method, distance_method, in_min_bounds_values, in_min_bounds, in_max_bounds_values, in_max_bounds, seed);
    return this.get_clustering_result(r); 
  }

  /**
   * A greedy algorithm to solve the max-p-region problem.
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} iterations The number of iterations of greedy algorithm. Defaults to 1.
   * @param {Array} min_bounds_values The list of numeric array of selected minimum bounding variables.
   * @param {Array} min_bounds The list of minimum value that the sum value of bounding variables in each cluster should be greater than.
   * @param {Array} max_bounds_values The list of numeric array of selected maximum bounding variables.
   * @param {Array} max_bounds The list of minimum value that the sum value of bounding variables in each cluster should be less than.
   * @param {String} scale_method The scaling methods {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distance_method The distance methods {"euclidean", "manhattan"}. Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  maxp_greedy(weights, values, iterations, min_bounds_values, min_bounds, max_bounds_values, max_bounds, scale_method, distance_method,  seed) {
    if (iterations == null) inits = 1;

    if (scale_method == null) scale_method = 'standardize';
    if (distance_method == null) distance_method = 'euclidean';
    if (!this.check_scale_method(scale_method)) return null;
    if (!this.check_distance_method(distance_method)) return null;

    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecVecDouble(values);

    if (min_bounds_values == null || min_bounds == null) {
      console.log("maxp needs min_bounds and min_bounds_values arguments.");
    } 

    if (max_bounds_values == null) max_bounds_values = [];
    if (max_bounds == null) max_bounds = [];

    const in_min_bounds_values = this.toVecVecDouble(min_bounds_values)['values'];
    const in_min_bounds= this.toVecDouble(min_bounds);
    const in_max_bounds_values = this.toVecVecDouble(max_bounds_values)['values'];
    const in_max_bounds = this.toVecDouble(max_bounds);

    if (seed == null) seed = 123456789;
    
    const r = this.wasm.maxp_greedy(map_uid, w_uid, data['values'], iterations, scale_method, distance_method, in_min_bounds_values, in_min_bounds, in_max_bounds_values, in_max_bounds, seed);
    return this.get_clustering_result(r); 
  }

  /**
   * A simulated annealing algorithm to solve the max-p-region problem.
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} cooling_rate The cooling rate of a simulated annealing algorithm. Defaults to 0.85
   * @param {Number} sa_maxit The number of iterations of simulated annealing. Defaults to 1
   * @param {Number} iterations The number of iterations of greedy algorithm. Defaults to 1.
   * @param {Array} min_bounds_values The list of numeric array of selected minimum bounding variables.
   * @param {Array} min_bounds The list of minimum value that the sum value of bounding variables in each cluster should be greater than.
   * @param {Array} max_bounds_values The list of numeric array of selected maximum bounding variables.
   * @param {Array} max_bounds The list of minimum value that the sum value of bounding variables in each cluster should be less than.
   * @param {String} scale_method The scaling methods {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distance_method The distance methods {"euclidean", "manhattan"}. Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  maxp_sa(weights, values, cooling_rate, sa_maxit, iterations, min_bounds_values, min_bounds, max_bounds_values, max_bounds, scale_method, distance_method,  seed) {
    if (cooling_rate == null) cooling_rate = 0.85;
    if (sa_maxit == null) sa_maxit = 1;
    if (iterations == null) inits = 1;

    if (scale_method == null) scale_method = 'standardize';
    if (distance_method == null) distance_method = 'euclidean';
    if (!this.check_scale_method(scale_method)) return null;
    if (!this.check_distance_method(distance_method)) return null;

    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecVecDouble(values);

    if (min_bounds_values == null || min_bounds == null) {
      console.log("maxp needs min_bounds and min_bounds_values arguments.");
    } 

    if (max_bounds_values == null) max_bounds_values = [];
    if (max_bounds == null) max_bounds = [];

    const in_min_bounds_values = this.toVecVecDouble(min_bounds_values)['values'];
    const in_min_bounds= this.toVecDouble(min_bounds);
    const in_max_bounds_values = this.toVecVecDouble(max_bounds_values)['values'];
    const in_max_bounds = this.toVecDouble(max_bounds);

    if (seed == null) seed = 123456789;
    
    const r = this.wasm.maxp_sa(map_uid, w_uid, data['values'], iterations, cooling_rate, sa_maxit, scale_method, distance_method, in_min_bounds_values, in_min_bounds, in_max_bounds_values, in_max_bounds, seed);
    return this.get_clustering_result(r); 
  }

  /**
   * A tabu-search algorithm to solve the max-p-region problem 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} tabu_length The length of a tabu search heuristic of tabu algorithm. Defaults to 10.
   * @param {Number} conv_tabu The number of non-improving moves. Defaults to 10.
   * @param {Number} iterations The number of iterations of greedy algorithm. Defaults to 1.
   * @param {Array} min_bounds_values The list of numeric array of selected minimum bounding variables.
   * @param {Array} min_bounds The list of minimum value that the sum value of bounding variables in each cluster should be greater than.
   * @param {Array} max_bounds_values The list of numeric array of selected maximum bounding variables.
   * @param {Array} max_bounds The list of minimum value that the sum value of bounding variables in each cluster should be less than.
   * @param {String} scale_method The scaling methods {'raw', 'standardize', 'demean', 'mad', 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distance_method The distance methods {"euclidean", "manhattan"}. Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.
   * @returns {Object} Return a ClusteringResult object: {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  maxp_tabu(weights, values, tabu_length, conv_tabu, iterations, min_bounds_values, min_bounds, max_bounds_values, max_bounds, scale_method, distance_method,  seed) {
    if (tabu_length == null) tabu_length = 10;
    if (conv_tabu == null) conv_tabu = 10;
    if (iterations == null) inits = 1;

    if (scale_method == null) scale_method = 'standardize';
    if (distance_method == null) distance_method = 'euclidean';
    if (!this.check_scale_method(scale_method)) return null;
    if (!this.check_distance_method(distance_method)) return null;

    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecVecDouble(values);

    if (min_bounds_values == null) min_bounds_values = [];
    if (min_bounds == null) min_bounds = [];
    if (max_bounds_values == null) max_bounds_values = [];
    if (max_bounds == null) max_bounds = [];

    const in_min_bounds_values = this.toVecVecDouble(min_bounds_values)['values'];
    const in_min_bounds= this.toVecDouble(min_bounds);
    const in_max_bounds_values = this.toVecVecDouble(max_bounds_values)['values'];
    const in_max_bounds = this.toVecDouble(max_bounds);

    if (seed == null) seed = 123456789;
    
    const r = this.wasm.maxp_tabu(map_uid, w_uid, data['values'], iterations, tabu_length, conv_tabu,  scale_method, distance_method, in_min_bounds_values, in_min_bounds, in_max_bounds_values, in_max_bounds, seed);
    return this.get_clustering_result(r); 
  }
}