const controllers = require('../controllers');

module.exports = app => {

  /* Application routes. */

  /* ... */

  /* Serve Angular on '/' or when nothing else matches. */
  app.get('*', (req, res) => {
    res.sendFile(require('path').join(__dirname + '/../../client/index.html'));
  });
};
