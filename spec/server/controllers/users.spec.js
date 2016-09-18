const User = require('models/user');

describe('UsersController', () => {
  describe('POST #create', () => {
    it('when the data is valid creates a new user', () => {
      return factory.attrs('user')
        .then(attributes =>
          request.post('/api/users')
            .send(attributes)
            .promisify())
        .then(() => User.count())
        .then(count => expect(count).toEqual(1));
    });

    it('when the data is invalid respods with validation errors', () => {
      return factory.attrs('user', { username: '' })
        .then(attributes =>
          request.post('/api/users')
            .send(attributes)
            .promisify())
        .then(response => {
          expect(response.status).toEqual(422);
          expect(response.body.errors.username.message).toMatch('Username is required');
        })
        .then(() => User.count())
        .then(count => expect(count).toEqual(0));
    });
  });
});
