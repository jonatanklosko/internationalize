/* Load environment variables. */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require(`./config/environments/${process.env.NODE_ENV}`);

/* Load dependencies. */
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const passport = require('./config/passport');
const appRouter = require('./config/routes');

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
