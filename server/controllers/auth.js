'use strict';
const status = require('http-status');
const passport = require('passport');

class AuthController {
  signIn(req, res, next) {
    passport.authenticate('local', {
      badRequestMessage: 'Please provide both username and password.'
    }, (error, user, info) => {
      if(error) {
        next(error);
      } else if(info) {
        res.status(status.UNAUTHORIZED).json({ error: info.message });
      } else {
        req.logIn(user, error =>
          error ? next(error) : res.status(status.OK).json({ user }));
      }
    })(req, res, next);
  }

  signOut(req, res) {
    req.logOut();
    res.status(status.OK).json({ message: 'Signed out successfully.' });
  }

  me(req, res) {
    res.status(status.OK).json({ user: req.user });
  }
}

module.exports = new AuthController();
