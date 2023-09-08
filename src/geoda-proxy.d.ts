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
   * Help function: create a unique id for a Geojson map
   * @returns {String}
   */
  static generateUid(): string;
  /**
   * check if input kernel is valid
   *
   * @param {*} kernel
   * @returns {Boolean}
   */
  static checkInputKernel(kernel: any): boolean;
  /**
   * Help function: check if number is an integer.
   *
   * @param {Number} n
   * @returns {Boolean}
   */
  static isInt(n: number): boolean;
  /**
   * Help function: convert GeoDa std::vector to javascript Array e.g. []
   * @param {Array} input
   * @returns {Object}
   */
  static parseVecInt(vi: any): any;
  /**
   * Help function: convert GeoDa 2d std::vector to javascript 2d Array e.g. [[]]
   * @param {Array} input
   * @returns {Object}
   */
  static parseVecVecInt(vvi: any): any;
  /**
   * Help function: convert GeoDa 2d std::vector to javascript 2d Array e.g. [[]]
   * @param {Array} input
   * @returns {Object}
   */
  static parseVecVecDouble(vvd: any): any;
  /**
   * Help function: convert GeoDa std::vector to javascript Array e.g. []
   * @param {Array} input
   * @returns {Object}
   */
  static parseVecDouble(vd: any): any;
  /**
   * Help function: convert GeoDa std::vector to javascript Array e.g. []
   * @param {Array} input
   * @returns {Object}
   */
  static parseVecString(vd: any): any;
  /**
   * Help function: Get scale methods.
   *
   * @returns {Object}
   */
  static scaleMethods(): any;
  /**
   * Help function: Get distance methods.
   *
   * @returns {Object}
   */
  static distanceMethods(): any;
  /**
   * Helper function: Get REDCAP methods.
   *
   * @returns {Array}
   */
  static redcapMethods(): any[];
  /**
   * Helper function: check if scale method is valid.
   *
   * @param {String} scaleMethod
   * @returns {Boolean}
   */
  static checkScaleMethod(scaleMethod: string): boolean;
  /**
   * Helper function: check if distance method is valid.
   *
   * @param {String} distanceMethod
   * @returns {Boolean}
   */
  static checkDistanceMethod(distanceMethod: string): boolean;
  /**
   * Helper function: get clustering results
   *
   * @param {Object} r
   * @returns {Object} {'clusters', 'total_ss', 'between_ss', 'within_ss', 'ratio'}
   */
  static getClusteringResult(r: any): any;
  /**
   * Get the SCHC methods.
   *
   * @returns {Array}
   */
  static schcMethods(): any[];
  /**
   * Should not be called directy.
   * Always use jsgeoda.New() to get an instance of GeoDaWasm.
   * @constructs GeoDaWasm
   * @param {Object} wasm The object of libgeoda WASM
   */
  constructor(wasm: any);
  version: string;
  wasm: any;
  geojson_maps: {};
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
  readGeoJSON(ab: ArrayBuffer): string;
  read_geojson(a: any): string;
  /**
   * Get map type
   * @param {String} mapUid A unique map id
   * @returns {Number} return map type
   */
  getMapType(mapUid: string): number;
  /**
   * Deprecated!! Read from shapefile: .shp/.dbf/.shx
   * @param {String} mapUid A unique map id
   * @param {ArrayBuffer} data
   * @returns {String}
   */
  /**
   * Check if a geojson map has been read into GeoDaWasm.
   * @param {String} mapUid A unique map id
   * that has been read into GeoDaWasm.
   * @returns {Boolean} Returns True if the geojson map has been read. Otherwise, returns False.
   */
  has(mapUid: string): boolean;
  /**
   * Free the memory used by wasm
   */
  free(): void;
  /**
   * Check if map uid is valid
   * @param {String} mapUid
   * @returns {Boolean}
   */
  checkMapUid(mapUid: string): boolean;
  /**
   * Get map bounds
   * @param {String} mapUid A unique map id
   * that has been read into GeoDaWasm.
   * @returns {Array}
   */
  getBounds(mapUid: string): any[];
  /**
   * Get viewport for e.g. Deck.gl or GoogleMaps
   * @param {String} mapUid A unique map id
   * @param {Number} mapHeight The height of map (screen pixel)
   * @param {Number} mapWidth The width of map (screen pixel)
   * @returns {Object}
   */
  getViewport(mapUid: string, mapHeight: number, mapWidth: number): any;
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
  getCentroids(mapUid: string): any[];
  /**
   * Get the number of observations or rows in the geojson map.
   * @param {String} mapUid A unique map id
   * @returns {Number} Returns the number of observations or rows in the geojson map.
   */
  getNumberObservations(mapUid: string): number;
  getNumObs(mapUid: any): number;
  get_numobs(mapUid: any): number;
  /**
   * Get the column names of the geojson map
   * @param {String} mapUid  A unique map id.
   * @returns {Array} Returns the column names
   */
  getColumnNames(mapUid: string): any[];
  get_colnames(mapUid: any): any[];
  /**
   * Get the values (numeric|string) of a column or field.
   * @param {String} mapUid  A unique map id.
   * @param {String} colName A string of column or field name.
   * @returns {Array} Returns the values of a column of field.
   */
  getColumn(mapUid: string, colName: string): any[];
  getCol(m: any, c: any): any[];
  get_col(m: any, c: any): any[];
  /**
   * Create a Rook contiguity weights.
   * @param {String} mapUid  A unique map id.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} includeLowerOrder Indicate if include lower order when creating weights
   * @param {Number} precisionThreshold Used when the precision of the underlying shape file is
   * insufficient to allow for an exact match of coordinates to determine which polygons
   * are neighbors.
   * @returns {GeoDaWeights} An instance of {@link GeoDaWeights}
   */
  getRookWeights(
    mapUid: string,
    order: number,
    includeLowerOrder: boolean,
    precisionThreshold: number
  ): GeoDaWeights;
  /**
   * Create a contiguity weights.
   * @param {String} mapUid  A unique map id.
   * @param {Number} order An integet number for order of contiguity
   * @param {Boolean} includeLowerOrder Indicate if include lower order when creating weights
   * @param {Number} precision_threshold Used when the precision of the underlying shape file
   * is insufficient to allow for an exact match of coordinates to determine which polygons
   * are neighbors.
   * @returns {GeoDaWeights} An instance of {@link GeoDaWeights}
   */
  getQueenWeights(
    mapUid: string,
    order: number,
    includeLowerOrder: boolean,
    precision: any
  ): GeoDaWeights;
  /**
   * Get a distance that guarantees that every observation has at least 1 neighbor.
   * @param {String} mapUid  A unique map id.
   * @param {Boolean} isArc  A bool flag indicates if compute arc distance (true) or
   * Euclidean distance (false).
   * @param {Boolean} isMile A bool flag indicates if the distance unit is mile (true)
   * or km (false).
   * @returns {Number}
   */
  getMinDistanceThreshold(
    mapUid: string,
    isArc: boolean,
    isMile: boolean
  ): number;
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
   * @returns {GeoDaWeights} An instance of {@link GeoDaWeights}
   */
  getKnnWeights(
    mapUid: string,
    k: number,
    power: number,
    isInverse: boolean,
    isArc: boolean,
    isMile: boolean
  ): GeoDaWeights;
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
   * @returns {GeoDaWeights} An instance of {@link GeoDaWeights}
   */
  getDistanceWeights(
    mapUid: string,
    distThreshold: number,
    power: number,
    isInverse: boolean,
    isArc: boolean,
    isMile: boolean
  ): GeoDaWeights;
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
   * @returns {GeoDaWeights} An instance of {@link GeoDaWeights}
   */
  getKernelKnnWeights(
    mapUid: string,
    k: number,
    kernel: string,
    adaptiveBandwidth: boolean,
    useKernelDiagonals: boolean,
    power: number,
    isInverse: boolean,
    isArc: boolean,
    isMile: boolean
  ): GeoDaWeights;
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
   * @returns {GeoDaWeights} An instance of {@link GeoDaWeights}
   */
  getKernelWeights(
    mapUid: string,
    bandwidth: number,
    kernel: string,
    useKernelDiagonals: boolean,
    power: number,
    isInverse: boolean,
    isArc: boolean,
    isMile: boolean
  ): GeoDaWeights;
  /**
   * Get neighbors (indices) of an observation.
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @param {Number} idx An integer number represents the index of which observation
   * to get its neighbors.
   * @returns {Array} The indices of neighbors.
   */
  getNeighbors(weights: string, idx: number): any[];
  /**
   * Get connectivity graph from a weights object
   *
   * @param {String} weights The weights object {@link WeightsResult}
   * @returns {Object} {arcs, targets, sources}
   */
  getConnectivity(weights: string): any;
  /**
   * Help function: convert javascript Array e.g. [] to GeoDa std::vector
   * @param {Array} input
   * @returns {Object}
   */
  toVecString(input: any[]): any;
  /**
   * Help function: convert javascript Array e.g. [] to GeoDa std::vector
   * @param {Array} input
   * @returns {Object}
   */
  toVecInt(input: any[]): any;
  /**
   * Help function: convert javascript Array e.g. [] to GeoDa std::vector
   * @param {Array} input
   * @returns {Object}
   */
  toVecDouble(input: any[]): any;
  /**
   * Help function: convert javascript 2d Array e.g. [[]] to GeoDa 2d std::vector
   * @param {Array} input
   * @returns {Object}
   */
  toVecVecDouble(input: any[]): any;
  /**
   * Natural breaks
   *
   * @param {Number} k Number of breaks
   * @param {Array} values The values that the classify algorithm will be applied on.
   * @returns {Array} Returns an array of break point values.
   */
  naturalBreaks(k: number, values: any[]): any[];
  natural_breaks(k: any, v: any): any[];
  /**
   * Quantile breaks
   *
   * @param {Number} k The number of breaks
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  quantileBreaks(k: number, values: any[]): any[];
  quantile_breaks(k: any, v: any): any[];
  /**
   * Percentile breaks
   *
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  percentileBreaks(values: any[]): any[];
  /**
   * Standard deviation breaks
   *
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  standardDeviationBreaks(values: any[]): any[];
  stddev_breaks(values: any): any[];
  /**
   * Boxplot (hinge=1.5) breaks, including the top, bottom, median, and two quartiles of the data
   *
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  hinge15Breaks(values: any[]): any[];
  hinge15_breaks(v: any): any[];
  /**
   * Boxplot (hinge=3.0) breaks, including the top, bottom, median, and two quartiles of the data
   *
   * @param {Array} values The values of selected variable.
   * @returns {Array} Returns an array of break point values.
   */
  hinge30Breaks(values: any[]): any[];
  hinge30_breaks(v: any): any[];
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
  customBreaks(breakName: string, values: any, k: any): any;
  /**
   * Excess Risk
   *
   * @param {Array} eventValues The values of an event variable.
   * @param {Array} baseValues  The values of an base variable.
   * @returns {Array}
   */
  excessRisk(eventValues: any[], baseValues: any[]): any[];
  /**
   * Empirical Bayes (EB) Smoothed Rate
   *
   * @param {Array} eventValues The values of an event variable.
   * @param {Array} baseValues  The values of an base variable.
   * @returns {Array}
   */
  empiricalBayesRisk(eventValues: any[], baseValues: any[]): any[];
  /**
   * Compute spatially lagged variable.
   *
   * @param {Object} weights The weights object {@link WeightsResult}
   * @param {Array} values The values of a selected variable.
   * @param {Boolean} isBinary The bool value indicates if the spatial weights
   * is used as binary weights. Default: TRUE.
   * @param {Boolean} rowStandardize The bool value indicates if use
   * row-standardized weights. Default: TRUE
   * @param {Bollean} includeDiagonal The bool value indicates if include
   * diagonal of spatial weights. Default: FALSE
   * @returns {Array}
   */
  spatialLag(
    weights: any,
    values: any[],
    isBinary: boolean,
    rowStandardize: boolean,
    includeDiagonal: Boolean
  ): any[];
  /**
   * Spatial rate smoothing
   *
   * @param {Object} weights The weights object {@link WeightsResult}
   * @param {Array} eventValues The values of an event variable.
   * @param {Array} baseValues  The values of an base variable.
   * @returns {Array}
   */
  spatialRate(weights: any, eventValues: any[], baseValues: any[]): any[];
  /**
   * Spatial Empirical Bayes (EB) Smoothing
   *
   * @param {Object} weights The weights object {@link WeightsResult}
   * @param {Array} eventValues The values of an event variable.
   * @param {Array} baseValues  The values of an base variable.
   * @returns {Array}
   */
  spatialEmpiricalBayes(
    weights: any,
    eventValues: any[],
    baseValues: any[]
  ): any[];
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
  cartogram(mapUid: string, values: any[]): any[];
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
  localMoran(
    weights: string,
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: any,
    seed: number
  ): any;
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
  localG(
    weights: string,
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: any,
    seed: number
  ): any;
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
  localGStar(
    weights: string,
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: any,
    seed: number
  ): any;
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
  localGeary(
    weights: string,
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: any,
    seed: number
  ): any;
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
  localJoinCount(
    weights: string,
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: any,
    seed: number
  ): any;
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
  quantileLisa(
    weights: string,
    k: any,
    quantile: any,
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: any,
    seed: number
  ): any;
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
  callLisa(
    lisaFunction: any,
    weights: string,
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: any,
    seed: number
  ): any;
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
  neighborMatchTest(
    mapUid: string,
    knn: number,
    data: any[],
    scaleMethod: string,
    distanceMethod: string,
    power: number,
    isInverse: boolean,
    isArc: boolean,
    isMile: boolean
  ): any[];
  /**
   * Multivariate local geary is a multivariate extension of local geary
   * which measures the extent to which neighbors in multiattribute space
   * are also neighbors in geographical space.
   *
   * @param {Object} weights The weights object {@link WeightsResult}
   * @param {Array} values1 The array of the numeric columns that contains the
   * values for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significanceCutoff The cutoff value for significance p-values to filter
   * not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {GeoDaLisa} LISA object {@link GeoDaLisa}
   */
  localMultiGeary(
    weights: any,
    values: any,
    permutations: number,
    permutationMethod: string,
    significanceCutoff: number,
    seed: number
  ): GeoDaLisa;
  /**
   * Bivariate or no-colocation local join count works when two events cannot happen in the
   * same location. It can be used to identify negative spatial autocorrelation.
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
   * @returns {GeoDaLisa} LISA object {@link GeoDaLisa}
   */
  localBiJoinCount(
    weights: any,
    values1: any[],
    values2: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: number,
    seed: number
  ): GeoDaLisa;
  /**
   * Multivariate or colocation local join count (2019) works when two or more events
   * happen in the same location.
   *
   * @param {Object} weights The weights object {@link WeightsResult}
   * @param {Array} values The array of numeric columns that contains the binary values
   * (e.g. 0 and 1) for LISA statistics
   * @param {Number} permutations The number of permutations for the LISA computation. Default: 999.
   * * @param {String} permutationMethod The permutation method used for the LISA computation.
   * Options are 'complete', 'lookup'. Default: 'lookup'.
   * @param {Number} significanceCutoff The cutoff value for significance p-values to filter
   * not-significant clusters. Default: 0.05
   * @param {Number} seed The seed for random number generator
   * @returns {GeoDaLisa} LISA object {@link GeoDaLisa}
   */
  localMultiJoinCount(
    weights: any,
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: number,
    seed: number
  ): GeoDaLisa;
  /**
   * Multivariate Quantile LISA (2019) is a type of local spatial autocorrelation that applies
   * multivariate local join count statistics to quantiles of multiple continuous variables.
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
   * @returns {GeoDaLisa} LISA object {@link GeoDaLisa}
   */
  multiQuantileLisa(
    weights: any,
    ks: any[],
    quantiles: any[],
    values: any[],
    permutations: number,
    permutationMethod: string,
    significanceCutoff: number,
    seed: number
  ): GeoDaLisa;
  /**
   * Spatial C(K)luster Analysis by Tree Edge Removal
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
  skater(
    weights: any,
    k: number,
    values: any[],
    minBound: number,
    boundVals: any[],
    scaleMethod: string,
    distanceMethod: string
  ): any;
  /**
   * Regionalization with dynamically constrained agglomerative clustering and partitioning (REDCAP)
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
  redcap(
    weights: any,
    k: number,
    values: any[],
    method: string,
    minBound: number,
    boundVals: any[],
    scaleMethod: string,
    distanceMethod: string
  ): any;
  /**
   * Spatially Constrained Hierarchical Clucstering (SCHC)
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
  schc(
    weights: any,
    k: number,
    values: any[],
    method: string,
    minBound: number,
    boundVals: any[],
    scaleMethod: string,
    distanceMethod: string
  ): any;
  /**
   * A greedy algorithm to solve the AZP problem
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
  azpGreedy(
    weights: any,
    k: number,
    values: any[],
    inits: number,
    initRegion: any[],
    minBoundValues: any[],
    minBounds: any[],
    maxBoundValues: any[],
    maxBounds: any[],
    scaleMethod: string,
    distanceMethod: string,
    seed: number
  ): any;
  /**
   * A simulated annealing algorithm to solve the AZP problem
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
  azpSA(
    weights: any,
    k: number,
    values: any[],
    coolingRate: number,
    saMaxIt: number,
    inits: number,
    initRegion: any[],
    minBoundValues: any[],
    minBounds: any[],
    maxBoundValues: any[],
    maxBounds: any[],
    scaleMethod: string,
    distanceMethod: string,
    seed: number
  ): any;
  /**
   * A tabu-search algorithm to solve the AZP problem.
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
  azpTabu(
    weights: any,
    k: number,
    values: any[],
    tabuLength: number,
    convTabu: number,
    inits: number,
    initRegion: any[],
    minBoundValues: any[],
    minBounds: any[],
    maxBoundValues: any[],
    maxBounds: any[],
    scaleMethod: string,
    distanceMethod: string,
    seed: number
  ): any;
  /**
   * A greedy algorithm to solve the max-p-region problem.
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
  maxpGreedy(
    weights: any,
    values: any[],
    iterations: number,
    minBoundValues: any[],
    minBounds: any[],
    maxBoundValues: any[],
    maxBounds: any[],
    scaleMethod: string,
    distanceMethod: string,
    seed: number
  ): any;
  /**
   * A simulated annealing algorithm to solve the max-p-region problem.
   *
   * @param {Object} weights The weights object {@link WeightsResult}
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
  maxpSA(
    weights: any,
    values: any[],
    coolingRate: number,
    saMaxIt: number,
    iterations: number,
    minBoundValues: any[],
    minBounds: any[],
    maxBoundValues: any[],
    maxBounds: any[],
    scaleMethod: string,
    distanceMethod: string,
    seed: number
  ): any;
  /**
   * A tabu-search algorithm to solve the max-p-region problem
   * @param {Object} weights The weights object {@link WeightsResult}
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
  maxpTabu(
    weights: any,
    values: any[],
    tabuLength: number,
    convTabu: number,
    iterations: number,
    minBoundValues: any[],
    minBounds: any[],
    maxBoundValues: any[],
    maxBounds: any[],
    scaleMethod: string,
    distanceMethod: string,
    seed: number
  ): any;
}
