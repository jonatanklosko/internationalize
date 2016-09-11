const gulp = require('gulp'),
      sass = require('gulp-sass'),
      rename = require('gulp-rename'),
      concat = require('gulp-concat'),
      uglify = require('gulp-uglify'),
      babel = require('gulp-babel'),
      nodemon = require('gulp-nodemon'),
      eslint = require('gulp-eslint'),
      jasmine = require('gulp-jasmine'),
      JasmineSpecReporter = require('jasmine-spec-reporter');

/* Sass */

gulp.task('sass', () => {
  return gulp.src('client/assets/sass/main.scss')
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: ['client/vendor']
    }).on('error', sass.logError))
    .pipe(rename('app.min.css'))
    .pipe(gulp.dest('client/build'));
});

gulp.task('sass:watch', ['sass'], () => {
  gulp.watch('client/assets/sass/**/*.scss', ['sass']);
});

/* JavaScript */

gulp.task('js:app', () => {
  return gulp.src([
      'client/app/**/*module.js',
      'client/app/**/*.js'
    ])
    .pipe(concat('app.min.js'))
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('client/build'));
});

gulp.task('js', ['js:app'], () => {
  return gulp.src([
      'client/vendor/angular/angular.min.js',
      'client/vendor/angular-ui-router/release/angular-ui-router.min.js',
      'client/build/app.min.js'
    ])
    .pipe(concat('app.min.js'))
    .pipe(gulp.dest('client/build'));
});

gulp.task('js:watch', ['js'], () => {
  gulp.watch('client/**/*.js', ['js']);
});

/* Assets */

gulp.task('assets:build', ['sass', 'js']);
gulp.task('assets:watch', ['sass:watch', 'js:watch']);

/* Server */

gulp.task('server:watch', () => {
  nodemon({
    script: 'server/server.js',
    watch: ['server'],
    env: { 'NOVE_ENV': 'development' }
  });
});

/* Tests */

gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!client/build/**', '!client/vendor/**', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('test:server', () => {
  return gulp.src('spec/server/**/*.spec.js')
    .pipe(jasmine({
      reporter: new JasmineSpecReporter(),
      config: {
        spec_dir: 'spec',
        helpers: ['server/spec-helper.js', 'server/support/**/*.js']
      }
    }));
});

/* Other */

gulp.task('development', ['assets:watch', 'server:watch']);

gulp.task('default', ['development']);
