process.env.NODE_ENV = 'test';
const app = require('../../server/app');

exports.config = {
  framework: 'jasmine',

  baseUrl: process.env.BASE_URL,

  onPrepare: () => {
    require('./support/matchers');
    require('./support/locators');
    global.factory = require('./support/factory');
    global.helpers = require('./support/helpers');

    // Add jasmine spec reporter.
    const JasmineSpecReporter = require('jasmine-spec-reporter');
    jasmine.getEnv().addReporter(new JasmineSpecReporter());

    // Set up cleaning database before each spec.
    beforeEach(done => {
      require('mongoose').connection.db.dropDatabase(done);
    });

    return new Promise((resolve) => app.run(resolve));
  },

  onCleanUp: () => app.close(),

  jasmineNodeOpts: {
     print: () => {}
  }
};
