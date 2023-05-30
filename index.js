const express =require('express');
const cors=require('cors');
const jwt=require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express();
const port=process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());


console.log(process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rin8xcl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//jwt function-------

const verifyJWT=(req,res,next)=>{
  console.log('hitting verify JWT')
  console.log(req.headers.authorization);
  const authorization=req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true ,message:'unauthorized access'})
  }
  const token= authorization.split(' ')[1];
  console.log('token inside verify JWT', token)
 jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
  if(error){
    return res.status(401).send({error: true , message :'unauthorized access'})
  }
  req.decoded = decoded;
  next()
}
)

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
 const serviceCollection=client.db('carDoctor').collection('services');
 const checkoutCollection=client.db('carDoctor').collection('checkout')

 //JWT TOKEN 
 app.post('/jwt',(req,res)=>{
  const user=req.body;
  console.log(user);
  const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
    expiresIn:'1h'});
    console.log(token);
    //todo object token
    res.send({token})
 })


 //GET FOR SERVICE DATA
 app.get('/services',async(req,res)=>{
    const cursor=serviceCollection.find();
    const result=await cursor.toArray();
    res.send(result)
 })

 app.get('/services/:id',async(req,res)=>{
    const id=req.params.id;
    const query={_id: new ObjectId(id)};
        const options = {
           // Include only the `title` and `imdb` fields in the returned document
           projection: { title: 1,service_id:1, price:1 , img:1 },
           };
    const result=await serviceCollection.findOne(query,options);
    res.send(result)

 })
//get some data 
app.get('/bookings',verifyJWT,async(req,res)=>{
  const decoded=req.decoded;
  
  console.log('come  back after verify',decoded)
 if(decoded.email !== req.query.email){
  return res.status(403).send({error:1 , message:'forbiden access'})
 }

  //console.log(req.headers.authorization)
  let query={};
  if(req.query?.email){
    query={email : req.query.email}
  }
  const result=await checkoutCollection.find(query).toArray();
  res.send(result)
})


 //post checkout..
 app.post('/checkout/',async(req,res)=>{
    const checkout=req.body;
    console.log(checkout)
    const result=await checkoutCollection.insertOne(checkout);
    res.send(result)
 })

//delete bookings specific item...

app.delete('/bookings/:id',async(req,res)=>{
  const id=req.params.id;
  const query={_id: new ObjectId(id)};
  const result=await checkoutCollection.deleteOne(query);
  res.send(result)
})
////update//
//app.patch('/bookings/:id',async(req,res)=>{
//  const id=req.params.id;
//  const filter={_id: new ObjectId(id)};
//  
//  const updatedBooking=req.body;
//  console.log(updatedBooking)
//  const updateDoc={
//    $set:{
//      status:updatedBooking.status
//    },
//  };
//  const result=await checkoutCollection.updateOne(filter,updateDoc);
//  res.send(result)
//})
//
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
 //  await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('car doctor server is running')
});
app.listen(port,()=>{
  console.log(`server is running on Port:${port}`)
})