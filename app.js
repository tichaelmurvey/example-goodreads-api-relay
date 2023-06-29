// These import necessary modules and set some initial variables
require("dotenv").config();
const express = require("express");
//const fetch = import("node-fetch");
const convert = require("xml-js");
// const rateLimit = require("express-rate-limit");
var cors = require("cors");
const app = express();
const port = 3000;
app.use(cors());
app.get("/", (req, res) => res.send("Hello World!"));
const latDecimalConversion = 111000; //Distance between degrees of latitude

app.get("/api/grid", async (req, res) => {
  try {
    let fetchList = [];
    elevationGrid = [];
    const originalCoords = `${req.query.originalcoords}`.split(",");
    const distance = `${req.query.distance}`;
    const numPoints = `${req.query.lod}`;

    let lineOffset = distance / numPoints; //Distance between intervals for the purpose of graphing
    let totalLatDegrees = distance / latDecimalConversion; //Total degrees of latitude within the grid
    let latDegreeInterval = totalLatDegrees / numPoints; //Number of degrees of lattitude between fetch points
    console.log("got params", originalCoords, distance, numPoints);

    for (let i = 0; i < numPoints; i++) {
      let latToGet = Number(originalCoords[0]) + totalLatDegrees / 2 - latDegreeInterval * i;
      let baseLong = Number(originalCoords[1]);
      console.log("getting latitude line at " + latToGet);
      let longDecimalConversion = longitudeDistance(latToGet); //Distance between degrees of longitude at the given latitude
      let totalLongDegrees = distance / longDecimalConversion;
      let minCoord = [latToGet, baseLong - totalLongDegrees / 2];
      let maxCoord = [latToGet, baseLong + totalLongDegrees / 2];
      // let coords = minCoord.join(",") + "|" + maxCoord.join(",");
      let coords = [minCoord, maxCoord]
      fetchList.push(coords);
    }
    console.log("getting " + fetchList.length + " lines");
    console.log(fetchList);
    Promise.all(
      fetchList.map(async(line, index) => {
        //Wait a bit to return
        return new Promise(
        resolve => setTimeout(resolve, 1100*index))
        .then(async() => {
          const response = await fetch(`${process.env.TOPO_URL}${line[0].join(",") + "|" + line[1].join(",")}&samples=${numPoints}`)
          //console.log("got line at " + line[0][0])
          return await response.json()  
        })
      })
    )
     .then(
      response => {
        res.json({
          results: response
        });
      }
     )
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


app.get("/proxy", async (req, res) => {
  console.log("got a request at proxy endpoint")
  //URL variables: basepoint, distance, lod
  let lod = req.query.lod;
  let distance = req.query.distance;
  const originalCoords = `${req.query.coords}`.split(",");
  let promiseList = [];
  let totalLatDegrees = distance / latDecimalConversion; //Total degrees of latitude within the grid
  let latDegreeInterval = totalLatDegrees / lod; //Number of degrees of latitude between fetch points
  console.log("calculated variables")

  for (let i = 0; i < lod; i++) {
    let latToGet = Number(originalCoords[0]) + totalLatDegrees / 2 - latDegreeInterval * i;
    let baseLong = Number(originalCoords[1]);
    let longDecimalConversion = longitudeDistance(latToGet); //Distance between degrees of longitude at the given latitude
    let totalLongDegrees = distance / longDecimalConversion;
    let minCoord = [latToGet, baseLong - totalLongDegrees / 2];
    let maxCoord = [latToGet, baseLong + totalLongDegrees / 2];
    //console.log("getting line between" + minCoord + " and " + maxCoord);
    promiseList.push(
      fetch(`${process.env.TOPO_URL}${minCoord.join(",") + "|" + maxCoord.join(",")}&samples=${lod}`)
    )
  }
  console.log("constructed promise list");

  Promise.all(promiseList)
    .then(responses => {
      return Promise.all(responses.map(response => response.json()))
    })
    .then(response => {
      //Built grid
      //console.log(response[0].results);
      let grid = response.map(line => {
        return line.results.map(point => {
          return point.elevation
          });
      });
      console.log(grid);
      return grid;
    })
    .then(response => {
      res.send(response);
    })
});


app.get("/proxytest", async (req, res) => {
  //TODO: Integrate line request making into the proxy
  for(let i = 0; i < requestNum; i++) {
    promiseList.push(fetch(`${url}coords=10,60|10,60&samples=${requestSize}`));
  }

  
  try {
    const response = await fetch(`${process.env.TOPO_URL}${req.query.coords}&samples=${req.query.samples}`);
    const data = await response.json();
    res.json({
      results: data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

function longitudeDistance(latitude) {
  var latitudeRadians = latitude * Math.PI / 180;
  return ((Math.PI / 180) * 6368000 * Math.cos(latitudeRadians));
}


app.listen(port, () => console.log(`listening on port ${port}!`));
