/**
 * @class
 * @classdesc GeoDaLisa is a class that wraps the LISAResult
 */
export default class GeoDaLisa {
    /**
     * Constructor
     * @param {Object} lisaResult
     */
    constructor(lisa: any, proxy: any);
    pvalues: any;
    clusters: any;
    lisaValues: any;
    neighbors: any;
    labels: any;
    colors: any;
    /**
     * psudo-p values
     * @returns {Array}
     */
    getPValues(): any[];
    /**
     * cluster indicators
     * @returns {Array}
     */
    getClusters(): any[];
    /**
     * lisa values
     * @returns {Array}
     */
    getLisaValues(): any[];
    /**
     * nearest neighbors
     * @returns {Array}
     */
    getNeighbors(): any[];
    /**
     * Get labels
     * @returns {Array}
     */
    getLabels(): any[];
    /**
     * Get colors
     * @returns {Array}
     */
    getColors(): any[];
}
