"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { ObjectId } = require("mongodb");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

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

// Start server first
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// Root route (available immediately)
app.route("/").get((req, res) => {
  res.render("index", {
    title: "Connected to Database",
    message: "Please log in",
    showLogin: true,
    showRegistration: true,
    showSocialAuth: true
  });
});

// Database connection and Passport logic
myDB(async (client) => {
  console.log("Successfully connected to database");

  const myDataBase = await client.db("database").collection("users");

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
})
.catch((e) => {
  console.error("Database connection error:", e);
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});