Object.assign(process.env, {
  MONGODB_URI: 'mongodb://localhost:27017/internationalize_test',
  PORT: 3001,
  BASE_URL: 'http://localhost:3001',
  SESSION_SECRET: 'secret',
  EXTERNAL_FILES_PORT: 3003,
  EXTERNAL_FILES_URL: 'http://localhost:3003/files'
});
