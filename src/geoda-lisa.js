// author: lixun910@gmail.com
// date: 10/7/2020 version 0.0.4
// date: 5/14/2021 version 0.0.8

/**
 * @class
 * @classdesc GeoDaLisa is a class that wraps the LISAResult
 */
export default class GeoDaLisa {
  /**
   * Constructor
   * @param {Object} lisaResult
   */
  constructor(lisa, proxy) {
    this.pvalues = proxy.constructor.parseVecDouble(lisa.significances());

    this.clusters = proxy.constructor.parseVecInt(lisa.clusters());

    this.lisaValues = proxy.constructor.parseVecDouble(lisa.lisa_values());

    this.neighbors = proxy.constructor.parseVecInt(lisa.nn());

    this.labels = proxy.constructor.parseVecString(lisa.labels());

    this.colors = proxy.constructor.parseVecString(lisa.colors());
  }

  /**
   * psudo-p values
   * @returns {Array}
   */
  getPValues() {
    return this.pvalues;
  }

  /**
   * cluster indicators
   * @returns {Array}
   */
  getClusters() {
    return this.clusters;
  }

  /**
   * lisa values
   * @returns {Array}
   */
  getLisaValues() {
    return this.lisaValues;
  }

  /**
   * nearest neighbors
   * @returns {Array}
   */
  getNeighbors() {
    return this.neighbors;
  }

  /**
   * Get labels
   * @returns {Array}
   */
  getLabels() {
    return this.neighbors;
  }

  /**
   * Get colors
   * @returns {Array}
   */
  getColors() {
    return this.colors;
  }
}
