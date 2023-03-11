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

app.listen(port, () => console.log(`listening on port ${port}!`));
