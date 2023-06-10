const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


// ---------------------------------------------------- //

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uvmqfi7.mongodb.net/?retryWrites=true&w=majority`;

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
        client.connect();

        // Classes Collection
        const classesCollection = client.db("sportDb").collection('classes')
        // Instructors Collection
        const instructorsCollection = client.db("sportDb").collection('instructors')
        // Carts Collection
        const cartsCollection = client.db("sportDb").collection('carts')
        // Users Collection
        const usersCollection = client.db("sportDb").collection('users')


        // Users APIs

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);

            // For Google User Check, If they're login is first attempt or second
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User Already Exist' })
            }
            // For Google User Check, If they're login is first attempt or second

            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        // Show All Classes Data in UI
        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result);
        })

        // Show All Instructors Data in UI
        app.get('/instructors', async (req, res) => {
            const result = await instructorsCollection.find().toArray();
            res.send(result);
        })

        // Cart Collection
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }
            const query = { email: email };
            const result = await cartsCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/carts', async (req, res) => {
            const item = req.body;
            const result = await cartsCollection.insertOne(item);
            res.send(result);
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await cartsCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        })












        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// ---------------------------------------------------- //


app.get('/', (req, res) => {
    res.send('Sports Mastery Running');
})

app.listen(port, () => {
    console.log(`Sports Mastery Running on Port: ${port}`);
})