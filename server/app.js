/* Load environment variables. */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require(`./config/environments/${process.env.NODE_ENV}`);

/* Load dependencies. */
const express = require('express'),
      mongoose = require('mongoose'),
      path = require('path'),
      bodyParser = require('body-parser');

mongoose.Promise = Promise;

/* Create the app. */
let app = express();

/* Register used middleware. */

app.use(bodyParser.json());

const staticFilesPath = path.join(`${__dirname}/../client`);
app.use(express.static(staticFilesPath));

require('./config/routes')(app);

/* Expose app module API. */

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
