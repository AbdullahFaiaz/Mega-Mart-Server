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

//     // use verify admin after verifyToken
//     const verifyAdmin = async (req, res, next) => {
//       const email = req.decoded.email;
//       const query = { email: email };
//       const user = await userCollection.findOne(query);
//       const isAdmin = user?.role === 'admin';
//       if (!isAdmin) {
//         return res.status(403).send({ message: 'forbidden access' });
//       }
//       next();
//     }
//     // use verify agent after verifyToken
//     const verifyAgent = async (req, res, next) => {
//       const email = req.decoded.email;
//       const query = { email: email };
//       const user = await userCollection.findOne(query);
//       const isAgent = user?.role === 'agent';
//       if (!isAgent) {
//         return res.status(403).send({ message: 'forbidden access' });
//       }
//       next();
//     }











// // get role from useRole hook
//     app.get("/user-role/:email",verifyToken, async(req,res)=> {
//       const email = req.params.email
//       const result = await userCollection.findOne({email: email},{role:1})
//       res.send(result)
//     })

// // get all users
//       app.get("/users",verifyToken,verifyAdmin, async(req,res)=> {
//         const result = await userCollection.find().toArray()
//         res.send(result)
//       } )
// //making an admin

// app.patch("/users/admin/:id", async (req, res) => {
//   const id = req.params.id;
//   const email = req.body.email;
//   const role = req.body.role;

//   try {
//     const objectId = new ObjectId(id); // Ensure id is valid ObjectId
//     const filter = { _id: objectId };
//     const updatedDoc = { $set: { role: role } };
//     const updateProperty = { $set: { role: 'admin' } };

//     // Log the email being used for the query
//     console.log('Email for update:', email);

//     // Update the property collection
//     const updatePropertyResult = await propertyCollection.updateMany({ email: email }, updateProperty);
//     console.log('updatePropertyResult:', updatePropertyResult);

//     // Update the user collection
//     const updateUserResult = await userCollection.updateOne(filter, updatedDoc);
//     console.log('updateUserResult:', updateUserResult);

//     res.send(updateUserResult);
//   } catch (error) {
//     console.error('Error during update:', error);
//     res.status(500).send({ error: "Failed to update user role to admin" });
//   }
// });




//       // app.patch("/users/admin/:id", async(req,res)=> {
//       //   const id = req.params.id;
//       //   const role = req.body
//       //   const filter = {_id: new ObjectId(id)};
//       //   const updatedDoc = {
//       //     $set: role

//       //   }
//       //   const result = await userCollection.updateOne(filter,updatedDoc)
//       //   res.send(result)
//       // })





// app.patch("/users/agent/:id", async (req, res) => {
//   const id = req.params.id;
//   const email = req.body.email;
//   const role = req.body.role;

//   try {
//     const objectId = new ObjectId(id); // Ensure id is valid ObjectId
//     const filter = { _id: objectId };
//     const updatedDoc = { $set: { role: role } };
//     const updateProperty = { $set: { role: 'agent' } };

//     // Log the email being used for the query
//     console.log('Email for update:', email);

//     // Update the property collection
//     const updatePropertyResult = await propertyCollection.updateMany({ email: email }, updateProperty);
//     console.log('updatePropertyResult:', updatePropertyResult);

//     // Update the user collection
//     const updateUserResult = await userCollection.updateOne(filter, updatedDoc);
//     console.log('updateUserResult:', updateUserResult);

//     res.send(updateUserResult);
//   } catch (error) {
//     console.error('Error during update:', error);
//     res.status(500).send({ error: "Failed to update user role to agent" });
//   }
// });



// app.patch("/users/user/:id", async (req, res) => {
//   const id = req.params.id;
//   const email = req.body.email;
//   const role = req.body.role;

//   try {
//     const objectId = new ObjectId(id); // Ensure id is valid ObjectId
//     const filter = { _id: objectId };
//     const updatedDoc = { $set: { role: role } };
//     const updateProperty = { $set: { role: 'user' } };

//     // Log the email being used for the query
//     console.log('Email for update:', email);

//     // Update the property collection
//     const updatePropertyResult = await propertyCollection.updateMany({ email: email }, updateProperty);
//     console.log('updatePropertyResult:', updatePropertyResult);

//     // Update the user collection
//     const updateUserResult = await userCollection.updateOne(filter, updatedDoc);
//     console.log('updateUserResult:', updateUserResult);

//     res.send(updateUserResult);
//   } catch (error) {
//     console.error('Error during update:', error);
//     res.status(500).send({ error: "Failed to update user role to user" });
//   }
// });

// // app.get('/fraudUser', async (req, res) => {
// //   const id = req.query.id
// //   const result = await userCollection.findOne({_id: new ObjectId(id)})
// //   res.send(result)

// // })
// app.get('/fraudUser', async (req, res) => {
//   const id = req.query.id;

//   // Validate the id
//   if (!ObjectId.isValid(id)) {
//     return res.status(400).send({ error: 'Invalid ID format' });
//   }

