process.env.NODE_ENV = 'test';
require('app-module-path').addPath(`${__dirname}/../../server`);

/* Workaround, see: https://github.com/matthewjh/jasmine-promises/issues/8 */
global.jasmineRequire = { interface: () => {} };
require('jasmine-promises');

const mongoose = require('mongoose');
      factoryGirl = require('factory-girl');

global.factory = factoryGirl.factory;
factory.setAdapter(new factoryGirl.MongooseAdapter());

const app = require('app');

beforeEach(done => {
  app.run(() => {
    // Clean the database.
    mongoose.connection.db.dropDatabase(done);
  });
});

afterEach(done => app.close(done));
