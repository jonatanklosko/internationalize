const User = require('../models/user'),
      status = require('http-status');

class UsersController {
  create(req, res) {
    User.create(req.body)
      .then(user => res.status(status.CREATED).json({ user: user }))
      .catch(error => res.status(status.UNPROCESSABLE_ENTITY).json({ errors: error.errors }));
  }
};

module.exports = new UsersController();
