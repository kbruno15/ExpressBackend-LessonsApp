require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

// CONFIG
const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'after_school_app';
const MONGODB_URI =
  process.env.MONGODB_URI;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  if (Object.keys(req.body || {}).length > 0) {
    console.log(' Body:', JSON.stringify(req.body));
  }
  next();
});

// Static file middleware for lesson images
const imageDir = path.join(__dirname, 'images');

app.get('/images/:filename', (req, res) => {
  const filePath = path.join(imageDir, req.params.filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.sendFile(filePath);
  });
});


// MONGODB CONNECTION
let lessonsCollection;
let ordersCollection;

MongoClient.connect(MONGODB_URI)
  .then((client) => {
    console.log('Connected to MongoDB Atlas');
    const db = client.db(DB_NAME);
    lessonsCollection = db.collection('lessons');
    ordersCollection = db.collection('orders');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ROUTES

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Lessons API running' });
});

// GET /lessons  (return all lessons as JSON)
app.get('/lessons', (req, res) => {
  lessonsCollection
    .find({})
    .toArray()
    .then((results) => res.json(results))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch lessons' });
    });
});

// GET /search?q=... (full-text-style search across fields)
app.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();

  if (!q) {
    lessonsCollection
      .find({})
      .toArray()
      .then((results) => res.json(results))
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to search lessons' });
      });
    return;
  }

  const regex = new RegExp(q, 'i');
  const maybeNumber = Number(q);
  const numberFilters = isNaN(maybeNumber)
    ? []
    : [{ price: maybeNumber }, { space: maybeNumber }];

  const filter = {
    $or: [{ topic: regex }, { location: regex }, ...numberFilters],
  };

  lessonsCollection
    .find(filter)
    .toArray()
    .then((results) => res.json(results))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Failed to search lessons' });
    });
});

// POST /orders (save new order)
app.post('/orders', (req, res) => {
  const { name, phone, items } = req.body;

  if (!name || !phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }

  const orderDoc = {
    name,
    phone,
    items: items.map((i) => ({
      lessonId: new ObjectId(i.lessonId),
      quantity: i.quantity,
    })),
    createdAt: new Date(),
  };

  ordersCollection
    .insertOne(orderDoc)
    .then((result) => {
      res
        .status(201)
        .json({ message: 'Order created', orderId: result.insertedId });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Failed to save order' });
    });
});

// PUT /lessons/:id (update any attribute, typically "space")
app.put('/lessons/:id', (req, res) => {
  const id = req.params.id;

  const updatedFields = req.body || {};
  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  if (updatedFields.price !== undefined) {
    updatedFields.price = Number(updatedFields.price);
  }
  if (updatedFields.space !== undefined) {
    updatedFields.space = Number(updatedFields.space);
  }

  lessonsCollection
    .updateOne({ _id: new ObjectId(id) }, { $set: updatedFields })
    .then((result) => {
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json({ message: 'Lesson updated' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Failed to update lesson' });
    });
});
