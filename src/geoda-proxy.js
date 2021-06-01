// author: lixun910@gmail.com
// date: 10/7/2020 version 0.0.4
// date: 5/14/2021 version 0.0.8

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
    this.version = '0.0.8';
    this.wasm = wasm;
    this.geojson_maps = {};
  }

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
   * Deprecated!!
   * @param {String} map_uid 
   * @param {ArrayBuffer} data 
   * @returns 
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
   * Check if a geojson map has been read into GeoDaProxy.
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @returns {Boolean} Returns True if the geojson map has been read. Otherwise, returns False.
   */
  has(map_uid) {
    return map_uid in this.geojson_maps;
  }

  get_bounds(map_uid) {
    const bounds = this.wasm.get_bounds(map_uid);
    return this.parseVecDouble(bounds);
  }

  get_viewport(map_uid, map_height, map_width) {
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
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @returns {Array} Returns an array of [x,y] coordinates (no projection applied) of the centroids.
   */
  get_centroids(map_uid) {
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
  get_numobs(map_uid) {
    let n = this.wasm.get_num_obs(map_uid);
    return n;
  }

  /**
   * 
   * @param {String} map_uid  A unique string represents the geojson map that has been read into GeoDaProxy.
   * @returns Returns the map type of the geojson map
   */
  get_maptype(map_uid) {
    return this.geojson_maps[map_uid];
  }

  /**
   * Get the column names of the geojson map
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @returns {Array} Returns the column names
   */
  get_colnames(map_uid) {
    const names = this.wasm.get_col_names(map_uid);
    return this.parseVecString(names);
  }

  /**
   * Get the values (numeric|string) of a column or field. 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {String} col_name A string of column or field name.
   * @returns {Array} Returns the values of a column of field. 
   */
  get_col(map_uid, col_name) {
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
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} include_lower_order Indicate if include lower order when creating weights
   * @param {Number} precision_threshold Used when the precision of the underlying shape file is insufficient to allow for an exact match of coordinates to determine which polygons are neighbors. 
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  rook_weights(map_uid, order, include_lower_order, precision_threshold) {
    if (!order) order = 1;
    if (!include_lower_order) include_lower_order = false;
    if (!precision) precision = 0.0;

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
  queen_weights(map_uid, order, include_lower_order, precision) {
    if (!order) order = 1;
    if (!include_lower_order) include_lower_order = false;
    if (!precision) precision = 0.0;

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
  min_distthreshold(map_uid, is_arc, is_mile) {
    if (!is_arc) is_arc = false;
    if (!is_mile) is_mile = true;

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
  knn_weights(map_uid, k, power, is_inverse, is_arc, is_mile) {
    if (!power) power = 1.0;
    if (!is_inverse) is_inverse = false;
    if (!is_arc) is_arc = false;
    if (!is_mile) is_mile = true;

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
  distance_weights(map_uid, dist_thres, power, is_inverse, is_arc, is_mile) {
    if (!power) power = 1.0;
    if (!is_inverse) is_inverse = false;
    if (!is_arc) is_arc = false;
    if (!is_mile) is_mile = true;

    let w = this.wasm.dist_weights(map_uid, dist_thres, power, is_inverse, is_arc, is_mile);
    return w;
  }

  /**
   * Create a (adaptive) KNN kernel weights.
   * 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
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
    if (!use_kernel_diagonals) use_kernel_diagonals = false;
    if (!power) power = 1.0;
    if (!is_inverse) is_inverse = false;
    if (!is_arc) is_arc = false;
    if (!is_mile) is_mile = true;

    let w = this.wasm.kernel_weights(map_uid, k, kernel, adaptive_bandwidth, use_kernel_diagonals, power, is_inverse, is_arc, is_mile);
    return w;
  }

  /**
   * 
   * Create a kernel weights with fixed bandwidth.
   * 
   * @param {String} map_uid A unique string represents the geojson map that has been read into GeoDaProxy.
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
    if (!use_kernel_diagonals) use_kernel_diagonals = false;
    if (!power) power = 1.0;
    if (!is_inverse) is_inverse = false;
    if (!is_arc) is_arc = false;
    if (!is_mile) is_mile = true;

    let w = this.wasm.kernel_bandwidth_weights(map_uid, bandwidth, kernel, use_kernel_diagonals, power, is_inverse, is_arc, is_mile);
    return w;
  }

  //local_moran(map_uid, weight_uid, col_name) {
  //  return this.wasm.local_moran(map_uid, weight_uid, col_name);
  //}

  /**
   * Apply local Moran statistics with 999 permutations, which can not be changed in v0.0.4
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Array} values The values that local moran statistics will be applied on.
   * @returns {Object} An instance of {@link LisaResult}
   */
  local_moran(weights, values) {
    const map_uid = weights.get_map_uid();
    const weight_uid = weights.get_uid();
    return this.wasm.local_moran(map_uid, weight_uid, this.toVecDouble(values));
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
   * @param {String} weights The weights object {@link WeightsResult} 
   * @param {Number} idx An integer number represents the index of which observation to get its neighbors.
   */
  get_neighbors(weights, idx) {
    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    
    let nbrs = this.wasm.get_neighbors(map_uid, w_uid, idx);
    return this.parseVecInt(nbrs);
  }

  /**
   * 
   * @param {String} weights The weights object {@link WeightsResult} 
   * @returns 
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

  isInt(n) {
    return Number(n) === n && n % 1 === 0;
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

  toVecInt(input) {
    let vs = new this.wasm.VectorInt();
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
   * Get quantile breaks from the values.
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  quantile_breaks(k, values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.quantile_breaks(k, this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

   /**
   * Get Percentile breaks from the values.
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  percentile_breaks(values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.percentile_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

   /**
   * Get Standard deviation breaks from the values.
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  stddev_breaks(values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.stddev_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

  /**
   * Get breaks of boxplot (hinge=1.5) including the top, bottom, median, and two quartiles of the data
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  hinge15_breaks(values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.hinge15_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

  /**
   * Get breaks of boxplot (hinge=3.0) including the top, bottom, median, and two quartiles of the data
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  hinge30_breaks(values) {
    const undefs = values.map( v => isNaN(v) );
    const brks = this.wasm.hinge30_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return this.parseVecDouble(brks);
  }

  custom_breaks(map_uid, break_name, values, k) {
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
   *  
   * @param {Array} event_values 
   * @param {Array} base_values 
   * @returns {Array}
   */
  excess_risk(event_values, base_values) {
    const r = this.wasm.excess_risk(this.toVecDouble(event_values), this.toVecDouble(base_values));
    return this.parseVecDouble(r);
  }

  /**
   *  
   * @param {Array} event_values 
   * @param {Array} base_values 
   * @returns {Array}
   */
  eb_risk(event_values, base_values) {
    const r = this.wasm.excess_risk(this.toVecDouble(event_values), this.toVecDouble(base_values));
    return this.parseVecDouble(r);
  }

  /**
   *  
   * @param {Array} event_values 
   * @param {Array} base_values 
   * @returns {Array}
   */
  eb_risk(event_values, base_values) {
    const r = this.wasm.eb_risk(this.toVecDouble(event_values), this.toVecDouble(base_values));
    return this.parseVecDouble(r);
  }

  /**
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} values 
   * @param {Boolean} is_binary 
   * @param {Boolean} row_standardize 
   * @param {Bollean} include_diagonal 
   * @returns {Array}
   */
  spatial_lag(weights, values, is_binary, row_standardize, include_diagonal) {
    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();
    const data = this.toVecDouble(values);

    if (!is_binary) is_binary = true;
    if (!row_standardize) row_standardize = true;
    if (!include_diagonal) include_diagonal = false;

    const r = this.wasm.spatial_lag(map_uid, w_uid, data, is_binary, row_standardize, include_diagonal);
    return this.parseVecDouble(r);
  }

  /**
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} event_values 
   * @param {Array} base_values 
   * @returns {Array}
   * @returns 
   */
  spatial_rate(weights, event_values, base_values) {
    const map_uid = weights.get_map_uid();
    const w_uid = weights.get_uid();

    const r = this.wasm.spatial_rate(this.toVecDouble(event_values), this.toVecDouble(base_values), map_uid, w_uid);
    return this.parseVecDouble(r);
  }

  /**
   * 
   * @param {WeightsResult} weights The weights object {@link WeightsResult} 
   * @param {Array} event_values 
   * @param {Array} base_values 
   * @returns {Array}
   * @returns 
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