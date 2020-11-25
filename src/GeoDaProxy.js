// author: lixun910@gmail.com
// date: 10/7/2020 version 0.0.4

/**
 * Use jsgeoda.New() to get an instance of GeoDaProxy. See New() {@link New}
 * @see New
 * @class
 * @classdesc GeoDaProxy is a class that wraps all the APIs of libgeoda WASM.
 * Always use jsgeoda.{@link New}() to get an instance of GeoDaProxy.
 */
class GeoDaProxy {

  /**
   * Should not be called directy. 
   * Always use jsgeoda.New() to get an instance of GeoDaProxy.
   * @constructs GeoDaProxy 
   * @param {Object} wasm The object of libgeoda WASM  
   */
  constructor(wasm) {
    this.version = '0.0.4';
    this.wasm = wasm;
    this.geojson_maps = {};
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
   * let nat = geoda.ReadGeojsonMap("NAT", ab);
   * let num_obs = geoda.GetNumObs(nat);
   * 
   * @param {String} map_uid A unique string that represent the geojson map. E.g. the geojson file name.
   * @param {ArrayBuffer} ab The content of the geojson file in format of ArrayBuffer.
   */
  ReadGeojsonMap(map_uid, ab) {
    //evt.target.result is an ArrayBuffer. In js, 
    const uint8_t_arr = new Uint8Array(ab);
    //First we need to allocate the wasm memory. 
    const uint8_t_ptr = this.wasm._malloc(uint8_t_arr.length);
    //Now that we have a block of memory we can copy the file data into that block
    this.wasm.HEAPU8.set(uint8_t_arr, uint8_t_ptr);
    // pass the address of the this.wasm memory we just allocated to our function
    //this.wasm.new_geojsonmap(map_uid, uint8_t_ptr, uint8_t_arr.length);
    this.wasm.ccall("new_geojsonmap1", null, ["string", "number", "number"], [map_uid, uint8_t_ptr, uint8_t_arr.length]);

    //Lastly, according to the docs, we should call ._free here.
    this.wasm._free(uint8_t_ptr);
    // store the map and map type
    let map_type = this.wasm.get_map_type(map_uid);
    this.geojson_maps[map_uid] = map_type;
    return map_uid;
  }

  /**
   * Check if a geojson map has been read into GeoDaProxy.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @returns {Boolean} Returns True if the geojson map has been read. Otherwise, returns False.
   */
  Has(map_uid) {
    return map_uid in this.geojson_maps;
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
   * let nat = geoda.ReadGeojsonMap("NAT", ab);
   * let cent = geoda.GetCentroids(nat);
   * 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @returns {Array} Returns an array of [x,y] coordinates (no projection applied) of the centroids.
   */
  GetCentroids(map_uid) {
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
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @returns {Number} Returns the number of observations or rows in the geojson map.
   */
  GetNumObs(map_uid) {
    let n = this.wasm.get_num_obs(map_uid);
    return n;
  }

  GetMapType(map_uid) {
    return this.geojson_maps[map_uid];
  }

  /**
   * Get the numeric values of a column or field. 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {String} col_name A string of column or field name.
   * @returns {Array} Returns the values of a column of field. 
   */
  GetNumericCol(map_uid, col_name) {
    // return VectorDouble
    let vals = this.wasm.get_numeric_col(map_uid, col_name)
    return this.parseVecDouble(vals);
  }

  /**
   * Create a Rook contiguity weights.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} include_lower_order Indicate if include lower order when creating weights
   * @param {Number} precision_threshold Used when the precision of the underlying shape file is insufficient to allow for an exact match of coordinates to determine which polygons are neighbors. 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  CreateRookWeights(map_uid, order, include_lower_order, precision_threshold) {
    let w_uid = this.wasm.rook_weights(map_uid, order, include_lower_order, precision_threshold);
    return w_uid;
  }

  /**
   * Create a contiguity weights.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} include_lower_order Indicate if include lower order when creating weights
   * @param {Number} precision_threshold Used when the precision of the underlying shape file is insufficient to allow for an exact match of coordinates to determine which polygons are neighbors. 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  CreateQueenWeights(map_uid, order, include_lower_order, precision) {
    let w_uid = this.wasm.queen_weights(map_uid, order, include_lower_order, precision);
    return w_uid;
  }

  /**
   * Get a distance that guarantees that every observation has at least 1 neighbor.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  GetMinDistThreshold(map_uid, is_arc, is_mile) {
    let val = this.wasm.min_distance_threshold(map_uid, is_arc, is_mile);
    return val;
  }

  /**
   * Create a K-Nearest Neighbors weights.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} k A positive integer number for k-nearest neighbors
   * @param {Number} power  The power (or exponent) indicates how many times to use the number in a multiplication.
   * @param {Boolean} is_inverse A bool flag indicates whether or not to apply inverse on distance value.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  CreateKnnWeights(map_uid, k, power, is_inverse, is_arc, is_mile) {
    let w = this.wasm.knn_weights(map_uid, k, power, is_inverse, is_arc, is_mile);
    return w;
  }

  /**
   * Create a Distance-based weights.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} dist_thres A positive numeric value of distance threshold used to find neighbors. For example, one can use the pygeoda.weights.min_threshold() to get a distance that guarantees that every observation has at least 1 neighbor.
   * @param {Number} power  The power (or exponent) indicates how many times to use the number in a multiplication.
   * @param {Boolean} is_inverse A bool flag indicates whether or not to apply inverse on distance value.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  CreateDistWeights(map_uid, dist_thres, power, is_inverse, is_arc, is_mile) {
    let w = this.wasm.dist_weights(map_uid, dist_thres, power, is_inverse, is_arc, is_mile);
    return w;
  }

  /**
   * Create a kernel weights with fixed bandwidth.
   * 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} k A positive integer number for k-nearest neighbors
   * @param {String} kernel The name of the kernel function, which could be one of the following: * triangular * uniform * quadratic * epanechnikov * quartic * gaussian
   * @param {Boolean} adaptive_bandwidth A bool flag indicates whether to use adaptive bandwidth or the max distance of all observation to their k-nearest neighbors. 
   * @param {Boolean} use_kernel_diagonals A bool flag indicates whether or not the lower order neighbors should be included in the weights structure.
   * @param {Boolean} is_arc  A bool flag indicates if compute arc distance (true) or Euclidean distance (false).
   * @param {Boolean} is_mile A bool flag indicates if the distance unit is mile (true) or km (false). 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  CreateKernelWeights(map_uid, k, kernel, adaptive_bandwidth, use_kernel_diagonals, is_arc, is_mile) {
    let w = this.wasm.kernel_weights(map_uid, k, kernel, adaptive_bandwidth, use_kernel_diagonals, is_arc, is_mile);
    return w;
  }

  CreateKernelBandwidthWeights(map_uid, dist_thres, kernel, use_kernel_diagonals, is_arc, is_mile) {
    let w = this.wasm.kernel_bandwidth_weights(map_uid, dist_thres, kernel, use_kernel_diagonals, is_arc, is_mile);
    return w;
  }

  //local_moran(map_uid, weight_uid, col_name) {
  //  return this.wasm.local_moran(map_uid, weight_uid, col_name);
  //}

  /**
   * Apply local Moran statistics with 999 permutations, which can not be changed in v0.0.4
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {String} weight_uid A unique string represents the created weights.
   * @param {Array} values The values that local moran statistics will be applied on.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_moran(map_uid, weight_uid, values) {
    return this.wasm.local_moran1(map_uid, weight_uid, this.toVecDouble(values));
  }

  /**
   * Apply local G statistics with 999 permutations, which can not be changed in v0.0.4
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {String} weight_uid A unique string represents the created weights.
   * @param {Array} values The values that local statistics will be applied on.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_g(map_uid, weight_uid, col_name) {
    return this.wasm.local_g(map_uid, weight_uid, col_name);
  }

  /**
   * Apply local G* statistics with 999 permutations, which can not be changed in v0.0.4
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {String} weight_uid A unique string represents the created weights.
   * @param {Array} values The values that local statistics will be applied on.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_gstar(map_uid, weight_uid, col_name) {
    return this.wasm.local_gstar(map_uid, weight_uid, col_name);
  }

  /**
   * Apply local Geary statistics with 999 permutations, which can not be changed in v0.0.4
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {String} weight_uid A unique string represents the created weights.
   * @param {Array} values The values that local statistics will be applied on.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_geary(map_uid, weight_uid, col_name) {
    return this.wasm.local_geary(map_uid, weight_uid, col_name);
  }

  /**
   * Apply local Join Count statistics with 999 permutations, which can not be changed in v0.0.4
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {String} weight_uid A unique string represents the created weights.
   * @param {Array} values The values that local statistics will be applied on.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_joincount(map_uid, weight_uid, col_name) {
    return this.wasm.local_joincount(map_uid, weight_uid, col_name);
  }

  /**
   * Get neighbors (indices) of an observation.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {String} weight_uid A unique string represents the created weights.
   * @param {Number} idx An integer number represents the index of which observation to get its neighbors.
   */
  GetNeighbors(map_uid, weight_uid, idx) {
    let nbrs = this.wasm.get_neighbors(map_uid, weight_uid, idx);
    return this.parseVecInt(nbrs);
  }

  parseVecInt(vi) {
    let result = [];
    for (let j = 0; j < vi.size(); ++j) {
      result.push(vi.get(j));
    }
    return result;
  }

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

  parseVecDouble(vd) {
    let result = []
    for (let i = 0; i < vd.size(); ++i) {
      result.push(vd.get(i));
    }
    return result;
  }


  toVecString(input) {
    let vs = new this.wasm.VectorString();
    for (let i = 0; i < input.length; ++i) {
      vs.push_back(input[i]);
    }
    return vs;
  }

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

  redcap(map_uid, weight_uid, k, sel_fields, bound_var, min_bound, method) {
    let col_names = this.toVecString(sel_fields);
    let clusters_vec = this.wasm.redcap(map_uid, weight_uid, k, col_names, bound_var, min_bound, method);
    let clusters = this.parseVecVecInt(clusters_vec);
    return clusters;
  }

  maxp(map_uid, weight_uid, k, sel_fields, bound_var, min_bound, method, tabu_length, cool_rate, n_iter) {
    let col_names = this.toVecString(sel_fields);
    let clusters_vec = this.wasm.maxp(map_uid, weight_uid, col_names, bound_var, min_bound, tabu_length, cool_rate, method, k, n_iter);
    let clusters = this.parseVecVecInt(clusters_vec);
    return clusters;
  }

  /**
   * Get natural breaks from the values.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  natural_breaks(map_uid, k, values) {
    return this.custom_breaks(map_uid, "natural_breaks", k, nul, values);
  }

  /**
   * Get quantile breaks from the values.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  quantile_breaks(map_uid, k, values) {
    return this.custom_breaks(map_uid, "quantile_breaks", k, nul, values);
  }

   /**
   * Get Standard deviation breaks from the values.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  stddev_breaks(map_uid, k, values) {
    return this.custom_breaks(map_uid, "stddev_breaks", k, nul, values);
  }

  /**
   * Get breaks of boxplot (hinge=1.5) including the top, bottom, median, and two quartiles of the data
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  hinge15_breaks(map_uid, k, values) {
    return this.custom_breaks(map_uid, "hinge15_breaks", k, nul, values);
  }

  /**
   * Get breaks of boxplot (hinge=3.0) including the top, bottom, median, and two quartiles of the data
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  hinge30_breaks(map_uid, k, values) {
    return this.custom_breaks(map_uid, "hinge30_breaks", k, nul, values);
  }

  custom_breaks(map_uid, break_name, k, sel_field, values) {
    var breaks_vec;
    if (sel_field == null) {
      breaks_vec = this.wasm.custom_breaks1(map_uid, k, break_name, this.toVecDouble(values));
    } else {
      breaks_vec = this.wasm.custom_breaks(map_uid, k, sel_field, break_name);
    }
    let breaks = this.parseVecDouble(breaks_vec);
    var orig_breaks = breaks;

    let bins = [];
    let id_array = [];
    for (let i = 0; i < breaks.length; ++i) {
      id_array.push([]);
      let txt = isInt(breaks[i]) ? breaks[i] : breaks[i].toFixed(2);
      bins.push("" + txt);
    }
    id_array.push([]);
    let txt = breaks[breaks.length - 1];
    if (txt != undefined) {
      txt = isInt(txt) ? txt : txt.toFixed(2);
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

    for (let i = 0; i < bins.length; ++i) {
      //bins[i] += " (" + id_array[i].length + ')';
    }

    return {
      'k': k,
      'bins': bins,
      'breaks': orig_breaks,
      'id_array': id_array
    }
  }

  /**
   * Create cartogram using the values in the map. 
   * In cartograms, the size of a variable's value corresponds to the size of a shape. 
   * The location of the circles is aligned as closely as possible to the location of the associated area through a nonlinear optimization routine
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
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
}

exports["GeoDaProxy"] = GeoDaProxy;