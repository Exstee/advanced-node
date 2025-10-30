'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // ✅ Import cors
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

// ✅ Use cors middleware
// This automatically sets the Access-Control-Allow-* headers safely
app.use(cors({
  origin: '*', // allows requests from any domain (use specific domains in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
}));

app.set('view engine', 'pug');
app.set('views', './views/pug');
fccTesting(app); // For fCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.route('/').get((req, res) => {
  res.render('index', { title: 'Hello', message: 'Please log in' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
