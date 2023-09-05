/**
 * @class
 * @classdesc GeoDaWeights is a class that wraps the WeightsResult
 */
export default class GeoDaWeights {
    /**
     * Constructor
     * @param {Object} WeightsResult
     */
    constructor(w: any);
    isValid: any;
    uid: any;
    mapUid: any;
    weightType: any;
    isSymmetric: any;
    numObs: any;
    sparsity: any;
    maxNeighbors: any;
    minNeighbors: any;
    meanNeighbors: any;
    medianNeighbors: any;
    getMapUid(): any;
    getUid(): any;
}
