"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { ObjectId } = require("mongodb");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

const app = express();

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

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true
    });
  });

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile', { username: req.user.username });
  });

  app.route('/logout')
    .get((req, res) => {
      req.logout(function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
  });

  app.route('/register')
  .post((req, res, next) => {
    const hash = bcrypt.hashSync(req.body.password, 12);
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        myDataBase.insertOne({
          username: req.body.username,
          password: hash
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );
  
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) { 
        return done(null, false);
      }
      return done(null, user);
    });
  }));

  // Serialization / Deserialization
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const doc = await myDataBase.findOne({ _id: new ObjectId(id) });
      done(null, doc);
    } catch (err) {
      done(err, null);
    }
  });

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

  // Start server AFTER routes are defined
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
})
.catch(e => {
  console.error('Database connection failed:', e);
  app.route('/').get((req, res) => {
    res.render('index', { title: 'Error', message: 'Unable to connect to database' });
  });
});