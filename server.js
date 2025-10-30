'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

// Use cors middleware
// This automatically sets the Access-Control-Allow-* headers safely
app.use(cors({
  origin: '*', // allows requests from any domain (use specific domains in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
}));

// Set up session management
app.use(session({
  secret: process.env.SESSION_SECRET, // stored in .env
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false } // secure:false for localhost; true only with HTTPS
}));

// Initialize Passport and its session handler
app.use(passport.initialize());
app.use(passport.session());

// Set up the view engine
app.set('view engine', 'pug');
app.set('views', './views/pug');

fccTesting(app); // For fCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serialization / Deserialization logic
passport.serializeUser((user, done) => {
  done(null, user._id); // store the user’s _id in the session
});

passport.deserializeUser((id, done) => {
  // Will later fetch the full user from DB by ID.
  // Commented out for now until DB is ready:
  // myDB.findOne({ _id: new ObjectID(id) }, (err, doc) => {
  //   done(null, doc);
  // });
  done(null, null);
});

// Routes
app.route('/').get((req, res) => {
  res.render('index', { title: 'Hello', message: 'Please log in' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
