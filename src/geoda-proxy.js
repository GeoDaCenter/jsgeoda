/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
// author: lixun910@gmail.com
// date: 10/7/2020 version 0.0.4
// date: 5/14/2021 version 0.0.8

import GeoDaLisa from './geoda-lisa';
import GeoDaWeights from './geoda-weights';

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
  static generateUid() {
    const result = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 12; i += 1) {
      result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return `map-${result.join('')}`;
  }

  /**
   * Read a geojson map from a file object in the format of ArrayBuffer.
   * You can use {@link readFileSync} in fs to read the geojson file and
   * return a {@link ArrayBuffer};
   * Or use FileReader.{@link readAsArrayBuffer} to read the content of a
   * specified {@link Blob} of {@link File}.
   * @example
   * // In node.js
   * const fs = require('fs');
   * const jsgeoda = require('jsgeoda');
   * const geoda = await jsgeoda.New();
   *
   * let ab = fs.readFileSync("NAT.geojson").buffer;
   * let nat = geoda.read_geojson(ab);
   * let numObs = geoda.get_numobs(nat);
   *
   * E.g. the geojson file name.
   * @param {ArrayBuffer} ab The content of the geojson file in format of ArrayBuffer.
   * @returns {String} A unique id of the geoda object.
   */
  readGeoJSON(ab) {
    const mapUid = GeoDaWasm.generateUid();

    // evt.target.result is an ArrayBuffer
    const uint8Arr = new Uint8Array(ab);
    // First we need to allocate the wasm memory.

    // eslint-disable-next-line no-underscore-dangle
    const uint8Ptr = this.wasm._malloc(uint8Arr.length);
    // Now that we have a block of memory we can copy the file data into that block
    this.wasm.HEAPU8.set(uint8Arr, uint8Ptr);
    // pass the address of the this.wasm memory we just allocated to our function
    // this.wasm.new_geojsonmap(mapUid, uint8Ptr, uint8Arr.length);
    this.wasm.ccall('new_geojsonmap', null, ['string', 'number', 'number'], [mapUid, uint8Ptr, uint8Arr.length]);
    // Lastly, according to the docs, we should call ._free here.

    // eslint-disable-next-line no-underscore-dangle
    this.wasm._free(uint8Ptr);

    // store the map and map type
    const mapType = this.wasm.get_map_type(mapUid);
    this.geojson_maps[mapUid] = mapType;

    return mapUid;
  }

  // eslint-disable-next-line camelcase
  read_geojson(a) {
    return this.readGeoJSON(a);
  }

  /**
   * Get map type
   * @param {String} mapUid A unique map id
   * @returns {Number} return map type
   */
  getMapType(mapUid) {
    if (!this.has(mapUid)) {
      // eslint-disable-next-line no-console
      console.log('mapUid is not recognized: ', mapUid);
      return -1;
    }
    return this.geojson_maps[mapUid];
  }

  /**
   * Deprecated!! Read from shapefile: .shp/.dbf/.shx
   * @param {String} mapUid A unique map id
   * @param {ArrayBuffer} data
   * @returns {String}
   */
  /*
  readShapefile(mapUid, data) {
    const uint8Shp = new Uint8Array(data.shp);
    const uint8Dbf = new Uint8Array(data.dbf);
    const uint8Shx = new Uint8Array(data.shx);
    // canread, canwrite, canown
    this.wasm.FS_createDataFile('/', `${mapUid}.shp`, uint8Shp, true, true, true);
    this.wasm.FS_createDataFile('/', `${mapUid}.dbf`, uint8Dbf, true, true, true);
    this.wasm.FS_createDataFile('/', `${mapUid}.shx`, uint8Shx, true, true, true);
    this.wasm.new_shapefilemap(mapUid);
    return mapUid;
  }
  */

  /**
   * Check if a geojson map has been read into GeoDaWasm.
   * @param {String} mapUid A unique map id
   * that has been read into GeoDaWasm.
   * @returns {Boolean} Returns True if the geojson map has been read. Otherwise, returns False.
   */
  has(mapUid) {
    return mapUid in this.geojson_maps;
  }

  /**
   * Free the memory used by wasm
   */
  free() {
    this.wasm.free_geojsonmap();
  }

  /**
   * Check if map uid is valid
   * @param {String} mapUid
   * @returns {Boolean}
   */
  checkMapUid(mapUid) {
    if (!this.has(mapUid)) {
      console.log('mapUid is not recognized: ', mapUid);
      return false;
    }
    return true;
  }

  /**
   * Get map bounds
   * @param {String} mapUid A unique map id
   * that has been read into GeoDaWasm.
   * @returns {Array}
   */
  getBounds(mapUid) {
    if (!this.checkMapUid(mapUid)) return null;
    const bounds = this.wasm.get_bounds(mapUid);
    return GeoDaWasm.parseVecDouble(bounds);
  }

  /**
   * Get viewport for e.g. Deck.gl or GoogleMaps
   * @param {String} mapUid A unique map id
   * @param {Number} mapHeight The height of map (screen pixel)
   * @param {Number} mapWidth The width of map (screen pixel)
   * @returns {Object}
   */
  getViewport(mapUid, mapHeight, mapWidth) {
    if (!this.checkMapUid(mapUid)) return null;

    const bounds = this.getBounds(mapUid);

    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 21;

    function latRad(lat) {
      const sin = Math.sin((lat * Math.PI) / 180);
      const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    const ne = { lng: bounds[1], lat: bounds[2] };// .getNorthEast();
    const sw = { lng: bounds[0], lat: bounds[3] };// .getSouthWest();

    const latFraction = Math.abs(latRad(ne.lat) - latRad(sw.lat)) / Math.PI;

    const lngDiff = ne.lng - sw.lng;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const mapDim = Math.min(mapHeight, mapWidth);
    const latZoom = zoom(mapDim, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(mapDim, WORLD_DIM.width, lngFraction);

    const z = Math.min(latZoom, lngZoom, ZOOM_MAX);

    return {
      longitude: (bounds[0] + bounds[1]) / 2.0,
      latitude: (bounds[2] + bounds[3]) / 2.0,
      zoom: z - 1,
    };
  }

  /**
   * Get the centroids of geojson map.
   * Same as GEOS.algorithm.Centroid: the centroid were computed as
   * a weighted sum of the centroids of a decomposition of the area
   * into (possibly overlapping) triangles. The algorithm has been
   * extended to handle holes and multi-polygons
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
   * @param {String} mapUid A unique map id
   * @returns {Array} Returns an array of [x,y] coordinates (not projected) of the centroids.
   */
  getCentroids(mapUid) {
    if (!this.checkMapUid(mapUid)) return null;
    const cc = this.wasm.get_centroids(mapUid);
    const xx = cc.get_x();
    const yy = cc.get_y();
    const centroids = [];
    for (let i = 0; i < xx.size(); i += 1) {
      centroids.push([xx.get(i), yy.get(i)]);
    }
    return centroids;
  }

  /**
   * Get the number of observations or rows in the geojson map.
   * @param {String} mapUid A unique map id
   * @returns {Number} Returns the number of observations or rows in the geojson map.
   */
  getNumberObservations(mapUid) {
    if (!this.checkMapUid(mapUid)) return null;
    const n = this.wasm.get_num_obs(mapUid);
    return n;
  }

  // eslint-disable-next-line camelcase
  getNumObs(mapUid) {
    return this.getNumberObservations(mapUid);
  }

  // eslint-disable-next-line camelcase
  get_numobs(mapUid) {
    return this.getNumberObservations(mapUid);
  }

  /**
   * Get the column names of the geojson map
   * @param {String} mapUid  A unique map id.
   * @returns {Array} Returns the column names
   */
  getColumnNames(mapUid) {
    const names = this.wasm.get_col_names(mapUid);
    return GeoDaWasm.parseVecString(names);
  }

  // eslint-disable-next-line camelcase
  get_colnames(mapUid) {
    return this.getColumnNames(mapUid);
  }

  /**
   * Get the values (numeric|string) of a column or field.
   * @param {String} mapUid  A unique map id.
   * @param {String} colName A string of column or field name.
   * @returns {Array} Returns the values of a column of field.
   */
  getColumn(mapUid, colName) {
    if (!this.checkMapUid(mapUid)) return null;
    const isNumeric = this.wasm.is_numeric_col;
    if (isNumeric) {
      const vals = this.wasm.get_numeric_col(mapUid, colName);
      return GeoDaWasm.parseVecDouble(vals);
    }
    const vals = this.wasm.get_string_col(mapUid, colName);
    return GeoDaWasm.parseVecString(vals);
  }

  getCol(m, c) {
    return this.getColumn(m, c);
  }

  // eslint-disable-next-line camelcase
  get_col(m, c) {
    return this.getColumn(m, c);
  }

  /**
   * Create a Rook contiguity weights.
   * @param {String} mapUid  A unique map id.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} includeLowerOrder Indicate if include lower order when creating weights
   * @param {Number} precisionThreshold Used when the precision of the underlying shape file is
   * insufficient to allow for an exact match of coordinates to determine which polygons
   * are neighbors.
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  getRookWeights(mapUid, order, includeLowerOrder, precisionThreshold) {
    if (!this.checkMapUid(mapUid)) return null;

    if (order == null) order = 1;
    if (includeLowerOrder == null) includeLowerOrder = false;
    if (precisionThreshold == null) precisionThreshold = 0.0;

    const w = this.wasm.rook_weights(mapUid, order, includeLowerOrder, precisionThreshold);
    return new GeoDaWeights(w);
  }

  /**
   * Create a contiguity weights.
   * @param {String} mapUid  A unique map id.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} includeLowerOrder Indicate if include lower order when creating weights
   * @param {Number} precision_threshold Used when the precision of the underlying shape file
   * is insufficient to allow for an exact match of coordinates to determine which polygons
   * are neighbors.
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  getQueenWeights(mapUid, order, includeLowerOrder, precision) {
    if (!this.checkMapUid(mapUid)) return null;

    if (order == null) order = 1;
    if (includeLowerOrder == null) includeLowerOrder = false;
    if (precision == null) precision = 0.0;

    const w = this.wasm.queen_weights(mapUid, order, includeLowerOrder, precision);
    return new GeoDaWeights(w);
  }

  /**
   * Get a distance that guarantees that every observation has at least 1 neighbor.
   * @param {String} mapUid  A unique map id.
   * @param {Boolean} isArc  A bool flag indicates if compute arc distance (true) or
   * Euclidean distance (false).
   * @param {Boolean} isMile A bool flag indicates if the distance unit is mile (true)
   * or km (false).
   * @returns {Number}
   */
  getMinDistanceThreshold(mapUid, isArc, isMile) {
    if (!this.checkMapUid(mapUid)) return null;

    if (isArc == null) isArc = false;
    if (isMile == null) isMile = true;

    const val = this.wasm.min_distance_threshold(mapUid, isArc, isMile);
    return val;
  }

  /**
   * Create a K-Nearest Neighbors weights.
   * @param {String} mapUid  A unique map id.
   * @param {Number} k A positive integer number for k-nearest neighbors
   * @param {Number} power  The power (or exponent) indicates how many times to use the number
   * in a multiplication.
   * @param {Boolean} isInverse A bool flag indicates whether or not to apply inverse on
   * distance value.
   * @param {Boolean} isArc  A bool flag indicates if compute arc distance (true) or Euclidean
   * distance (false).
   * @param {Boolean} isMile A bool flag indicates if the distance unit is mile (true) or
   * km (false).
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  getKnnWeights(mapUid, k, power, isInverse, isArc, isMile) {
    if (!this.checkMapUid(mapUid)) return null;

    if (power == null) power = 1.0;
    if (isInverse == null) isInverse = false;
    if (isArc == null) isArc = false;
    if (isMile == null) isMile = true;

    const w = this.wasm.knn_weights(mapUid, k, power, isInverse, isArc, isMile);
    return new GeoDaWeights(w);
  }

  /**
   * Create a Distance-based weights.
   * @param {String} mapUid A unique map id.
   * @param {Number} distThreshold A positive numeric value of distance threshold
   * used to find neighbors.
   * @param {Number} power  The power (or exponent) indicates how many times to use
   * the number in a multiplication.
   * @param {Boolean} isInverse A bool flag indicates whether or not to apply inverse
   * on distance value.
   * @param {Boolean} isArc  A bool flag indicates if compute arc distance (true) or
   * Euclidean distance (false).
   * @param {Boolean} isMile A bool flag indicates if the distance unit is mile (true)
   * or km (false).
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  getDistanceWeights(mapUid, distThreshold, power, isInverse, isArc, isMile) {
    if (!this.checkMapUid(mapUid)) return null;

    if (power == null) power = 1.0;
    if (isInverse == null) isInverse = false;
    if (isArc == null) isArc = false;
    if (isMile == null) isMile = true;

    const w = this.wasm.dist_weights(mapUid, distThreshold, power, isInverse, isArc, isMile);
    return new GeoDaWeights(w);
  }

  /**
   * Create a (adaptive) KNN kernel weights.
   *
   * @param {String} mapUid A unique map id.
   * @param {Number} k A positive integer number for k-nearest neighbors
   * @param {String} kernel The name of the kernel function, which could be one of the following:
   * {triangular, uniform, quadratic, epanechnikov, quartic, gaussian}
   * @param {Boolean} adaptiveBandwidth A bool flag indicates whether to use adaptive bandwidth
   * or the max distance of all observation to their k-nearest neighbors.
   * @param {Boolean} useKernelDiagonals A bool flag indicates whether or not the lower order
   * neighbors should be included in the weights structure.
   * @param {Number} power  The power (or exponent) indicates how many times to use the number
   * in a multiplication.
   * @param {Boolean} isInverse A bool flag indicates whether or not to apply inverse on
   * distance value.
   * @param {Boolean} isArc  A bool flag indicates if compute arc distance (true) or Euclidean
   * distance (false).
   * @param {Boolean} isMile A bool flag indicates if the distance unit is mile (true) or
   * km (false)
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  getKernelKnnWeights(mapUid, k, kernel, adaptiveBandwidth, useKernelDiagonals, power,
    isInverse, isArc, isMile) {
    if (!this.checkMapUid(mapUid)) return null;
    if (!GeoDaWasm.checkInputKernel(kernel)) return null;

    if (useKernelDiagonals == null) useKernelDiagonals = false;
    if (power == null) power = 1.0;
    if (isInverse == null) isInverse = false;
    if (isArc == null) isArc = false;
    if (isMile == null) isMile = true;

    const w = this.wasm.kernel_weights(mapUid, k, kernel, adaptiveBandwidth, useKernelDiagonals,
      power, isInverse, isArc, isMile);

    return new GeoDaWeights(w);
  }

  /**
   * check if input kernel is valid
   *
   * @param {*} kernel
   * @returns {Boolean}
   */
  static checkInputKernel(kernel) {
    if (!(kernel in {
      triangular: true, uniform: true, epanechnikov: true, quartic: true, gaussian: true,
    })) {
      console.log("kernel has to be one of  {'triangular', 'uniform', 'epanechnikov', 'quartic', 'gaussian'}");
      return false;
    }
    return true;
  }

  /**
   * Create a kernel weights with fixed bandwidth.
   *
   * @param {String} mapUid A unique map id.
   * @param {Number} bandwidth The bandwidth (distance threshold).
   * @param {String} kernel The name of the kernel function, which could be one of the following:
   * {triangular, uniform, quadratic, epanechnikov, quartic, gaussian}
   * @param {Boolean} adaptive_bandwidth A bool flag indicates whether to use adaptive bandwidth
   * or the max distance of all observation to their k-nearest neighbors.
   * @param {Boolean} useKernelDiagonals A bool flag indicates whether or not the lower order
   * neighbors should be included in the weights structure.
   * @param {Number} power  The power (or exponent) indicates how many times to use the number
   * in a multiplication.
   * @param {Boolean} isInverse A bool flag indicates whether or not to apply inverse on
   * distance value.
   * @param {Boolean} isArc  A bool flag indicates if compute arc distance (true) or Euclidean
   * distance (false).
   * @param {Boolean} isMile A bool flag indicates if the distance unit is mile (true) or
   * km (false).
   * @returns {Object} An instance of {@link GeoDaWeights}
   */
  getKernelWeights(mapUid, bandwidth, kernel, useKernelDiagonals, power, isInverse,
    isArc, isMile) {
    if (!this.checkMapUid(mapUid)) return null;
    if (!GeoDaWasm.checkInputKernel(kernel)) return null;

    if (useKernelDiagonals === null) useKernelDiagonals = false;
    if (power == null) power = 1.0;
    if (isInverse == null) isInverse = false;
    if (isArc == null) isArc = false;
    if (isMile == null) isMile = true;

    const w = this.wasm.kernel_bandwidth_weights(mapUid, bandwidth, kernel,
      useKernelDiagonals, power, isInverse, isArc, isMile);

    return new GeoDaWeights(w);
  }

  /**
   * Get neighbors (indices) of an observation.
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Number} idx An integer number represents the index of which observation
   * to get its neighbors.
   * @returns {Array} The indices of neighbors.
   */
  getNeighbors(weights, idx) {
    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();

    const nbrs = this.wasm.get_neighbors(mapUid, wUid, idx);
    return GeoDaWasm.parseVecInt(nbrs);
  }

  /**
   * Get connectivity graph from a weights object
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @returns {Object} {arcs, targets, sources}
   */
  getConnectivity(weights) {
    const mapUid = weights.getMapUid();

    const centroids = this.getCentroids(mapUid);
    const numobs = this.getNumberObservations(mapUid);
    const arcs = [];
    const targets = [];
    const sources = [];

    for (let i = 0; i < numobs; i += 1) {
      const nbrs = this.getNeighbors(weights, i);
      for (let j = 0; j < nbrs.length; j += 1) {
        const nn = nbrs[j];
        // add point at arc source
        sources.push({
          position: centroids[nn],
          target: centroids[i],
          name: String(j),
          radius: 1,
          gain: 0,
        });
        // add arc
        arcs.push({
          target: centroids[i],
          source: centroids[nn],
          value: 3,
        });
      }
      // add point at arc target
      targets.push({
        position: centroids[i],
        name: String(i),
      });
    }
    return { arcs, targets, sources };
  }

  /**
   * Help function: check if number is an integer.
   *
   * @param {Number} n
   * @returns {Boolean}
   */
  static isInt(n) {
    return Number(n) === n && n % 1 === 0;
  }

  /**
   * Help function: convert GeoDa std::vector to javascript Array e.g. []
   * @param {Array} input
   * @returns {Object}
   */
  static parseVecInt(vi) {
    const result = [];
    for (let j = 0; j < vi.size(); j += 1) {
      result.push(vi.get(j));
    }
    return result;
  }

  /**
   * Help function: convert GeoDa 2d std::vector to javascript 2d Array e.g. [[]]
   * @param {Array} input
   * @returns {Object}
   */
  static parseVecVecInt(vvi) {
    const result = [];
    for (let i = 0; i < vvi.size(); i += 1) {
      const sub = [];
      const vi = vvi.get(i);
      for (let j = 0; j < vi.size(); j += 1) {
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
  static parseVecVecDouble(vvd) {
    const result = [];
    for (let i = 0; i < vvd.size(); i += 1) {
      const sub = [];
      const vd = vvd.get(i);
      for (let j = 0; j < vd.size(); j += 1) {
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
  static parseVecDouble(vd) {
    const result = [];
    for (let i = 0; i < vd.size(); i += 1) {
      result.push(vd.get(i));
    }
    return result;
  }

  /**
   * Help function: convert GeoDa std::vector to javascript Array e.g. []
   * @param {Array} input
   * @returns {Object}
   */
  static parseVecString(vd) {
    const result = [];
    for (let i = 0; i < vd.size(); i += 1) {
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
    const vs = new this.wasm.VectorString();
    for (let i = 0; i < input.length; i += 1) {
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
    const vs = new this.wasm.VectorInt();
    for (let i = 0; i < input.length; i += 1) {
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
    const vs = new this.wasm.VectorDouble();
    for (let i = 0; i < input.length; i += 1) {
      if (Number.isNaN(input[i]) || input[i] === Infinity) {
        vs.push_back(0);
      } else {
        vs.push_back(input[i]);
      }
    }
    return vs;
  }

  /**
   * Help function: convert javascript 2d Array e.g. [[]] to GeoDa 2d std::vector
   * @param {Array} input
   * @returns {Object}
   */
  toVecVecDouble(input) {
    const vvs = new this.wasm.VecVecDouble();
    const iis = new this.wasm.VecVecInt();

    for (let i = 0; i < input.length; i += 1) {
      const vs = new this.wasm.VectorDouble();
      const is = new this.wasm.VectorInt();

      for (let j = 0; j < input[i].length; j += 1) {
        if (Number.isNaN(input[i][j]) || input[i][j] === Infinity) {
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
    return { values: vvs, undefs: iis };
  }

  /**
   * Natural breaks
   *
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  naturalBreaks(k, values) {
    const undefs = values.map((v) => Number.isNaN(v));
    const brks = this.wasm.natural_breaks(k, this.toVecDouble(values),
      this.toVecInt(undefs));
    return GeoDaWasm.parseVecDouble(brks);
  }

  // eslint-disable-next-line camelcase
  natural_breaks(k, v) {
    return this.naturalBreaks(k, v);
  }

  /**
   * Quantile breaks
   *
   * @param {Number} k The number of breaks
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  quantileBreaks(k, values) {
    const undefs = values.map((v) => Number.isNaN(v));
    const brks = this.wasm.quantile_breaks(k, this.toVecDouble(values),
      this.toVecInt(undefs));
    return GeoDaWasm.parseVecDouble(brks);
  }

  // eslint-disable-next-line camelcase
  quantile_breaks(k, v) {
    return this.quantileBreaks(k, v);
  }

  /**
  * Percentile breaks
  *
  * @param {Array} values The values of selected variable.
  * @returns {Array} Returns an array of break point values.
  */
  percentileBreaks(values) {
    const undefs = values.map((v) => Number.isNaN(v));
    const brks = this.wasm.percentile_breaks(this.toVecDouble(values),
      this.toVecInt(undefs));
    return GeoDaWasm.parseVecDouble(brks);
  }

  /**
  * Standard deviation breaks
  *
  * @param {Array} values The values of selected variable.
  * @returns {Array} Returns an array of break point values.
  */
  standardDeviationBreaks(values) {
    const undefs = values.map((v) => Number.isNaN(v));
    const brks = this.wasm.stddev_breaks(this.toVecDouble(values), this.toVecInt(undefs));
    return GeoDaWasm.parseVecDouble(brks);
  }

  // eslint-disable-next-line camelcase
  stddev_breaks(values) {
    return this.standardDeviationBreaks(values);
  }

  /**
   * Boxplot (hinge=1.5) breaks, including the top, bottom, median, and two quartiles of the data
   *
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  hinge15Breaks(values) {
    const undefs = values.map((v) => Number.isNaN(v));
    const brks = this.wasm.hinge15_breaks(this.toVecDouble(values),
      this.toVecInt(undefs));
    return GeoDaWasm.parseVecDouble(brks);
  }

  // eslint-disable-next-line camelcase
  hinge15_breaks(v) {
    return this.hinge15Breaks(v);
  }

  /**
   * Boxplot (hinge=3.0) breaks, including the top, bottom, median, and two quartiles of the data
   *
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  hinge30Breaks(values) {
    const undefs = values.map((v) => Number.isNaN(v));
    const brks = this.wasm.hinge30_breaks(this.toVecDouble(values),
      this.toVecInt(undefs));
    return GeoDaWasm.parseVecDouble(brks);
  }

  // eslint-disable-next-line camelcase
  hinge30_breaks(v) {
    return this.hinge30Breaks(v);
  }

  /**
   * Custom breaks that wraps {'natural_breaks', 'quantile_breaks', 'stdDevBreaks',
   * 'hinge15Breaks', 'hinge30Breaks'}
   *
   * @param {String} breakName The break name: {'natural_breaks', 'quantile_breaks',
   * 'stdDevBreaks', 'hinge15Breaks', 'hinge30Breaks'}
   * @param {*} values The values of selected variable.
   * @param {*} k The number of breaks.
   * @returns {Object} {'k','bins','breaks','id_array'}
   */
  customBreaks(breakName, values, k) {
    let breaks = [];
    if (breakName === 'naturalBreaks') {
      breaks = this.naturalBreaks(k, values);
    } else if (breakName === 'quantileBreaks') {
      breaks = this.quantileBreaks(k, values);
    } else if (breakName === 'percentileBreaks') {
      breaks = this.percentileBreaks(values);
    } else if (breakName === 'standardDeviationBreaks') {
      breaks = this.standardDeviationBreaks(values);
    } else if (breakName === 'hinge15Breaks') {
      breaks = this.hinge15Breaks(values);
    } else if (breakName === 'hinge30Breaks') {
      breaks = this.hinge30Breaks(values);
    } else {
      return null;
    }
    const origBreaks = breaks;

    const bins = [];
    const idArray = [];
    for (let i = 0; i < breaks.length; i += 1) {
      idArray.push([]);
      const txt = GeoDaWasm.isInt(breaks[i]) ? breaks[i] : breaks[i].toFixed(2);
      bins.push(`${txt}`);
    }
    idArray.push([]);
    let txt = breaks[breaks.length - 1];
    if (txt !== undefined) {
      txt = GeoDaWasm.isInt(txt) ? txt : txt.toFixed(2);
      bins.push(`> ${txt}`);
    }

    breaks.unshift(Number.NEGATIVE_INFINITY);
    breaks.push(Number.POSITIVE_INFINITY);

    for (let i = 0; i < values.length; i += 1) {
      const v = values[i];
      for (let j = 0; j < breaks.length - 1; j += 1) {
        const minVal = breaks[j];
        const maxVal = breaks[j + 1];
        if (v >= minVal && v < maxVal) {
          idArray[j].push(i);
          break;
        }
      }
    }

    return {
      k,
      bins,
      breaks: origBreaks,
      id_array: idArray,
    };
  }

  /**
   * Excess Risk
   *
   * @param {Array} eventValues The values of an event variable.
   * @param {Array} baseValues  The values of an base variable.
   * @returns {Array}
   */
  excessRisk(eventValues, baseValues) {
    const r = this.wasm.excess_risk(this.toVecDouble(eventValues),
      this.toVecDouble(baseValues));
    return GeoDaWasm.parseVecDouble(r);
  }

  /**
   * Empirical Bayes (EB) Smoothed Rate
   *
   * @param {Array} eventValues The values of an event variable.
   * @param {Array} baseValues  The values of an base variable.
   * @returns {Array}
   */
  empiricalBayesRisk(eventValues, baseValues) {
    const r = this.wasm.eb_risk(this.toVecDouble(eventValues),
      this.toVecDouble(baseValues));
    return GeoDaWasm.parseVecDouble(r);
  }

  /**
   * Compute spatially lagged variable.
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} values The values of a selected variable.
   * @param {Boolean} isBinary The bool value indicates if the spatial weights
   * is used as binary weights. Default: TRUE.
   * @param {Boolean} rowStandardize The bool value indicates if use
   * row-standardized weights. Default: TRUE
   * @param {Bollean} includeDiagonal The bool value indicates if include
   * diagonal of spatial weights. Default: FALSE
   * @returns {Array}
   */
  spatialLag(weights, values, isBinary, rowStandardize, includeDiagonal) {
    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecDouble(values);

    if (isBinary == null) isBinary = true;
    if (rowStandardize == null) rowStandardize = true;
    if (includeDiagonal == null) includeDiagonal = false;

    const r = this.wasm.spatial_lag(mapUid, wUid, data, isBinary,
      rowStandardize, includeDiagonal);
    return GeoDaWasm.parseVecDouble(r);
  }

  /**
   * Spatial rate smoothing
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} eventValues The values of an event variable.
   * @param {Array} baseValues  The values of an base variable.
   * @returns {Array}
   */
  spatialRate(weights, eventValues, baseValues) {
    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();

    const r = this.wasm.spatial_rate(this.toVecDouble(eventValues),
      this.toVecDouble(baseValues), mapUid, wUid);
    return GeoDaWasm.parseVecDouble(r);
  }

  /**
   * Spatial Empirical Bayes (EB) Smoothing
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} eventValues The values of an event variable.
   * @param {Array} baseValues  The values of an base variable.
   * @returns {Array}
   */
  spatialEmpiricalBayes(weights, eventValues, baseValues) {
    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();

    const r = this.wasm.spatial_eb(this.toVecDouble(eventValues),
      this.toVecDouble(baseValues), mapUid, wUid);
    return GeoDaWasm.parseVecDouble(r);
  }

  /**
   * Create cartogram using the values in the map.
   * In cartograms, the size of a variable's value corresponds to the size of a shape.
   * The location of the circles is aligned as closely as possible to the location of
   * the associated area through a nonlinear optimization routine
   * @param {String} mapUid A unique map Id
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of circles, which is defined as:
   * {
   *    "properties": { "id" : 1},
   *    "position": [0.01, 0.01],
   *    "radius": 0.1
   * }
   */
  cartogram(mapUid, values) {
    const cart = this.wasm.cartogram(mapUid, this.toVecDouble(values));
    const x = cart.get_x();
    const y = cart.get_y();
    const r = cart.get_radius();
    // rescale x, y [-100,0], [0, 45]
    let minX = x.get(0);
    let maxX = x.get(0);
    let minY = y.get(0);
    let maxY = y.get(0);
    for (let i = 0; i < x.size(); i += 1) {
      if (minX > x.get(i)) minX = x.get(i);
      if (maxX < x.get(i)) maxX = x.get(i);
      if (minY > y.get(i)) minY = y.get(i);
      if (maxY < y.get(i)) maxY = y.get(i);
    }
    // const scaleX = 100.0 / (maxX - minX);
    // const scaleY = 45.0 / (maxY - minY);

    const result = [];
    for (let i = 0; i < x.size(); i += 1) {
      // let xx = (x.get(i) - minX) * scaleX;
      // let yy = (y.get(i) - minY) * scaleY;
      result.push({
        properties: {
          id: i,
        },
        position: [x.get(i) / 10000.0, y.get(i) / 10000.0],
        radius: r.get(i),
      });
    }
    return result;
  }

  /**
   * Apply local Moran statistics
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed The seed for random number generator used in LISA statistics.
   * Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  localMoran(weights, values, permutations, permutationMethod, significanceCutoff, seed) {
    return this.callLisa('localMoran', weights, values, permutations, permutationMethod, significanceCutoff, seed);
  }

  /**
   * Apply local G statistics
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed The seed for random number generator used in LISA statistics.
   * Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  localG(weights, values, permutations, permutationMethod, significanceCutoff, seed) {
    return this.callLisa('localG', weights, values, permutations, permutationMethod, significanceCutoff, seed);
  }

  /**
   * Apply local G* statistics
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed The seed for random number generator used in LISA statistics.
   * Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  localGStar(weights, values, permutations, permutationMethod, significanceCutoff, seed) {
    return this.callLisa('localGStar', weights, values, permutations, permutationMethod, significanceCutoff, seed);
  }

  /**
   * Apply local Geary statistics
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed The seed for random number generator used in LISA statistics.
   * Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  localGeary(weights, values, permutations, permutationMethod, significanceCutoff, seed) {
    return this.callLisa('localGeary', weights, values, permutations, permutationMethod, significanceCutoff, seed);
  }

  /**
   * Apply local Join Count statistics
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed The seed for random number generator used in LISA statistics.
   * Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  localJoinCount(weights, values, permutations, permutationMethod, significanceCutoff, seed) {
    return this.callLisa('localJoinCount', weights, values, permutations, permutationMethod, significanceCutoff, seed);
  }

  /**
   * Apply Quantile LISA statistics
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations the number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed The seed for random number generator used in LISA statistics.
   * Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  quantileLisa(weights, k, quantile, values, permutations, permutationMethod,
    significanceCutoff, seed) {
    const mapUid = weights.getMapUid();
    const weightUid = weights.getUid();

    if (permutations == null) permutations = 999;
    if (permutationMethod == null) permutationMethod = 'lookup';
    if (significanceCutoff == null) significanceCutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutationMethod in { lookup: true, complete: true })) {
      console.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const undefs = values.map((v) => Number.isNaN(v));
    const undefsVec = this.toVecInt(undefs);
    const vals = this.toVecDouble(values);

    const lisaObj = this.wasm.quantile_lisa(mapUid, weightUid, k, quantile, vals, undefsVec,
      significanceCutoff, permutations, permutationMethod, seed);
    return lisaObj !== null ? new GeoDaLisa(lisaObj, this) : null;
  }

  /**
   * Helper function: apply LISA statistics
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Array} values The values that local moran statistics will be applied on.
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} seed The seed for random number generator used in LISA statistics.
   * Default: 123456789.
   * @returns {Object} An instance of {@link LisaResult}
   */
  callLisa(lisaFunction, weights, values, permutations, permutationMethod,
    significanceCutoff, seed) {
    const mapUid = weights.getMapUid();
    const weightUid = weights.getUid();

    if (permutations == null) permutations = 999;
    if (permutationMethod == null) permutationMethod = 'lookup';
    if (significanceCutoff == null) significanceCutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutationMethod in { lookup: true, complete: true })) {
      // eslint-disable-next-line no-undef
      console.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const undefs = values.map((v) => Number.isNaN(v));
    const undefsVec = this.toVecInt(undefs);
    const vals = this.toVecDouble(values);

    let lisaObj = null;
    if (lisaFunction === 'localMoran') {
      lisaObj = this.wasm.local_moran(mapUid, weightUid, vals, undefsVec, significanceCutoff,
        permutations, permutationMethod, seed);
    } else if (lisaFunction === 'localG') {
      lisaObj = this.wasm.local_g(mapUid, weightUid, vals, undefsVec, significanceCutoff,
        permutations, permutationMethod, seed);
    } else if (lisaFunction === 'localGStar') {
      lisaObj = this.wasm.local_gstar(mapUid, weightUid, vals, undefsVec, significanceCutoff,
        permutations, permutationMethod, seed);
    } else if (lisaFunction === 'localGeary') {
      lisaObj = this.wasm.local_geary(mapUid, weightUid, vals, undefsVec, significanceCutoff,
        permutations, permutationMethod, seed);
    } else if (lisaFunction === 'localJoinCount') {
      lisaObj = this.wasm.local_joincount(mapUid, weightUid, vals, undefsVec, significanceCutoff,
        permutations, permutationMethod, seed);
    } else {
      // eslint-disable-next-line no-console
      console.log('lisaFunction is not valid: ', lisaFunction);
      return null;
    }

    return new GeoDaLisa(lisaObj, this);
  }

  /**
   * Help function: Get scale methods.
   *
   * @returns {Object}
   */
  static scaleMethods() {
    return {
      raw: true,
      standardize: true,
      demean: true,
      mad: true,
      range_standardize: true,
      range_adjust: true,
    };
  }

  /**
   * Help function: Get distance methods.
   *
   * @returns {Object}
   */
  static distanceMethods() {
    return {
      euclidean: true,
      manhattan: true,
    };
  }

  /**
   * The local neighbor match test is a method to identify significant locations by assessing
   * the extent of overlap between k-nearest neighbors in geographical space and
   * k-nearest neighbors in multi-attribute space.
   *
   * @param {String} mapUid A unique string represents the geojson map that has been
   * read into GeoDaWasm.
   * @param {Number} knn k nearest neighbor for both attribute and geographical space
   * @param {Array} data The array of numeric columns that contains the values for
   * neighbor match test
   * @param {String} scaleMethod The scaling method:  {'raw', 'standardize', 'demean',
   * 'mad', 'range_standardize', 'range_adjust'}. Default: 'standardize'
   * @param {String} distanceMethod The distance method: {'euclidean', 'manhattan'}.
   * Default: 'euclidean'.
   * @param {Number} power The power/exponent corresponds to the number of times the
   * base (dist_band) is used as a factor. Default: 1.
   * @param {Boolean} isInverse The bool value indicates if apply inverse on distance
   * value. Default: False.
   * @param {Boolean} isArc The bool value indicates if compute arc distance between
   * two observations. Default: FALSE.
   * @param {Boolean} isMile The bool value indicates if convert distance unit from
   * mile to kilometer(KM). Default: TRUE.
   * @returns {Array} {'cardinality', 'probability'}
   */
  neighborMatchTest(mapUid, knn, data, scaleMethod, distanceMethod, power, isInverse,
    isArc, isMile) {
    if (scaleMethod == null) scaleMethod = 'standardize';
    const definedScaleMethods = GeoDaWasm.scaleMethods();
    if (!(scaleMethod in definedScaleMethods)) {
      console.log('The scaling method is not valid.');
      return null;
    }

    if (distanceMethod == null) distanceMethod = 'euclidean';
    const definedDistMethods = GeoDaWasm.distanceMethods();
    if (!(distanceMethod in definedDistMethods)) {
      console.log('The distance method is not valid.');
      return null;
    }
    if (power == null) power = 1.0;
    if (isInverse == null) isInverse = false;
    if (isArc == null) isArc = false;
    if (isMile == null) isMile = true;

    const inData = this.toVecVecDouble(data);
    const r = this.wasm.neighbor_match_test(mapUid, knn, power, isInverse, isArc, isMile,
      inData.values, scaleMethod, distanceMethod);
    const rr = GeoDaWasm.parseVecVecDouble(r);

    return {
      cardinality: rr[0],
      probability: rr[1],
    };
  }

  /**
   * Multivariate local geary is a multivariate extension of local geary
   * which measures the extent to which neighbors in multiattribute space
   * are also neighbors in geographical space.
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} values1 The array of the numeric columns that contains the
   * values for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significanceCutoff The cutoff value for significance p-values to filter
   * not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {Object} LISA object {@link GeoDaLisa}
   */
  localMultiGeary(weights, values, permutations, permutationMethod, significanceCutoff, seed) {
    const mapUid = weights.getMapUid();
    const weightUid = weights.getUid();

    if (permutations == null) permutations = 999;
    if (permutationMethod == null) permutationMethod = 'lookup';
    if (significanceCutoff == null) significanceCutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutationMethod in { lookup: true, complete: true })) {
      console.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const data = this.toVecVecDouble(values);
    const lisaObj = this.wasm.local_multigeary(mapUid, weightUid, data.values, data.undefs,
      significanceCutoff, permutations, permutationMethod, seed);

    return lisaObj !== null ? new GeoDaLisa(lisaObj, this) : null;
  }

  /**
   * Bivariate or no-colocation local join count works when two events cannot happen in the
   * same location. It can be used to identify negative spatial autocorrelation.
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} values1 The first numeric column that contains the binary values
   * (e.g. 0 and 1) for LISA statistics
   * @param {Array} values2 The second numeric column that contains the binary values
   * (e.g. 0 and 1) for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significanceCutoff The cutoff value for significance p-values to filter
   * not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {Object} LISA object {@link GeoDaLisa}
   */
  localBiJoinCount(weights, values1, values2, permutations, permutationMethod,
    significanceCutoff, seed) {
    const mapUid = weights.getMapUid();
    const weightUid = weights.getUid();

    if (permutations == null) permutations = 999;
    if (permutationMethod == null) permutationMethod = 'lookup';
    if (significanceCutoff == null) significanceCutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutationMethod in { lookup: true, complete: true })) {
      console.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const numObs = values1.length;
    for (let i = 0; i < numObs; i += 1) {
      if ((values1[i] !== 0 && values1[i] !== 1) || (values2[i] !== 0 && values2[i] !== 1)) {
        console.log('The input data is not binary.');
        return null;
      }
    }

    for (let i = 0; i < numObs; i += 1) {
      if (values1[i] === 1 && values2[i] === 1) {
        console.log('The bivariate local join count only applies on two variables with no-colocation.');
        return null;
      }
    }

    const data = this.toVecVecDouble([values1, values2]);
    const lisaObj = this.wasm.local_multijoincount(mapUid, weightUid, data.values, data.undefs,
      significanceCutoff, permutations, permutationMethod, seed);

    return lisaObj !== null ? new GeoDaLisa(lisaObj, this) : null;
  }

  /**
   * Multivariate or colocation local join count (2019) works when two or more events
   * happen in the same location.
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} values The array of numeric columns that contains the binary values
   * (e.g. 0 and 1) for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significanceCutoff The cutoff value for significance p-values to filter
   * not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {Object} LISA object {@link GeoDaLisa}
   */
  localMultiJoinCount(weights, values, permutations, permutationMethod, significanceCutoff, seed) {
    const mapUid = weights.getMapUid();
    const weightUid = weights.getUid();

    if (permutations == null) permutations = 999;
    if (permutationMethod == null) permutationMethod = 'lookup';
    if (significanceCutoff == null) significanceCutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutationMethod in { lookup: true, complete: true })) {
      console.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const numVars = values.length;
    if (numVars) {
      console.log('The input data is not from multivariate variables.');
      return null;
    }

    const numObs = values[0].length;
    for (let i = 0; i < numVars; i += 1) {
      for (let j = 0; j < numObs; j += 1) {
        if (values[i][j] !== 0 && values[i][j] !== 1) {
          console.log('The input data is not binary.');
          return null;
        }
      }
    }

    if (numVars === 2) {
      for (let i = 0; i < numObs; i += 1) {
        if (values[0][i] === 1 && values[1][i] === 1) {
          console.log('The input two variables have no colocations. Please use: localBiJoinCount().');
          return null;
        }
      }
    }

    const data = this.toVecVecDouble(values);
    const lisaObj = this.wasm.local_multijoincount(mapUid, weightUid, data.values, data.undefs,
      significanceCutoff, permutations, permutationMethod, seed);

    return lisaObj !== null ? new GeoDaLisa(lisaObj, this) : null;
  }

  /**
   * Multivariate Quantile LISA (2019) is a type of local spatial autocorrelation that applies
   * multivariate local join count statistics to quantiles of multiple continuous variables.
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} ks The array of integer numbers that specify quantiles for each variable
   * @param {Array} quantiles The array of integer numbers that specify which quantile
   * is used for each variable
   * @param {Array} values The array of numeric columns that contains the binary values
   * (e.g. 0 and 1) for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significanceCutoff The cutoff value for significance p-values to filter
   * not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {Object} LISA object {@link GeoDaLisa}
   */
  multiQuantileLisa(weights, ks, quantiles, values, permutations, permutationMethod,
    significanceCutoff, seed) {
    const mapUid = weights.getMapUid();
    const weightUid = weights.getUid();

    if (permutations == null) permutations = 999;
    if (permutationMethod == null) permutationMethod = 'lookup';
    if (significanceCutoff == null) significanceCutoff = 0.05;
    if (seed == null) seed = 123456789;

    if (!(permutationMethod in { lookup: true, complete: true })) {
      console.log("Permutation method needs to be one of {'lookup', 'complete'}.");
      return null;
    }

    const numVars = values.length;
    if (numVars !== ks.length || numVars !== quantiles.length) {
      console.log('The data size of ks, quantiles and values are not the same.');
      return null;
    }

    const inKs = this.toVecInt(ks);
    const inQuantiles = this.toVecInt(quantiles);
    const data = this.toVecVecDouble(values);

    const lisaObj = this.wasm.multi_quantile_lisa(mapUid, weightUid, inKs, inQuantiles,
      data.values, data.undefs, significanceCutoff, permutations, permutationMethod, seed);
    return lisaObj !== null ? new GeoDaLisa(lisaObj, this) : null;
  }

  /**
   * Helper function: Get REDCAP methods.
   *
   * @returns {Array}
   */
  static redcapMethods() {
    return {
      'firstorder-singlelinkage': true,
      'fullorder-completelinkage': true,
      'fullorder-averagelinkage': true,
      'fullorder-singlelinkage': true,
      'fullorder-wardlinkage': true,
    };
  }

  /**
   * Spatial C(K)luster Analysis by Tree Edge Removal
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Number} k The number of clusters
   * @param {Array} values The list of numeric vectors of selected variable
   * @param {Number} minBound The minimum value that the sum value of bounding
   * variable int each cluster should be greater than
   * @param {Array} boundVals The numeric vector of selected bounding variable
   * @param {String} scaleMethod The scaling method: {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}
   * @param {String} distanceMethod The distance method: {"euclidean", "manhattan"}
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'
   */
  skater(weights, k, values, minBound, boundVals, scaleMethod, distanceMethod) {
    return this.redcap(weights, k, values, 'firstorder-singlelinkage', minBound,
      boundVals, scaleMethod, distanceMethod);
  }

  /**
   * Helper function: check if scale method is valid.
   *
   * @param {String} scaleMethod
   * @returns {Boolean}
   */
  static checkScaleMethod(scaleMethod) {
    const definedScaleMethods = GeoDaWasm.scaleMethods();
    if (!(scaleMethod in definedScaleMethods)) {
      console.log('The scaling method is not valid.');
      return false;
    }
    return true;
  }

  /**
   * Helper function: check if distance method is valid.
   *
   * @param {String} distanceMethod
   * @returns {Boolean}
   */
  static checkDistanceMethod(distanceMethod) {
    const definedDistMethods = GeoDaWasm.distanceMethods();
    if (!(distanceMethod in definedDistMethods)) {
      console.log('The distance method is not valid.');
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
  static getClusteringResult(r) {
    if (r.is_valid()) {
      return {
        clusters: GeoDaWasm.parseVecInt(r.clusters()),
        total_ss: r.total_ss(),
        between_ss: r.between_ss(),
        within_ss: GeoDaWasm.parseVecDouble(r.within_ss()),
        ratio: r.ratio(),
      };
    }
    return null;
  }

  /**
   * Regionalization with dynamically constrained agglomerative clustering and partitioning (REDCAP)
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Number} k The number of clusters
   * @param {Array} values The list of numeric vectors of selected variable
   * @param {String} method The REDCAP method:
   * {'single-linkage', 'average-linkage', 'complete-linkage', 'Ward-linkage'}.
   * @param {Number} minBound The minimum value that the sum value of bounding variable in each
   * cluster should be greater than
   * @param {Array} boundVals The numeric vector of selected bounding variable
   * @param {String} scaleMethod The scaling method: {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}
   * @param {String} distanceMethod The distance method: {"euclidean", "manhattan"}
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  redcap(weights, k, values, method, minBound, boundVals, scaleMethod, distanceMethod) {
    const redcapMethods = GeoDaWasm.redcapMethods();
    if (!(method in redcapMethods)) {
      console.log('Redcap method is not valid');
      return null;
    }

    if (scaleMethod == null) scaleMethod = 'standardize';
    if (distanceMethod == null) distanceMethod = 'euclidean';
    if (!GeoDaWasm.checkScaleMethod(scaleMethod)) return null;
    if (!GeoDaWasm.checkDistanceMethod(distanceMethod)) return null;

    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecVecDouble(values);

    if (minBound == null) minBound = 0;
    if (boundVals == null) boundVals = [];

    const r = this.wasm.redcap(mapUid, wUid, k, method, data.values,
      this.toVecDouble(boundVals), minBound, scaleMethod, distanceMethod);
    return GeoDaWasm.getClusteringResult(r);
  }

  /**
   * Get the SCHC methods.
   *
   * @returns {Array}
   */
  static schcMethods() {
    return {
      single: true,
      complete: true,
      average: true,
      ward: true,
    };
  }

  /**
   * Spatially Constrained Hierarchical Clucstering (SCHC)
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Number} k The number of clusters
   * @param {Array} values The list of numeric vectors of selected variable
   * @param {String} method The method of agglomerative hierarchical clustering:
   * {"single", "complete", "average","ward"}.
   * @param {Number} minBound The minimum value that the sum value of bounding variable in each
   * cluster should be greater than
   * @param {Array} boundVals The numeric vector of selected bounding variable
   * @param {String} scaleMethod The scaling method: {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}
   * @param {String} distanceMethod The distance method: {"euclidean", "manhattan"}
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  schc(weights, k, values, method, minBound, boundVals, scaleMethod, distanceMethod) {
    const schcMethods = GeoDaWasm.schcMethods();
    if (!(method in schcMethods)) {
      console.log('schc method is not valid');
      return null;
    }

    if (scaleMethod == null) scaleMethod = 'standardize';
    if (distanceMethod == null) distanceMethod = 'euclidean';
    if (!GeoDaWasm.checkScaleMethod(scaleMethod)) return null;
    if (!GeoDaWasm.checkDistanceMethod(distanceMethod)) return null;

    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecVecDouble(values);

    if (minBound == null) minBound = 0;
    if (boundVals == null) boundVals = [];

    const r = this.wasm.schc(mapUid, wUid, k, method, data.values,
      this.toVecDouble(boundVals), minBound, scaleMethod, distanceMethod);
    return GeoDaWasm.getClusteringResult(r);
  }

  /**
   * A greedy algorithm to solve the AZP problem
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Number} k The number of spatially constrained clusters
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} inits The number of construction re-runs, which is for ARiSeL
   * "automatic regionalization with initial seed location"
   * @param {Array} initRegion  The initial regions that the local search starts with.
   * Default is empty. means the local search starts with a random process to "grow" clusters
   * @param {Array} minBoundValues The list of numeric array of selected minimum bounding variables.
   * @param {Array} minBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be greater than.
   * @param {Array} maxBoundValues The list of numeric array of selected maximum bounding variables.
   * @param {Array} maxBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be less than.
   * @param {String} scaleMethod The scaling methods {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distanceMethod The distance methods {"euclidean", "manhattan"}.
   * Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  azpGreedy(weights, k, values, inits, initRegion, minBoundValues, minBounds,
    maxBoundValues, maxBounds, scaleMethod, distanceMethod, seed) {
    if (inits == null) inits = 0;
    if (initRegion == null) initRegion = [];

    if (scaleMethod == null) scaleMethod = 'standardize';
    if (distanceMethod == null) distanceMethod = 'euclidean';
    if (!GeoDaWasm.checkScaleMethod(scaleMethod)) return null;
    if (!GeoDaWasm.checkDistanceMethod(distanceMethod)) return null;

    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecVecDouble(values);

    if (minBoundValues == null) minBoundValues = [];
    if (minBounds == null) minBounds = [];
    if (maxBoundValues == null) maxBoundValues = [];
    if (maxBounds == null) maxBounds = [];

    const inMinBoundValues = this.toVecVecDouble(minBoundValues).values;
    const inMinBounds = this.toVecDouble(minBounds);
    const inMaxBoundValues = this.toVecVecDouble(maxBoundValues).values;
    const inMaxBounds = this.toVecDouble(maxBounds);

    if (seed == null) seed = 123456789;

    const r = this.wasm.azp_greedy(mapUid, wUid, k, data.values, inits,
      this.toVecInt(initRegion),
      scaleMethod, distanceMethod, inMinBoundValues, inMinBounds, inMaxBoundValues,
      inMaxBounds, seed);
    return GeoDaWasm.getClusteringResult(r);
  }

  /**
   * A simulated annealing algorithm to solve the AZP problem
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Number} k The number of spatially constrained clusters
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} coolingRate  The number of iterations of simulated annealing. Defaults to 1
   * @param {Number} saMaxIt The number of iterations of simulated annealing. Defaults to 1
   * @param {Number} inits The number of construction re-runs, which is for ARiSeL
   * "automatic regionalization with initial seed location"
   * @param {Array} initRegion  The initial regions that the local search starts with.
   * Default is empty. means the local search starts with a random process to "grow" clusters
   * @param {Array} minBoundValues The list of numeric array of selected minimum bounding variables.
   * @param {Array} minBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be greater than.
   * @param {Array} maxBoundValues The list of numeric array of selected maximum bounding variables.
   * @param {Array} maxBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be less than.
   * @param {String} scaleMethod The scaling methods {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distanceMethod The distance methods {"euclidean", "manhattan"}.
   * Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  azpSA(weights, k, values, coolingRate, saMaxIt, inits, initRegion, minBoundValues,
    minBounds, maxBoundValues, maxBounds, scaleMethod, distanceMethod, seed) {
    if (coolingRate == null) coolingRate = 0.85;
    if (saMaxIt == null) saMaxIt = 1;
    if (inits == null) inits = 0;
    if (initRegion == null) initRegion = [];

    if (scaleMethod == null) scaleMethod = 'standardize';
    if (distanceMethod == null) distanceMethod = 'euclidean';
    if (!GeoDaWasm.checkScaleMethod(scaleMethod)) return null;
    if (!GeoDaWasm.checkDistanceMethod(distanceMethod)) return null;

    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecVecDouble(values);

    if (minBoundValues == null) minBoundValues = [];
    if (minBounds == null) minBounds = [];
    if (maxBoundValues == null) maxBoundValues = [];
    if (maxBounds == null) maxBounds = [];

    const inMinBoundValues = this.toVecVecDouble(minBoundValues).values;
    const inMinBounds = this.toVecDouble(minBounds);
    const inMaxBoundValues = this.toVecVecDouble(maxBoundValues).values;
    const inMaxBounds = this.toVecDouble(maxBounds);

    if (seed == null) seed = 123456789;

    const r = this.wasm.azp_sa(mapUid, wUid, k, coolingRate, saMaxIt, data.values, inits,
      this.toVecInt(initRegion), scaleMethod, distanceMethod, inMinBoundValues,
      inMinBounds, inMaxBoundValues, inMaxBounds, seed);
    return GeoDaWasm.getClusteringResult(r);
  }

  /**
   * A tabu-search algorithm to solve the AZP problem.
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Number} k The number of spatially constrained clusters
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} tabuLength The length of a tabu search heuristic of tabu algorithm.
   * Defaults to 10.
   * @param {Number} convTabu The number of non-improving moves. Defaults to 10.
   * @param {Number} inits The number of construction re-runs, which is for ARiSeL
   * "automatic regionalization with initial seed location"
   * @param {Array} initRegion  The initial regions that the local search starts with.
   * Default is empty. means the local search starts with a random process to "grow" clusters
   * @param {Array} minBoundValues The list of numeric array of selected minimum bounding variables.
   * @param {Array} minBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be greater than.
   * @param {Array} maxBoundValues The list of numeric array of selected maximum bounding variables.
   * @param {Array} maxBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be less than.
   * @param {String} scaleMethod The scaling methods {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distanceMethod The distance methods {"euclidean", "manhattan"}.
   * Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  azpTabu(weights, k, values, tabuLength, convTabu, inits, initRegion, minBoundValues, minBounds,
    maxBoundValues, maxBounds, scaleMethod, distanceMethod, seed) {
    if (tabuLength == null) tabuLength = 10;
    if (convTabu == null) convTabu = 10;
    if (inits == null) inits = 0;
    if (initRegion == null) initRegion = [];

    if (scaleMethod == null) scaleMethod = 'standardize';
    if (distanceMethod == null) distanceMethod = 'euclidean';
    if (!GeoDaWasm.checkScaleMethod(scaleMethod)) return null;
    if (!GeoDaWasm.checkDistanceMethod(distanceMethod)) return null;

    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecVecDouble(values);

    if (minBoundValues == null) minBoundValues = [];
    if (minBounds == null) minBounds = [];
    if (maxBoundValues == null) maxBoundValues = [];
    if (maxBounds == null) maxBounds = [];

    const inMinBoundValues = this.toVecVecDouble(minBoundValues).values;
    const inMinBounds = this.toVecDouble(minBounds);
    const inMaxBoundValues = this.toVecVecDouble(maxBoundValues).values;
    const inMaxBounds = this.toVecDouble(maxBounds);

    if (seed == null) seed = 123456789;

    const r = this.wasm.azp_tabu(mapUid, wUid, k, tabuLength, convTabu, data.values, inits,
      this.toVecInt(initRegion), scaleMethod, distanceMethod, inMinBoundValues, inMinBounds,
      inMaxBoundValues, inMaxBounds, seed);
    return GeoDaWasm.getClusteringResult(r);
  }

  /**
   * A greedy algorithm to solve the max-p-region problem.
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} iterations The number of iterations of greedy algorithm. Defaults to 1.
   * @param {Array} minBoundValues The list of numeric array of selected minimum bounding variables.
   * @param {Array} minBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be greater than.
   * @param {Array} maxBoundValues The list of numeric array of selected maximum bounding variables.
   * @param {Array} maxBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be less than.
   * @param {String} scaleMethod The scaling methods {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distanceMethod The distance methods {"euclidean", "manhattan"}.
   * Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  maxpGreedy(weights, values, iterations, minBoundValues, minBounds, maxBoundValues, maxBounds,
    scaleMethod, distanceMethod, seed) {
    if (iterations == null) iterations = 1;

    if (scaleMethod == null) scaleMethod = 'standardize';
    if (distanceMethod == null) distanceMethod = 'euclidean';
    if (!GeoDaWasm.checkScaleMethod(scaleMethod)) return null;
    if (!GeoDaWasm.checkDistanceMethod(distanceMethod)) return null;

    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecVecDouble(values);

    if (minBoundValues == null || minBounds == null) {
      console.log('maxp needs minBounds and minBoundValues arguments.');
    }

    if (maxBoundValues == null) maxBoundValues = [];
    if (maxBounds == null) maxBounds = [];

    const inMinBoundValues = this.toVecVecDouble(minBoundValues).values;
    const inMinBounds = this.toVecDouble(minBounds);
    const inMaxBoundValues = this.toVecVecDouble(maxBoundValues).values;
    const inMaxBounds = this.toVecDouble(maxBounds);

    if (seed == null) seed = 123456789;

    const r = this.wasm.maxp_greedy(mapUid, wUid, data.values, iterations, scaleMethod,
      distanceMethod, inMinBoundValues, inMinBounds, inMaxBoundValues, inMaxBounds, seed);
    return GeoDaWasm.getClusteringResult(r);
  }

  /**
   * A simulated annealing algorithm to solve the max-p-region problem.
   *
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} coolingRate The cooling rate of a simulated annealing algorithm.
   * Defaults to 0.85
   * @param {Number} saMaxIt The number of iterations of simulated annealing. Defaults to 1
   * @param {Number} iterations The number of iterations of greedy algorithm. Defaults to 1.
   * @param {Array} minBoundValues The list of numeric array of selected minimum bounding variables.
   * @param {Array} minBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be greater than.
   * @param {Array} maxBoundValues The list of numeric array of selected maximum bounding variables.
   * @param {Array} maxBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be less than.
   * @param {String} scaleMethod The scaling methods {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distanceMethod The distance methods {"euclidean", "manhattan"}.
   * Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  maxpSA(weights, values, coolingRate, saMaxIt, iterations, minBoundValues, minBounds,
    maxBoundValues, maxBounds, scaleMethod, distanceMethod, seed) {
    if (coolingRate == null) coolingRate = 0.85;
    if (saMaxIt == null) saMaxIt = 1;
    if (iterations == null) iterations = 1;

    if (scaleMethod == null) scaleMethod = 'standardize';
    if (distanceMethod == null) distanceMethod = 'euclidean';
    if (!GeoDaWasm.checkScaleMethod(scaleMethod)) return null;
    if (!GeoDaWasm.checkDistanceMethod(distanceMethod)) return null;

    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecVecDouble(values);

    if (minBoundValues == null || minBounds == null) {
      console.log('maxp needs minBounds and minBoundValues arguments.');
    }

    if (maxBoundValues == null) maxBoundValues = [];
    if (maxBounds == null) maxBounds = [];

    const inMinBoundValues = this.toVecVecDouble(minBoundValues).values;
    const inMinBounds = this.toVecDouble(minBounds);
    const inMaxBoundValues = this.toVecVecDouble(maxBoundValues).values;
    const inMaxBounds = this.toVecDouble(maxBounds);

    if (seed == null) seed = 123456789;

    const r = this.wasm.maxp_sa(mapUid, wUid, data.values, iterations, coolingRate,
      saMaxIt, scaleMethod, distanceMethod, inMinBoundValues, inMinBounds,
      inMaxBoundValues, inMaxBounds, seed);
    return GeoDaWasm.getClusteringResult(r);
  }

  /**
   * A tabu-search algorithm to solve the max-p-region problem
   * @param {WeightsResult} weights The weights object {@link WeightsResult}
   * @param {Array} values The list of numeric vectors of selected variable.
   * @param {Number} tabuLength The length of a tabu search heuristic of tabu algorithm.
   * Defaults to 10.
   * @param {Number} convTabu The number of non-improving moves. Defaults to 10.
   * @param {Number} iterations The number of iterations of greedy algorithm. Defaults to 1.
   * @param {Array} minBoundValues The list of numeric array of selected minimum bounding variables.
   * @param {Array} minBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be greater than.
   * @param {Array} maxBoundValues The list of numeric array of selected maximum bounding variables.
   * @param {Array} maxBounds The list of minimum value that the sum value of bounding variables
   * in each cluster should be less than.
   * @param {String} scaleMethod The scaling methods {'raw', 'standardize', 'demean', 'mad',
   * 'range_standardize', 'range_adjust'}. Defaults to 'standardize'.
   * @param {String} distanceMethod The distance methods {"euclidean", "manhattan"}.
   * Defaults to 'euclidean'.
   * @param {Number} seed The seed for random number generator.
   * @returns {Object} Return a ClusteringResult object:
   * {'total_ss', 'within_ss', 'between_ss', 'ratio', 'clusters'}
   */
  maxpTabu(weights, values, tabuLength, convTabu, iterations, minBoundValues, minBounds,
    maxBoundValues, maxBounds, scaleMethod, distanceMethod, seed) {
    if (tabuLength == null) tabuLength = 10;
    if (convTabu == null) convTabu = 10;
    if (iterations == null) iterations = 1;

    if (scaleMethod == null) scaleMethod = 'standardize';
    if (distanceMethod == null) distanceMethod = 'euclidean';
    if (!GeoDaWasm.checkScaleMethod(scaleMethod)) return null;
    if (!GeoDaWasm.checkDistanceMethod(distanceMethod)) return null;

    const mapUid = weights.getMapUid();
    const wUid = weights.getUid();
    const data = this.toVecVecDouble(values);

    if (minBoundValues == null) minBoundValues = [];
    if (minBounds == null) minBounds = [];
    if (maxBoundValues == null) maxBoundValues = [];
    if (maxBounds == null) maxBounds = [];

    const inMinBoundValues = this.toVecVecDouble(minBoundValues).values;
    const inMinBounds = this.toVecDouble(minBounds);
    const inMaxBoundValues = this.toVecVecDouble(maxBoundValues).values;
    const inMaxBounds = this.toVecDouble(maxBounds);

    if (seed == null) seed = 123456789;

    const r = this.wasm.maxp_tabu(mapUid, wUid, data.values, iterations, tabuLength,
      convTabu, scaleMethod, distanceMethod, inMinBoundValues, inMinBounds,
      inMaxBoundValues, inMaxBounds, seed);
    return GeoDaWasm.getClusteringResult(r);
  }
}
