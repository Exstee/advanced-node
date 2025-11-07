const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {
  // Home route
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true // Enables GitHub login button
    });
  });

  // Local login
  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
    });

  // Profile route (protected)
  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.render('profile', { username: req.user.username });
    });

  // Logout
  app.route('/logout')
    .get((req, res, next) => {
      req.logout(err => {
        if (err) return next(err);
        res.redirect('/');
      });
    });

  // Register new user
  app.route('/register')
    .post((req, res, next) => {
      const hash = bcrypt.hashSync(req.body.password, 12);
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) return next(err);
        if (user) return res.redirect('/');

        myDataBase.insertOne(
          { username: req.body.username, password: hash },
          (err, doc) => {
            if (err) return res.redirect('/');
            // The inserted document is held within doc.ops[0]
            next(null, doc.ops[0]);
          }
        );
      });
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile');
    });

  // GitHub authentication
  app.route('/auth/github')
    .get(passport.authenticate('github'));

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
      req.session.user_id = req.user.id;
      res.redirect('/chat');
    });

  // Chat route (protected)
  app.route('/chat')
    .get(ensureAuthenticated, (req, res) => {
      res.render('chat', { user: req.user });
    });

  // 404 handler
  app.use((req, res) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
};

// Auth middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}
