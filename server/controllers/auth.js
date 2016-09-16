const status = require('http-status'),
      passport = require('passport');

class AuthController {
  signin(req, res, next) {
    passport.authenticate('local', (error, user, info) => {
      if(error) {
        next(error);
      } else if(info) {
        res.status(status.UNAUTHORIZED).json({ error: info.message });
      } else {
        res.status(status.OK).json({ user: user });
      }
    })(req, res, next);
  }
};

module.exports = new AuthController();
