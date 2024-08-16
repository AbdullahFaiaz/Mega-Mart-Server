const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const app = express()
const port = process.env.PORT || 5000

//middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yncfr23.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

 

    const productCollection = client.db("martDB").collection("allProducts");
    const reviewCollection = client.db("estateDB").collection("review");
    const wishlistCollection = client.db("estateDB").collection("wishlist");
    const userCollection = client.db("martDB").collection("users");
    // const paymentCollection = client.db("tusharDB").collection("payments");

    const paymentCollection = client.db("estateDB").collection("payments");



    //JWT            auth related operation
    app.post('/jwt', async(req,res)=>{
      const user = req.body
      // console.log("user for token",user)

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET ,{expiresIn: '1h'})
      
      res.send({token})
    })


    app.post('/logout', async(req,res)=>{
      const user = req.body
      console.log("logging out ",user)
      res.clearCookie('token',{maxAge:0}).send({success: true})
    })


        //registration of new user from reg or login page
        app.post("/users", async(req,res)=>{
          const user = req.body
              // insert if user doesn't exist already
              const query = {email: user.email}
              const existingUser = await userCollection.findOne(query)
              if(existingUser){
                return res.send({message: "user already exists", insertedId: null})
              }
              else{
                const result = await userCollection.insertOne(user); 
                res.send(result)

              }
      })
      // my middlewares
const logger = async(req,res,next) =>{
  console.log("log: info ",req.method , req.url)
  next()
}
    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }






//details

app.get("/productDetails", async (req, res) => {
  try {
    const id = req.query.id;
    const query = { _id: new ObjectId(id) };
    const product = await productCollection.findOne(query);

    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).send({ message: "Server error", error });
  }
});



    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body; // Make sure this matches the property being sent from the frontend
      console.log("Price received:", price); // Add a log to check received price
  
      if (!price || isNaN(price)) {
          return res.status(400).send({ error: 'Invalid price' });
      }
  
      const amount = Math.round(price * 100);
      console.log(amount, 'amount inside the intent'); // Add a log to check calculated amount
  
      try {
          const paymentIntent = await stripe.paymentIntents.create({
              amount: amount,
              currency: 'usd',
              payment_method_types: ['card']
          });
  
          res.send({
              clientSecret: paymentIntent.client_secret
          });
      } catch (error) {
          console.error("Error creating payment intent:", error);
          res.status(500).send({ error: 'Failed to create payment intent' });
      }
  });
  
  


    app.get('/payments/:email', verifyToken, async (req, res) => {
      const query = { email: req.params.email }
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      const propertyId = req.body.propertyId
      const BuyerEmail = req.body.BuyerEmail
      const transactionId = req.body.transactionId
      const filter = {
        $and: [
            { propertyId: propertyId },
            { BuyerEmail: BuyerEmail }
        ]
    };
     const updateStatus = {
      $set: {Status: 'bought', transactionId }
     }
      const changeStatus = await offerCollection.updateOne(filter,updateStatus)


      res.send({ paymentResult, changeStatus});
      //paymentResult , deleteResult 
    })

    



   
    app.get("/allProducts", async(req,res)=>{
      try {
        const page = parseInt(req.query.page)
        const size = parseInt(req.query.size) 
        // console.log("getting ",page,size)
        const result = await productCollection.find()
        .skip(page*size)
        .limit(size)
        .toArray()
        res.send(result)
      }
      catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to retrieve properties" });
      }
    })

    // pagination count --public
app.get("/productCount",logger,async(req,res)=>{
  const count = await productCollection.estimatedDocumentCount()
  res.send({count})
})


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
   
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get("/",(req,res)=>{
    res.send("This is a (get) response from server")
})

app.listen(port,()=>{
    console.log(`Msg from server side: server is running on port ${port}`)
})