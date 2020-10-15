const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const port = 5000;
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const { ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('services'));
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rdyuw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const customersCollection = client.db("creativeAgency").collection("customers");
    const servicesCollection = client.db("creativeAgency").collection("services");
    const reviewsCollection = client.db("creativeAgency").collection("reviews");
    const adminCollection = client.db("creativeAgency").collection("admin");

    // -------------- ADD SERVICE --------------
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const title = req.body.title;
        const description = req.body.description;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        servicesCollection.insertOne({ title, description, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
            .catch(err => {
                console.log(err);
            })
    })

    // -------------- FETCH SERVICES --------------
    app.get('/services', (req, res) => {
        servicesCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    // -------------- FETCH SELECTED SERVICE --------------
    app.get('/service/:serviceId', (req, res) => {
        servicesCollection.find({ _id: ObjectId(req.params.serviceId) })
            .toArray((err, document) => {
                res.status(200).send(document[0]);
            })
    })

    // -------------- ADD CUSTOMER --------------
    app.post('/addCustomer', (req, res) => {
        const customer = req.body;
        customersCollection.insertOne(customer)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    // -------------- FETCH CUSTOMER BY EMAIL --------------
    app.get('/customer', (req, res) => {
        customersCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    })
   
    // -------------- FETCH ALL CUSTOMER --------------
    app.get('/allData', (req, res) => {
        customersCollection.find({})
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    })

    // -------------- ADD CUSTOMER REVIEW --------------
    app.post('/review', (req, res) => {
        const review = req.body;
        reviewsCollection.insertOne(review)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    // -------------- FETCH ALL REVIEWS --------------
    app.get('/allReviews', (req, res) => {
        reviewsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    // -------------- ADD ADMIN --------------
    app.post('/addAdmin', (req, res) => {
        const admin = req.body;
        adminCollection.insertOne(admin)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    // -------------- CHECK ADMIN --------------
    app.get('/isAdmin', (req, res) => {
        adminCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    })

    // -------------- UPDATE PRODUCT STATUS --------------
    app.patch('/updateStatus', (req, res) => {
        customersCollection.updateOne(
            { _id: ObjectId(req.body.id) },
            {
                $set: { status: req.body.updatedStatus },
                $currentDate: { "lastModified": true }
            }
        )
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })

});

app.get('/', (req, res) => {
    res.send('DataBase connected')
})

app.listen(process.env.PORT || port, () => console.log(`Listening to port http://localhost:${port}`))