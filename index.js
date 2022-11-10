const express = require("express");
const cors = require("cors");
require("colors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
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

// verifyJwt function
function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  // getting the token sent from client side
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
    if (error) {
      res.status(403).send({ message: "forbidden access" });
    }

    req.decoded = decoded;
    next();
  });
}

// getting the collections from db
const serviceCollection = client.db("quickTax").collection("services");
const reviewsCollection = client.db("quickTax").collection("reviews");

// for implementing search query on services
serviceCollection.createIndex({ title: "text" });

async function run() {
  try {
    //-----------------
    // all services api
    //-----------------

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
      }
      // implementing limit for the client side home route
      else if (req.query.limit) {
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

    //---------------
    // reviews api
    //---------------

    // api for reading the reviews
    app.get("/reviews", async (req, res) => {
      let query = {};

      if (req.query.serviceId) {
        query = { serviceId: req.query.serviceId };
      }
      const options = {
        sort: { date: -1 },
      };
      const reviews = await reviewsCollection.find(query, options).toArray();
      res.send(reviews);
    });

    //------------------------------
    //-------------------------------
    // jwt will be used from here now
    //-------------------------------

    // api for getting individual person's reviews
    app.get("/myReviews/:email", verifyJwt, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.params.email) {
        res.status(403).send({ message: "forbidden access" });
      }

      const email = req.params.email;
      let query = { email: email };
      const reviews = await reviewsCollection.find(query).toArray();
      res.send(reviews);
    });

    // api for inserting a review
    app.post("/reviews", verifyJwt, async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // api for updating a review
    app.patch("/reviews/:id", verifyJwt, async (req, res) => {
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
    app.delete("/reviews/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    // jwt api
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("QuickTax server is running");
});

app.listen(port, () => {
  console.log(`Quick tax server is running on port ${port}`.bgGreen);
});
