const User = require('models/user');

describe('TranslationController', () => {
  describe('POST #create', () => {
    describe('when a user is signed in', () => {
      it('when the data is valid creates a new translation that belongs to the user', () => {
        return factory.create('user', { username: 'creator' })
          .then(helpers.signIn)
          .then(() => factory.attrs('translation'))
          .then(attributes => request.post('/api/translations').send(attributes).promisify())
          .then(() => User.findOne({ username: 'creator' }))
          .then(creator => expect(creator.translations.length).toEqual(1));
      });

      it('when the data is invalid respods with validation errors', () => {
        return factory.create('user')
          .then(helpers.signIn)
          .then(() => factory.attrs('translation', { locale: '' }))
          .then(attributes => request.post('/api/translations').send(attributes).promisify())
          .then(response => {
            expect(response.status).toEqual(422);
            expect(response.body.errors.locale.message).toMatch('Locale is required');
          });
      });
    });
  });
});
