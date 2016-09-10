process.env.NODE_ENV = 'test';
require('app-module-path').addPath(`${__dirname}/../../server`);

/* Workaround, see: https://github.com/matthewjh/jasmine-promises/issues/8 */
global.jasmineRequire = { interface: () => {} };
require('jasmine-promises');

const mongoose = require('mongoose');
      factoryGirl = require('factory-girl');

global.factory = factoryGirl.factory;
factory.setAdapter(new factoryGirl.MongooseAdapter());

global.request = require('superagent');
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
/* Prefix paths with the base url.
   Temporary solution until https://github.com/koenpunt/superagent-use/pull/3
   is merged and both superagent-use and superagent-prefix can be used. */
const _end = request.Request.prototype.end;
request.Request.prototype.end = function(fn) {
  if(this.url[0] === '/') {
    this.url = `${process.env.BASE_URL}${this.url}`;
  }
  return _end.call(this, fn);
};

const app = require('app');

beforeEach(done => {
  app.run(() => {
    // Clean the database.
    mongoose.connection.db.dropDatabase(done);
  });
});

afterEach(done => app.close(done));
