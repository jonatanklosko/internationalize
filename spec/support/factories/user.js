const User = require('../../../server/models/user');

factory.define('user', User, {
  username: factory.sequence(n => `sherlock_${n}`),
  name: "Sherlock Holmes",
  password: "Password",
  passwordConfirmation: "Password"
});
