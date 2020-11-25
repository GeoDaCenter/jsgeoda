var test  = require('tape');
var fs = require('fs');
const jsgeoda = require('../lib/index.js');
const NAT_SHP = './tests/natregimes.geojson';

test('Test CreateRookWeights()', async(assert) => {
    assert.plan(1);
    try {
      const geoda = await jsgeoda.New();
      let ab = fs.readFileSync(NAT_SHP).buffer;
      let map_uid = geoda.ReadGeojsonMap('natregimes', ab);
      let w = geoda.CreateRookWeights(map_uid, 1, false, 0);
      let w_uid = w.get_uid();
      assert.equal(w_uid, "w_rooknatregimes100");
      assert.end();
    } catch(e) {
      assert.fail(e);
    }
  });