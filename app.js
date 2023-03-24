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
        return new Promise(resolve => setTimeout(resolve, 1100*index))
        .then(async() => {
          const response = await fetch(`${process.env.TOPO_URL}${line[0].join(",") + "|" + line[1].join(",")}&samples=${numPoints}`)
          console.log("got line at " + line[0][0])
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


function longitudeDistance(latitude) {
  var latitudeRadians = latitude * Math.PI / 180;
  return ((Math.PI / 180) * 6368000 * Math.cos(latitudeRadians));
}


app.listen(port, () => console.log(`listening on port ${port}!`));


// const apiPromises = id_array.map(async(id, index) => {
//   return new Promise(resolve => setTimeout(resolve, delay * index)).then(async() => {
//     const response = await fetch(url, obj);
//     return await response.json();
//   })
// });