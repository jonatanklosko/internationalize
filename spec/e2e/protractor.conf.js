process.env.NODE_ENV = 'test';
const app = require('../../server/app');

exports.config = {
  framework: 'jasmine',
  baseUrl: 'http://localhost:3002', // The URL where webpack-dev-server runs (`npm run pre:test:e2e`).
  specs: ['./features/**/*.spec.js'],
  onPrepare: () => {
    require('./support/matchers');
    require('./support/locators');
    global.factory = require('./support/factory');
    global.helpers = require('./support/helpers');

    // Add jasmine spec reporter.
    const JasmineSpecReporter = require('jasmine-spec-reporter');
    jasmine.getEnv().clearReporters();
    jasmine.getEnv().addReporter(new JasmineSpecReporter());

    // Set up cleaning database before each spec.
    beforeEach(done => {
      require('mongoose').connection.db.dropDatabase(done);
    });

    return new Promise((resolve) => app.run(resolve));
  },
  onCleanUp: () => app.close()
};
