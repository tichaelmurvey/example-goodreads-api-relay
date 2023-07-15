// These import necessary modules and set some initial variables
require("dotenv").config();
const express = require("express");
//const fetch = import("node-fetch");
// const rateLimit = require("express-rate-limit");
var cors = require("cors");
const app = express();
const port = 3000;
app.use(cors());

const latDecimalConversion = 111000; //Distance between degrees of latitude


app.get("/", (req, res) => res.send("Hello World!"));

app.get("/proxy", async (req, res) => {
  //URL variables: coords, distance, lod
  let lod = req.query.lod;
  let lines = req.query.lines;
  let distance = req.query.distance;
  let originalCoords = `${req.query.coords}`.split(",");
  console.log("Received proxy request at " + originalCoords + " with distance " + distance + " and lod " + lod);
  let promiseList = [];
  let totalLatDegrees = distance / latDecimalConversion; //Total degrees of latitude within the grid
  let latDegreeInterval = totalLatDegrees / lod; //Number of degrees of latitude between fetch points

  for (let i = 0; i < lines; i++) {
    let latToGet = Number(originalCoords[0]) + totalLatDegrees / 2 - latDegreeInterval * i;
    let baseLong = Number(originalCoords[1]);
    let longDecimalConversion = longitudeDistance(latToGet); //Distance between degrees of longitude at the given latitude
    let totalLongDegrees = distance / longDecimalConversion;
    let minCoord = [latToGet, baseLong - totalLongDegrees / 2];
    let maxCoord = [latToGet, baseLong + totalLongDegrees / 2];
    //console.log("getting line between" + minCoord + " and " + maxCoord);
    let fetchURL = `${process.env.TOPO_URL}${minCoord.join(",") + "|" + maxCoord.join(",")}&samples=${lod}`;
    console.log(fetchURL)
    promiseList.push(
      fetch(fetchURL)
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


app.listen(port, () => console.log(`listening on port ${port}!`));

function longitudeDistance(latitude) {
  var latitudeRadians = latitude * Math.PI / 180;
  return ((Math.PI / 180) * 6368000 * Math.cos(latitudeRadians));
}