module.exports = config => {
  config.set({
    browsers: ['Chrome'],
    frameworks: ['jasmine'],
    reporters: ['spec'],
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-ng-html2js-preprocessor',
      'karma-spec-reporter'
    ],
    basePath: '../../client',
    files: [
      'vendor/jquery/dist/jquery.js',
      'build/app.min.js',
      'vendor/angular-mocks/angular-mocks.js',
      'app/**/*.template.html',
      '../spec/angular-unit/**/*.spec.js'
    ],
    preprocessors: {
      'app/**/*.template.html': ['ng-html2js']
    },
    ngHtml2JsPreprocessor: {
      moduleName: 'templates',
      stripPrefix: '.*/client/'
    }
  });
};
