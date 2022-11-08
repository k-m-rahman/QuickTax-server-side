const express = require("express");
const cors = require("cors");
require("colors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
const reviewsCollection = client.db("quickTax").collection("reviews");

// for implementing search query on services
serviceCollection.createIndex({ title: "text" });

async function run() {
  try {
    // all services api
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

    // single service api
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // reviews api
    app.get("/reviews", async (req, res) => {
      let query = {};

      if (req.query.serviceId) {
        query = { serviceId: req.query.serviceId };
        console.log(req.query.serviceId.bgRed);
      }
      const reviews = await reviewsCollection.find(query).toArray();
      res.send(reviews);
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
