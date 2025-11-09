'use strict';
require('dotenv').config();
const cors = require('cors');
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes.js');
const auth = require('./auth.js');
const http = require('http');
const { Server } = require('socket.io');
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');

const app = express();

// Create HTTP + Socket.IO servers
const server = http.createServer(app);
const io = new Server(server);

// MongoStore session storage
const URI = process.env.MONGO_URI;
const store = MongoStore.create({ mongoUrl: URI });

// Enable CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  })
);

// Session middleware
app.use(
  session({
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// View engine
app.set('view engine', 'pug');
app.set('views', './views/pug');

fccTesting(app);
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO Passport authorization setup
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);

// Database + Passport logic
myDB(async (client) => {
  console.log('Successfully connected to database');
  const myDataBase = await client.db('database').collection('users');

  // Attach routes and authentication modules
  routes(app, myDataBase);
  auth(app, myDataBase);

  // Socket.IO logic
  let currentUsers = 0;
  io.on('connection', (socket) => {
    console.log(`user ${socket.request.user.username} connected`);
    ++currentUsers;

    // Broadcast that a user has joined
    io.emit('user', {
      username: socket.request.user.username,
      currentUsers,
      connected: true
    });

    // Listen for and broadcast chat messages
    socket.on('chat message', (message) => {
      io.emit('chat message', {
        username: socket.request.user.username,
        message: message
      });
    });
    
    socket.on('disconnect', () => {
      console.log(`user ${socket.request.user.username} disconnected`);
      --currentUsers;

      // Broadcast that a user has left
      io.emit('user', {
        username: socket.request.user.username,
        currentUsers,
        connected: false
      });
    });
  });

  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
})
  .catch((e) => {
    console.error('Database connection failed:', e);
    app.route('/').get((req, res) => {
      res.render('index', {
        title: 'Error',
        message: 'Unable to connect to database',
      });
    });
  });
