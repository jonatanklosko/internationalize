const passport = require('passport');
      LocalStrategy = require('passport-local').Strategy;
      User = require('../models/user');

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }, (error, user) => {
    if(error) {
      done(error);
    } else if(!user) {
      done(null, false, { message: 'Incorrect username.' });
    } else {
      user.authenticate(password, (error, authenticated) => {
        if(error) {
          done(error);
        } else {
          authenticated ? done(null, user)
                        : done(null, false, { message: 'Incorrect password.' });
        }
      });
    }
  });
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id, done));

module.exports = passport;
