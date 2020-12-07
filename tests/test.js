const jsgeoda = require('../lib/index.js');
const fs = require('fs');


async function test() {
    try {
    var t0 = new Date().getTime();
    let geoda = await jsgeoda.New();
    var t1 = new Date().getTime();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")

    let geojson = fs.readFileSync('./tests/natregimes.geojson');
    let ab = geojson.buffer;
    const uint8_t_arr = new Uint8Array(ab);
    let map_uid = geoda.ReadGeojsonMap('map_uid', ab);
    console.log('map id:',map_uid);
    let cent = geoda.GetCentroids(map_uid);
    console.log(cent);
    let thres = geoda.GetMinDistThreshold(map_uid, 0, 0);
    console.log(thres);
    let w = geoda.CreateQueenWeights(map_uid, 1, 0, 0);
    console.log('weights:',w.get_uid());

    var t0 = new Date().getTime();
    let lisa = geoda.local_moran(map_uid, w.get_uid(), "HR60");
    var t1 = new Date().getTime();
    let lisa_c = geoda.parseVecDouble(lisa.clusters());
    console.log(lisa_c);
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")

    var t0 = new Date().getTime();
    let lisa1 = geoda.local_moran(map_uid, w.get_uid(), "UE60");
    var t1 = new Date().getTime();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")


    var t0 = new Date().getTime();
    let clst = geoda.redcap(map_uid,w.get_uid(), 10, ['HR60','PO60','UE60'], "", -1, "firstorder-singlelinkage");
    var t1 = new Date().getTime();
    //console.log(clst);
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")
    } catch (err)  {
        console.log(err);
    }
}

test();