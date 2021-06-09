// author: lixun910@gmail.com

/**
 * @class
 * @classdesc GeoDaWeights is a class that wraps the WeightsResult
 */
export default class GeoDaWeights {
  /**
   * Constructor
   * @param {Object} WeightsResult
   */
  constructor(w) {
    this.isValid = w.get_is_valid();

    this.uid = w.get_uid();

    this.mapUid = w.get_map_uid();

    this.weightType = w.get_weight_type();

    this.isSymmetric = w.get_is_symmetric();

    this.numObs = w.get_num_obs();

    this.sparsity = w.get_sparsity();

    this.maxNeighbors = w.get_max_nbrs();

    this.minNeighbors = w.get_min_nbrs();

    this.meanNeighbors = w.get_mean_nbrs();

    this.medianNeighbors = w.get_median_nbrs();
  }

  getMapUid() {
    return this.mapUid;
  }

  getUid() {
    return this.uid;
  }
}
