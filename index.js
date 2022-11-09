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

    //getting all the services
    app.get("/services", async (req, res) => {
      let query = {};

      // sorting on the base of creation of the service
      const options = {
        sort: { date: -1 },
      };

      // getting the search text
      if (req.query.searchQuery) {
        query = { $text: { $search: `${req.query.searchQuery}` } };
      } else if (req.query.limit) {
        query = {};
        const services = await serviceCollection
          .find(query, options)
          .limit(parseInt(req.query.limit))
          .toArray();

        return res.send(services);
      }

      const cursor = serviceCollection.find(query, options);
      const services = await cursor.toArray();
      res.send(services);
    });

    // creating a new service
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // single service api

    //getting single service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // reviews api

    // api for reading the reviews
    app.get("/reviews", async (req, res) => {
      let query = {};

      if (req.query.serviceId) {
        query = { serviceId: req.query.serviceId };
      } else if (req.query.email) {
        query = { email: req.query.email };
        console.log(req.query.email.bgRed);
      }
      const options = {
        sort: { date: -1 },
      };
      const reviews = await reviewsCollection.find(query, options).toArray();
      res.send(reviews);
    });

    // api for inserting a review
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // api for updating a review
    app.patch("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const rating = req.body?.rating;
      const review = req.body?.review;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          rating: rating,
          review: review,
        },
      };
      const result = await reviewsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // api for deleting a single review
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
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
