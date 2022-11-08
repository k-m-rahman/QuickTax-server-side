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
app.use(express.json());

//database integration

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.siwxcfo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const serviceCollection = client.db("quickTax").collection("services");

// for implementing search query

serviceCollection.createIndex({ title: "text" });

async function run() {
  try {
    // services api

    app.get("/services", async (req, res) => {
      let query = {};

      // getting the search text
      if (req.query.searchQuery) {
        query = { $text: { $search: `${req.query.searchQuery}` } };
      } else if (req.query.limit) {
        query = {};
        const services = await serviceCollection
          .find(query)
          .limit(parseInt(req.query.limit))
          .toArray();

        return res.send(services);
      }

      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
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
