const Jasmine = require('jasmine');
const JasmineSpecReporter = require('jasmine-spec-reporter');

let jasmine = new Jasmine();

jasmine.loadConfig({
  spec_dir: 'spec/server',
  spec_files: [
    '**/*.spec.js'
  ],
  helpers: [
    'spec-helper.js',
    'support/**/*.js'
  ]
});
jasmine.addReporter(new JasmineSpecReporter());
jasmine.execute();
