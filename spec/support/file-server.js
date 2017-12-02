const express = require('express');
const path = require('path');

/* Set up the server serving *external* files. */

let fileServer;
const filesPath = path.resolve(__dirname, `files`);

beforeAll(done => {
  let filesApp = express();
  filesApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  filesApp.use('/files', express.static(filesPath));
  fileServer = filesApp.listen(process.env.EXTERNAL_FILES_PORT, done);
});

afterAll(done => fileServer.close(done));
