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

/**
 * Sends the request and returns a promise.
 *
 * @returns {Promise} Resolved with a response or rejected with an error.
 */
request.Request.prototype.promisify = function() {
  return new Promise((resolve, reject) => {
    this.end((error, response) => {
      /* If `error.status` is present, then the error has been caused
         by unsuccessful http status. Don't treat this as an error. */
      if(!error || error.status) {
        resolve(response);
      } else {
        reject(error);
      }
    });
  });
};

/* This monkeypatching is meant to provide request (superagent) with an ability
   to handle cookies stuff. It's mostly for tests when a user session is involved. */
let cookie;
const _end = request.Request.prototype.end;
request.Request.prototype.end = function(fn) {
  if(cookie) {
    this.set('Cookie', cookie);
  }
  return _end.call(this, (error, response) => {
    cookie = response && response.headers && response.headers['set-cookie'];
    fn(error, response);
  });
};
/* Clean cookies before each test. */
beforeEach(() => cookie = null);


/* Set up the app. */

beforeEach(done => {
  app.run(() => {
    /* Clean the database. */
    mongoose.connection.db.dropDatabase(done);
  });
});

afterEach(done => app.close(done));