//   try {
//     const result = await userCollection.findOne({ _id: new ObjectId(id) });
//     res.send(result);
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).send({ error: 'An error occurred while fetching the user' });
//   }
// });


// // Marking as fraud
// app.patch("/users/fraud/:id", async (req, res) => {
//   const id = req.params.id;
//   const email = req.body.email;
//   const role = req.body.role;

//   try {
//     const objectId = new ObjectId(id); // Ensure id is valid ObjectId
//     const filter = { _id: objectId };
//     const updatedDoc = { $set: { role: role } };
//     const updateProperty = { $set: { role: 'fraud' } };

//     // Log the email being used for the query
//     console.log('Email for update:', email);

//     // Update the property collection
//     const updatePropertyResult = await propertyCollection.updateMany({ email: email }, updateProperty);
//     console.log('updatePropertyResult:', updatePropertyResult);

//     // Update the user collection
//     const updateUserResult = await userCollection.updateOne(filter, updatedDoc);
//     console.log('updateUserResult:', updateUserResult);

//     res.send(updateUserResult);
//   } catch (error) {
//     console.error('Error during update:', error);
//     res.status(500).send({ error: "Failed to update user role to fraud" });
//   }
// });

// // isAdmin 
// app.get('/users/admin/:email', async (req, res) => {
//   const email = req.params.email;

//   // if (email !== req.decoded.email) {
//   //   return res.status(403).send({ message: 'forbidden access' })
//   // }

//   const query = { email: email };
//   const user = await userCollection.findOne(query);
//   let admin = false;
//   if (user) {
//     admin = user?.role === 'admin';
//   }
//   res.send({ admin });
// })

// // isAgent 
// app.get('/users/agent/:email', async (req, res) => {
//   const email = req.params.email;

//   // if (email !== req.decoded.email) {
//   //   return res.status(403).send({ message: 'forbidden access' })
//   // }

//   const query = { email: email };
//   const user = await userCollection.findOne(query);
//   let agent = false;
//   if (user) {
//     agent = user?.role === 'agent';
//   }
//   res.send({ agent });
// })
// // isUser 
// app.get('/users/user/:email', async (req, res) => {
//   const email = req.params.email;

//   // if (email !== req.decoded.email) {
//   //   return res.status(403).send({ message: 'forbidden access' })
//   // }

//   const query = { email: email };
//   const theUser = await userCollection.findOne(query);
//   let user = false;
//   if (user) {
//     user = theUser?.role === 'user';
//   }
//   res.send({ user });
// })

// //delete user
// app.delete('/users/delete/:id',async(req,res)=>{
//   const id = req.params.id
//   const query = {_id: new ObjectId(id)}
//   const result = await userCollection.deleteOne(query)
//   res.send(result)
// })


// //query 
//     app.get("/myAddedProperties", async(req,res)=>{
//       //req.user (=decoded) is coming from verifyToken
//     // verify email
//       // if(req.query.email !== req.user.email){
//       //   return res.status(403).send({message:'forbidden access'})
//       // }

//       let query = {}
//       // const options = {
//       //   projection: { product_type: 1, image: 1, price:1 },
//       // };
//       if(req.query.email){
//         query = {email: req.query.email}
//         console.log(query)
//       }
//       const result = await propertyCollection.find(query).toArray()
//       res.send(result)
//     })

//     //delete my added property
// app.delete('/myAddedProperties/:id',async(req,res)=>{
//   const id = req.params.id
//   console.log('plz delete property ', id)
//   const query = {_id: new ObjectId(id)}
//   const result = await propertyCollection.deleteOne(query)
//   res.send(result)
// })

//     //post from add page
//     app.post("/addProperty", async(req,res)=>{
//         const newProperty = req.body
//             const result = await propertyCollection.insertOne(newProperty); 
//             res.send(result)
//     })

//     app.get('/wishlistOne', async(req,res)=> {
//       try {
//         const id = req.query.id;

//         const wishlistItems = await wishlistCollection.findOne({ _id: new ObjectId(id) })
    
//         // Step 4: Send the properties as the response
//         res.send(wishlistItems);
//       } catch (error) {
//         console.error('Error fetching a specific wish:', error);
//         res.status(500).send({ error: 'Failed to fetch a specific wish' });
//       }
//     });

//     app.get('/wishlist', async (req, res) => {
//       try {
//         const email = req.query.email;
    
//         // Step 1: Find wishlist items for the user and project only propertyId
//         const wishlistItems = await wishlistCollection.find({ WisherEmail: email }).toArray();
    
//         // Step 4: Send the properties as the response
//         res.send(wishlistItems);
//       } catch (error) {
//         console.error('Error fetching wishlist:', error);
//         res.status(500).send({ error: 'Failed to fetch wishlist' });
//       }
//     });


// //all reviews from manage reviews page
// app.get('/allReviews', async(req,res)=>{
//   const result = await reviewCollection.find().toArray()
//   res.send(result)
// })

// // agent profiles:

// app.get("/agentProfiles", async(req,res)=> {
//   const result = await userCollection.find({role: 'agent'}).toArray()
//   res.send(result)
// } )




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