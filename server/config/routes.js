const Router = require('express').Router,
      controllers = require('../controllers');

let app = Router();

/* API routes ('/api') */
app.use('/api', Router()
  .post('/users', controllers.users.create)
);

/* Authentication routes ('/auth') */
app.use('/auth', Router()
  .post('/signin', controllers.auth.signin)
);

/* Application routes ('/') */

/* Serve Angular on '/' or when nothing else matches. */
app.get('*', (req, res) => {
  res.sendFile(require('path').join(__dirname + '/../../client/index.html'));
});

module.exports = app;
