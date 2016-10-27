const User = require('models/user');

describe('TranslationsController', () => {
  let user;
  beforeEach(() => factory.create('user').then(created => user = created));

  describe('POST #create', () => {
    describe('when a user is signed in', () => {
      beforeEach(() => helpers.signIn(user));

      it('when the data is valid creates a new translation that belongs to the user', () => {
        return factory.attrs('translation')
          .then(attributes => request.post(`/api/users/${user.id}/translations`).send(attributes).promisify())
          .then(() => User.findById(user))
          .then(creator => expect(creator.translations.length).toEqual(1));
      });

      it('when the data is invalid responds with validation errors', () => {
        return factory.attrs('translation', { locale: '' })
          .then(attributes => request.post(`/api/users/${user.id}/translations`).send(attributes).promisify())
          .then(response => {
            expect(response.status).toEqual(422);
            expect(response.body.errors.locale.message).toMatch('Locale is required');
          });
      });
    });
  });

  describe('GET #index', () => {
    describe('when a user is signed in', () => {
      beforeEach(() => helpers.signIn(user));
      beforeEach(() =>  factory.createMany('translation', 3, { user: user.id }));

      it('responds with his translations list', () => {
        return request.get(`/api/users/${user.id}/translations`).promisify()
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.translations.length).toEqual(3);
          });
      });
    });
  });
});
