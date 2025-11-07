'use strict';
require('dotenv').config();
const cors = require("cors");
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes.js');
const auth = require('./auth.js');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Create the HTTP and Socket.IO servers
const server = http.createServer(app);
const io = new Server(server);

// Use CORS middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  })
);

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up the view engine
app.set("view engine", "pug");
app.set("views", "./views/pug");

fccTesting(app);

app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection and Passport logic
myDB(async (client) => {
  console.log("Successfully connected to database");

  const myDataBase = await client.db("database").collection("users");

  routes(app, myDataBase);
  auth(app, myDataBase);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });

  io.on('connection', socket => {
    console.log('A user has connected');
  });
})
.catch(e => {
  console.error('Database connection failed:', e);
  app.route('/').get((req, res) => {
    res.render('index', { title: 'Error', message: 'Unable to connect to database' });
  });
});