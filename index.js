const express = require("express");
const cors = require("cors");
require("colors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

//
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());

//database integration

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.siwxcfo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Quick Tax server is running");
});

app.listen(port, () => {
  console.log(`Quick tax server is running on port ${port}`.bgGreen);
});
