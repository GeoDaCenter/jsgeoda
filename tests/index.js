var test  = require('tape');
var fs = require('fs');
const jsgeoda = require('../lib/index.js');
const NAT_SHP = './tests/natregimes.geojson';

test('A passing test', (assert) => {

  assert.pass('This test will pass.');

  assert.end();
});

test('Test loading jsgeoda', async(assert) => {
  assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    // should not raise 
    assert.equal(1,1);
    assert.end();
  } catch(e) {
    assert.fail(e);
  }
});

test('Test loading shapefile', async(assert) => {
  assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    let ab = fs.readFileSync(NAT_SHP).buffer;
    let map_uid = geoda.ReadGeojsonMap('natregimes', ab);
    let num_obs = geoda.GetNumObs(map_uid);
    assert.equal(num_obs,3085);
    assert.end();
  } catch(e) {
    assert.fail(e);
  }
});

test('Test GetMapType()', async(assert) => {
  assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    let ab = fs.readFileSync(NAT_SHP).buffer;
    let map_uid = geoda.ReadGeojsonMap('natregimes', ab);
    let map_type = geoda.GetMapType(map_uid);
    assert.equal(map_type,5);
    assert.end();
  } catch(e) {
    assert.fail(e);
  }
});



test('Test SKATER', async(assert) => {
  assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    let ab = fs.readFileSync(NAT_SHP).buffer;
    const uint8_t_arr = new Uint8Array(ab);
    let map_uid = geoda.ReadGeojsonMap('natregimes', ab);

    let queen_w = geoda.CreateQueenWeights(map_uid, 1, 0, 0);
    let w_uid = queen_w.get_uid();

    let clst = geoda.redcap(map_uid, w_uid, 5, ['HR60'], "", -1, "firstorder-singlelinkage");
    console.log(clst.length);
    assert.equal(clst.length, 5);

    assert.end();
  } catch(e) {
    assert.fail(e);
  }
});
