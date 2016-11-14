const express = require('express');
const path = require('path');

/* Set up the server serving *external* files. */

let fileServer = express();
const filesPath = path.resolve(__dirname, `files`);

beforeAll(done => {
  fileServer.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  fileServer.use('/files', express.static(filesPath));
  fileServer.listen(process.env.EXTERNAL_FILES_PORT, done);
});

afterAll(done => fileServer.close(done));
