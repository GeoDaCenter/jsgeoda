const test = require('tape');
const fs = require('fs');
const jsgeoda = require('../lib/index');

const NAT_SHP = './tests/natregimes.geojson';

test('Test loading geojson', async (assert) => {
  // assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    const ab = fs.readFileSync(NAT_SHP).buffer;
    const nat = geoda.readGeoJSON(ab);
    const numObs = geoda.getNumberObservations(nat);
    assert.equal(numObs, 3085);

    // const mapType = geoda.getMapType(nat);
    // assert.equal(mapType, 5);

    const bounds = geoda.getBounds(nat);
    assert.deepEqual(bounds,
      [-124.731422424316, -66.9698486328125, 24.9559669494629, 49.3717346191406]);

    const colNames = geoda.getColumnNames(nat);
    assert.equal(colNames[0], 'REGIONS');

    const hr60 = geoda.getColumn(nat, 'HR60');
    assert.equal(hr60[0], 0);
    assert.equal(hr60[1], 0);
    assert.equal(hr60[2], 1.8638634161);

    const wRook = geoda.getRookWeights(nat, 1, false, 0);
    assert.equal(wRook.sparsity, 0.0018059886153789576);

    const wRook2 = geoda.getRookWeights(nat, 2, false, 0);
    assert.equal(wRook2.sparsity, 0.003854064603915532);

    const wQueen = geoda.getQueenWeights(nat, 1, false, 0);
    assert.equal(wQueen.sparsity, 0.0019089598070866245);

    const dt = geoda.getMinDistanceThreshold(nat);
    assert.equal(dt, 1.4657759325950894);

    const wDist = geoda.getDistanceWeights(nat, dt);
    assert.equal(wDist.sparsity, 0.011939614751148575);

    const wKnn = geoda.getKnnWeights(nat, 4);
    assert.equal(wKnn.sparsity, 0.0012965964343598054);

    const wKernel4nn = geoda.getKernelKnnWeights(nat, 4, 'gaussian');
    assert.equal(wKernel4nn.sparsity, 0.0009800125561810296);

    const wKernel = geoda.getKernelWeights(nat, dt, 'gaussian');
    assert.equal(wKernel.sparsity, 0.011939614751148575);

    const nbrs4 = geoda.getNeighbors(wRook, 4);
    assert.deepEqual(nbrs4, [2, 5, 28, 62]);

    const conn = geoda.getConnectivity(wQueen);
    assert.deepEqual(conn.arcs[0].target, [-94.90336786329922, 48.771730563702]);
    assert.deepEqual(conn.arcs[0].source, [-95.81346381368452, 48.77704381810685]);

    const nb = geoda.naturalBreaks(5, hr60);
    assert.deepEqual(nb, [3.3308906802, 7.4689850396, 13.450747147, 31.426775613]);

    const qb = geoda.quantileBreaks(5, hr60);
    assert.deepEqual(qb, [0, 1.7654960252000003, 4.06106847805, 7.9740054575]);

    const pb = geoda.percentileBreaks(hr60);
    assert.deepEqual(pb, [0, 0, 2.7833299411, 11.274974068, 24.8236821873]);

    const sdb = geoda.standardDeviationBreaks(hr60);
    assert.deepEqual(sdb, [-6.795368388288869, -1.1456465602926533, 4.504075267703563,
      10.15379709569978, 15.803518923695995]);

    const h15 = geoda.hinge15Breaks(hr60);
    assert.deepEqual(h15, [-10.32795220545, 0, 2.7833299411, 6.8853014703, 17.21325367575]);

    const h30 = geoda.hinge30Breaks(hr60);
    assert.deepEqual(h30, [-20.6559044109, 0, 2.7833299411, 6.8853014703, 27.5412058812]);

    const lm = geoda.localMoran(wQueen, hr60);
    assert.equal(lm.getLisaValues()[0], 0.5016982232699534);
    assert.equal(lm.getPValues()[0], 0.080);
    assert.equal(lm.getClusters()[0], 0);

    const lg = geoda.localG(wQueen, hr60);
    assert.equal(lg.getLisaValues()[0], 0.00006827270008290488);
    assert.equal(lg.getPValues()[0], 0.08);
    assert.equal(lg.getClusters()[0], 0);

    const lgs = geoda.localGStar(wQueen, hr60);
    assert.equal(lgs.getLisaValues()[0], 0.000051204525062178665);
    assert.equal(lgs.getPValues()[0], 0.08);
    assert.equal(lgs.getClusters()[0], 0);

    const lgr = geoda.localGeary(wQueen, hr60);
    assert.equal(lgr.getLisaValues()[0], 0.08458296355361994);
    assert.equal(lgr.getPValues()[0], 0.096);
    assert.equal(lgr.getClusters()[0], 0);

    const ljc = geoda.localJoinCount(wQueen, hr60);
    assert.equal(ljc.getPValues()[0], -1);
    assert.equal(ljc.neighbors[0], 3);

    const ql = geoda.quantileLisa(wQueen, 5, 5, hr60);
    assert.equal(ql.getPValues()[0], -1);
    assert.equal(ql.neighbors[0], 3);

    const ue60 = geoda.getCol(nat, 'UE60');

    const nmt = geoda.neighborMatchTest(nat, 5, [hr60, ue60]);
    assert.equal(nmt.cardinality[0], 0);
    assert.equal(nmt.probability[0], -1);

    const lmg = geoda.localMultiGeary(wQueen, [hr60, ue60]);
    assert.equal(lmg.getLisaValues()[0], 0.346487237886799);
    assert.equal(lmg.getPValues()[0], 0.008);
    assert.equal(lmg.getClusters()[0], 1);

    // const lbjc = geoda.localBiJoinCount(wQueen, hr60, ue60);
    // const lmjc = geoda.localMultiJoinCount(wQueen, [hr60, ue60]);

    const mql = geoda.multiQuantileLisa(wQueen, [5, 5], [1, 1], [hr60, ue60]);
    assert.equal(mql.getPValues()[0], -1);
    assert.equal(mql.neighbors[0], 3);

    const cg = geoda.cartogram(nat, hr60);
    assert.deepEqual(cg[0].position, [-50.37265349697232, 25.64782475772639]);
    assert.equal(cg[0].radius, 1197.03950649017);

    assert.end();
  } catch (e) {
    assert.fail(e);
  }
});

