require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

module.exports = function (app, myDataBase) {
  // Local strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) return done(null, false);
      return done(null, user);
    });
  }));

  // GitHub strategy (social authentication)
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'https://advanced-node-q4k3.onrender.com/auth/github/callback'
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log('GitHub profile:', profile);

      // Add database logic here to find or create the user
      // For now, FCC just wants it to log your GitHub profile and call cb(null, profile)
      return cb(null, profile);
    }
  ));

  // Serialization
  passport.serializeUser((user, done) => {
    done(null, user.id || user._id); // Works for both local and GitHub users
  });

  // Deserialization
  passport.deserializeUser(async (id, done) => {
    try {
      const doc = await myDataBase.findOne({ _id: new ObjectId(id) });
      done(null, doc);
    } catch (err) {
      done(err, null);
    }
  });
};
