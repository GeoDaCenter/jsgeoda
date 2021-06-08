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

test('Test loading geojson', async(assert) => {
  assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    let ab = fs.readFileSync(NAT_SHP).buffer;
    let nat = geoda.read_geojson(ab);
    let num_obs = geoda.get_numobs(nat);
    assert.equal(num_obs,3085);
    assert.end();
  } catch(e) {
    assert.fail(e);
  }
});

test('Test get_maptype()', async(assert) => {
  assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    let ab = fs.readFileSync(NAT_SHP).buffer;
    let nat = geoda.read_geojson(ab);
    let map_type = geoda.get_map_type(nat);
    assert.equal(map_type,5);
    assert.end();
  } catch(e) {
    assert.fail(e);
  }
});

test('Test get_colnames()', async(assert) => {
  assert.plan(1);
  try {
    const geoda = await jsgeoda.New();
    let ab = fs.readFileSync(NAT_SHP).buffer;
    let nat = geoda.read_geojson(ab);
    let col_names = geoda.get_colnames(nat);
    assert.equal(col_names[0],'REGIONS');
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

    let nat = geoda.read_geojson(ab);
    let w = geoda.queen_weights(nat);
    const hr60 = geoda.get_col(nat, "HR60");

    let clst = geoda.skater(w, 5, [hr60]);
    assert.equal(clst.ratio, 0.28469714844538363);

    assert.end();
  } catch(e) {
    assert.fail(e);
  }
});
