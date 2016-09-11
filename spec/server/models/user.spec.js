const User = require('models/user');

describe('User', () => {
  it('has a working factory', () => {
    return factory.build('user')
      .then(helpers.expectDocumentToBeValid());
  });

  describe('username', () => {
    it('must be unique', () => {
      return factory.create('user', { username: 'sherlock' })
        .then(() => factory.build('user', { username: 'sherlock' }))
        .then(helpers.expectValidationErrorToMatch('has already been taken'));
    });
  });

  describe('password', () => {
    it('is required for a new object', () => {
      return factory.build('user', { password: '' })
        .then(helpers.expectValidationErrorToMatch('is required'));
    });

    it('is at least 6 characters long', () => {
      return factory.build('user', { password: 'short' })
        .then(helpers.expectValidationErrorToMatch('at least 6 characters'));
    });

    it('creates passwordDigest on assignment', () => {
      return factory.build('user', { password: "password" })
        .then(user => expect(user.passwordDigest).toBeDefined());
    });

    it('is validated even if not set', () => {
      return helpers.expectValidationErrorToMatch('Password is required')(new User());
    });
  });

  describe('passwordConfirmation', () => {
    it('matches password', () => {
      return factory.build('user', { password: "password", passwordConfirmation: "something" })
        .then(helpers.expectValidationErrorToMatch('must match password'));
    });
  });
});
