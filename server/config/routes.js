const controllers = require('../controllers');

module.exports = app => {

  /* Application routes. */

  app.post('/users', controllers.users.create);

  /* Serve Angular on '/' or when nothing else matches. */
  app.get('*', (req, res) => {
    res.sendFile(require('path').join(__dirname + '/../../client/index.html'));
  });
};
