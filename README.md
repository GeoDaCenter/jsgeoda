# jsgeoda



jsgeoda is the first javascript library for spatial data analysis with functionalities of choropleth mapping, spatial weights, local indicators of spatial association,  spatial clustering, and cluster analysis. With a few lines of code, you can run spatial data analysis in a web browser or in Node.js:

```javascript
import jsgeoda from 'jsgeoda';

const geoda = await jsgeoda.New();

// get geojson 
const response = await fetch("./natregimes.geojson");
const ab = response.arrayBuffer();

// read geojson in jsgeoda
const nat = geoda.read_geojson(ab);

// create Queen contiguity weights
const w = geoda.queen_weights(nat);

// get values of variable "HR60"
const hr60 = geoda.get_col("HR60");

// apply local Moran statistics on variable "HR60"
const lm = geoda.local_moran(w, hr60);
```


### Authors

Xun Li, Luc Anselin