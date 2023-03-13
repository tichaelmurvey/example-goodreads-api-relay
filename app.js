// These import necessary modules and set some initial variables
require("dotenv").config();
const express = require("express");
//const fetch = import("node-fetch");
const convert = require("xml-js");
// const rateLimit = require("express-rate-limit");
var cors = require("cors");
const app = express();
const port = 3000;
// const limiter = rateLimit({
//   windowMs: 1000, // 1 second
//   max: 1, // limit each IP to 1 requests per windowMs
// });
//app.use(limiter);
app.use(cors());
app.get("/", (req, res) => res.send("Hello World!"));
const latDecimalConversion = 111000; //Distance between degrees of latitude

// Our Goodreads relay route!
app.get("/api/search", async (req, res) => {
  try {
    console.log(req.query);
    const searchString = `${req.query.locations}`;

    // It uses node-fetch to call the goodreads api, and reads the key from .env
    const response = await fetch(
      `${process.env.TOPO_URL}${searchString}`,
    );
    //more info here https://www.goodreads.com/api/index#search.books
    data = await response.json();
    return res.json({
      results: data.results
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.get("/api/grid", async (req, res) => {
  try {
    let fetchList = [];
    elevationGrid = [];
    const originalCoords = `${req.query.originalcoords}`.split(",");
    const distance = `${req.query.distance}`;
    const numPoints = `${req.query.lod}`;

    let lineOffset = distance/numPoints; //Distance between intervals for the purpose of graphing
    let totalLatDegrees = distance/latDecimalConversion; //Total degrees of latitude within the grid
    let latDegreeInterval = totalLatDegrees/numPoints; //Number of degrees of lattitude between fetch points
    console.log("got params", originalCoords, distance, numPoints);

    for(let i=0; i<numPoints; i++){
      let latToGet = Number(originalCoords[0]) + totalLatDegrees/2 - latDegreeInterval*i;
      let baseLong = Number(originalCoords[1]);
      console.log("getting latitude line at " + latToGet);
      let longDecimalConversion = longitudeDistance(latToGet); //Distance between degrees of longitude at the given latitude
      let totalLongDegrees = distance/longDecimalConversion;
      let minCoord = [latToGet, baseLong - totalLongDegrees/2];
      let maxCoord = [latToGet, baseLong + totalLongDegrees/2];
      let coordString = minCoord.join(",") + "|" + maxCoord.join(",");
      fetchList.push(coordString);
    }
    console.log("getting " + fetchList.length + " lines");
    const response = await Promise.all(
      fetchList.map(line=>fetch(`${process.env.TOPO_URL}${line}&samples=${numPoints}`))
    )
    .then(function(responses){
      return Promise.all(responses.map(function(response){
          return response.json();
      }))
      }).catch(function(error){
      console.log(error);
    })

    // const response = await fetch(
    //   `${process.env.TOPO_URL}${searchString}`
    // );
    return res.json({
      results: response
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

function longitudeDistance(latitude){
  var latitudeRadians = latitude * Math.PI / 180;
  return ((Math.PI/180) *6368000*Math.cos(latitudeRadians));
}


app.listen(port, () => console.log(`listening on port ${port}!`));

