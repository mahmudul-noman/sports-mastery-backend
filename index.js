const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// Verify JWT Middleware
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized Access' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}


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
        // Carts Collection
        const cartsCollection = client.db("sportDb").collection('carts')
        // Users Collection
        const usersCollection = client.db("sportDb").collection('users')
        // Payment Collection
        // const paymentCollection = client.db("sportDb").collection('payment')

        // JWT
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })


        // Users APIs ============================================================
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })


        // Check Admin or Not
        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })

        // Check Instructor or Not
        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ instructor: false })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' }
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
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        // Set Role: Admin
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // Set Role: Instructor
        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'instructor'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })



        // ================================================== Not Work
        // app.get('/classes/:id', async (req, res) => {
        //     const result = await classesCollection.find().toArray();
        //     res.send(result);
        // })


        // // Add this route after the existing routes
        // app.patch('/classes/feedback/:id', async (req, res) => {
        //     const classId = req.params.id;
        //     const { feedback } = req.body;

        //     // Update the 'classesCollection' to include a 'feedback' field
        //     const filter = { _id: new ObjectId(classId) };
        //     const updateDoc = { $set: { feedback } };

        //     const result = await classesCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // });
        // ================================================== Not Work



        // Show All Classes Data in UI ===========================================
        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result);
        })

        app.get('/insMyClass/:email', async (req, res) => {
            const result = await classesCollection.find({ instructorEmail: req.params.email }).toArray();
            res.send(result);
        });

        // Add a Class
        app.post('/classes', verifyJWT, async (req, res) => {
            const newItem = req.body;
            const result = await classesCollection.insertOne(newItem);
            res.send(result);
        })


        // Update Class Status: Approve || Denied
        app.patch('/classes/:id/status', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;
            console.log(id, status);

            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: status
                }
            };

            const result = await classesCollection.updateOne(filter, updateDoc);
            res.send(result);
        });



        // Cart Collection =======================================================
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'Forbidden access' })
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