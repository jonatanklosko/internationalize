const Router = require('express').Router;
const controllers = require('../controllers');
const status = require('http-status');
const path = require('path');

let app = Router();

const respondWithUnauthorizedRequest = res => res.status(status.UNAUTHORIZED).json({ error: 'Unauthorized request.' });

const authenticateUser = (req, res, next) => {
  req.isAuthenticated() ? next() : respondWithUnauthorizedRequest(res);
};

const correctUser = (req, res, next) => {
  authenticateUser(req, res, () => {
    req.params.userId === req.user.id ? next() : respondWithUnauthorizedRequest(res);
  });
};

/* API routes ('/api') */
app.use('/api', Router()
  .post('/users', controllers.users.create)
  .post('/users/:userId/translations', correctUser, controllers.translations.create)
  .get('/users/:userId/translations', correctUser, controllers.translations.index)
  .get('/users/:userId/translations/:translationId', correctUser, controllers.translations.show)
  .delete('/users/:userId/translations/:translationId', correctUser, controllers.translations.destroy)
);

/* Authentication routes ('/auth') */
app.use('/auth', Router()
  .post('/signin', controllers.auth.signIn)
  .delete('/signout', authenticateUser, controllers.auth.signOut)
  .get('/me', authenticateUser, controllers.auth.me)
);

const indexHtmlPath = path.resolve(__dirname, '../../client/build/index.html');
/* Serve the Angular app on '/*' if nothing else matches. */
app.get('/*', (req, res) => {
  res.sendFile(indexHtmlPath);
});

module.exports = app;
