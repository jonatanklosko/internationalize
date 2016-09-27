/* Load environment variables. */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require(`./config/environments/${process.env.NODE_ENV}`);

/* Load dependencies. */
const express = require('express'),
      mongoose = require('mongoose'),
      path = require('path'),
      bodyParser = require('body-parser'),
      session = require('express-session'),
      MongoDbStore = require('connect-mongodb-session')(session),
      passport = require('./config/passport'),
      appRouter = require('./config/routes');

mongoose.Promise = Promise;

/* Create the app. */
let app = express();

/* Register the middleware used. */

const staticFilesPath = path.join(`${__dirname}/../client`);
app.use(express.static(staticFilesPath));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new MongoDbStore({
    uri: process.env.MONGODB_URI,
    collection: 'userSessions'
  }),
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(appRouter);

/* Expose the app module API. */

let server;

module.exports = app;

module.exports.run = (callback) => {
  mongoose.connect(process.env.MONGODB_URI).then(() => {
    server = app.listen(process.env.PORT, callback);
  });
};

module.exports.close = (callback) => {
  mongoose.connection.close().then(() => {
    server.close(callback);
  });
};
