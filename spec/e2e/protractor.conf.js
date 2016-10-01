process.env.NODE_ENV = 'test';
const app = require('../../server/app');

exports.config = {
  framework: 'jasmine',

  baseUrl: process.env.BASE_URL,

  onPrepare: () => {
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