test('Test SKATER', async (assert) => {
  // assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    const ab = fs.readFileSync(NAT_SHP).buffer;
    const nat = geoda.readGeoJSON(ab);
    const w = geoda.getQueenWeights(nat);
    const hr60 = geoda.getColumn(nat, 'HR60');
    const ue60 = geoda.getColumn(nat, 'UE60');

    const skater = geoda.skater(w, 5, [hr60, ue60]);
    assert.equal(skater.ratio, 0.21185005102397705);

    const redcap = geoda.redcap(w, 5, [hr60, ue60], 'firstorder-singlelinkage');

    assert.equal(redcap.ratio, 0.21185005102397705);

    const redcap1 = geoda.redcap(w, 5, [hr60, ue60], 'fullorder-wardlinkage');
    assert.equal(redcap1.ratio, 0.3224506951256098);

    const schc = geoda.schc(w, 5, [hr60, ue60], 'single');
    assert.equal(schc.ratio, 0.07062100522416408);

    const po60 = geoda.getColumn(nat, 'PO60');

    const azp1 = geoda.azpGreedy(w, 5, [hr60, ue60]);
    assert.equal(azp1.ratio, 0.23233288361575066);

    const azp2 = geoda.azpSA(w, 20, [hr60, ue60], 0.85, 1, 1, [], [po60], [17845200]);
    assert.equal(azp2.ratio, 0.2747629904558493);

    const azp3 = geoda.azpTabu(w, 20, [hr60, ue60], 10, 10, 1, [], [po60], [17845200]);
    assert.equal(azp3.ratio, 0.28652416140501624);

    const maxp1 = geoda.maxpGreedy(w, [hr60, ue60], 1, [po60], [17845200]);
    assert.equal(maxp1.ratio, 0.3227993202716685);

    // const maxp2 = geoda.maxpSa(w, [hr60, ue60], 0.85, 1, 1, [po60], [178452000]);
    // assert.equal(maxp2.ratio, 0.28469714844538363);

    // const maxp3 = geoda.maxpTabu(w, [hr60, ue60], 10, 10, 1, [po60], [178452000]);
    // assert.equal(maxp3.ratio, 0.28469714844538363);

    assert.end();
  } catch (e) {
    assert.fail(e);
  }
});
