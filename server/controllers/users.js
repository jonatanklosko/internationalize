'use strict';
const User = require('../models/user');
const status = require('http-status');

class UsersController {
  create(req, res, next) {
    User.create(req.body)
      .then(user =>
        req.logIn(user, error =>
          error ? next(error)
                : res.status(status.CREATED).json({ user })))
      .catch(error => res.status(status.UNPROCESSABLE_ENTITY).json({ errors: error.errors }));
  }
}

module.exports = new UsersController();
