# jsgeoda

[![Build jsgeoda](https://github.com/GeoDaCenter/jsgeoda/actions/workflows/build_and_publish.yml/badge.svg)](https://github.com/GeoDaCenter/jsgeoda/actions/workflows/build_and_publish.yml)

jsgeoda is the first javascript library for spatial data analysis with functionalities of choropleth mapping, spatial weights, local indicators of spatial association,  spatial clustering, and cluster analysis. With a few lines of code, you can run spatial data analysis in a web browser or in Node.js:

```javascript
import jsgeoda from 'jsgeoda';

const geoda = await jsgeoda.New();

// get geojson 
const response = await fetch("./natregimes.geojson");
const ab = response.arrayBuffer();

// read geojson in jsgeoda
const nat = geoda.readGeoJSON(ab);

// create Queen contiguity weights
const w = geoda.getQueenWeights(nat);

// get values of variable "HR60"
const hr60 = geoda.getColumn("HR60");

// apply local Moran statistics on variable "HR60"
const lm = geoda.localMoran(w, hr60);
```

### Installation

```bash
$ npm i --save jsgeoda
```

### Documentation

https://jsgeoda.libgeoda.org



### Hands-On Tutorials:


1. Hello jsgeoda!

https://codesandbox.io/s/1-hello-jsgeoda-foq4j

2. Load spatial data

https://codesandbox.io/s/2-load-spatial-data-dgcux

3. Choropleth Mapping

https://codesandbox.io/s/3basicmapping-lcguj

4. Spatial Weights

https://codesandbox.io/s/4spatial-weights-owi84

5. Univariate LISA

https://codesandbox.io/s/5lisaunivariate-zhhop

6. Multivariate LISA

https://codesandbox.io/s/6lisamultivariate-4w3hk

7. Spatial Clustering

https://codesandbox.io/s/7spatialclustering-uvz12

![jsgeoda](https://gblobscdn.gitbook.com/assets%2F-MMxWNyMbqx5YG1sT6E6%2F-MbTjHyVo53-xm01YxSN%2F-MbTjL-sLNcPihx8_IbV%2FScreen%20Shot%202021-06-05%20at%205.33.17%20PM.png?alt=media&token=3d0934a8-fd16-455c-a09b-e8a403f6e5ce)

### Authors

Xun Li, Luc Anselin



