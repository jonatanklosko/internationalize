const app = require('./app');

app.run(() => {
  console.log(`Server running at ${process.env.BASE_URL}`);
});
