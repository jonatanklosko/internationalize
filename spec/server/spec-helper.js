process.env.NODE_ENV = 'test';
require('app-module-path').addPath(`${__dirname}/../../server`);

/* Workaround, see: https://github.com/matthewjh/jasmine-promises/issues/8 */
global.jasmineRequire = { interface: () => {} };
require('jasmine-promises');

const app = require('app');
const mongoose = require('mongoose');
const superagent = require('superagent');
const superagentUse = require('superagent-use');
const superagentPrefix = require('superagent-prefix');

global.factory = require('../support/factory');

global.request = superagentUse(superagent);
request.use(superagentPrefix(process.env.BASE_URL));

let cookie;
/**
 * Sends the request and returns a promise.
 *
 * Also it handles cookies stuff, so it fits tests with a user session involved.
 *
 * @returns {Promise} Resolved with a response or rejected with an error.
 */
request.Request.prototype.promisify = function() {
  /* Set cookies for this request. */
  if(cookie) {
    this.set('Cookie', cookie);
  }
  return new Promise((resolve, reject) => {
    this.end((error, response) => {
      /* Store the cookies from the response. */
      cookie = response && response.headers && response.headers['set-cookie'];
      /* If `error.status` is present, then the error has been caused
         by unsuccessful http status. Don't treat this as an error (that simplifies making assertions). */
      if(!error || error.status) {
        resolve(response);
      } else {
        reject(error);
      }
    });
  });
};
/* Clean cookies before each test. */
beforeEach(() => cookie = null);

require('../support/file-server');

/* Set up the app. */

beforeEach(done => {
  app.run(() => {
    /* Clean the database. */
    mongoose.connection.db.dropDatabase(done);
  });
});

afterEach(done => app.close(done));
