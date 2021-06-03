// author: lixun910@gmail.com
// date: 10/7/2020 version 0.0.4
// date: 5/14/2021 version 0.0.8

/**
 * @class
 * @classdesc GeoDaLisa is a class that wraps the LISAResult
 */
export default class GeoDaLisa {

    /**
     * 
     * @param {Object} lisaResult
     */
    constructor(lisa, proxy) {
      /**
       * psudo-p values
       */
      this.pvalues = proxy.parseVecDouble(lisa.significances());

      /**
       * cluster indicators
       */
      this.clusters = proxy.parseVecInt(lisa.clusters());

      /**
       * lisa values
       */
      this.lisa_values = proxy.parseVecDouble(lisa.lisa_values());

      /**
       * nearest neighbors
       */
      this.neighors = proxy.parseVecInt(lisa.nn());

      this.labels = proxy.parseVecString(lisa.labels());

      this.colors = proxy.parseVecString(lisa.colors());
    }
}