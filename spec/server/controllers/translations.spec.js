const User = require('models/user');
const Translation = require('models/translation');

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

  describe('GET #show', () => {
    let translation;
    beforeEach(() => factory.create('translation', { user: user.id }).then(created => translation = created));

    describe('when signed in as the owner', () => {
      beforeEach(() => helpers.signIn(user));

      it('responds with the translation', () => {
        return request.get(`/api/users/${user.id}/translations/${translation.id}`)
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.translation).toBeDefined();
          });
      });
    });

    describe('when signed in as another user', () => {
      beforeEach(() => factory.create('user').then(helpers.signIn));

      it('responds with authorization error', () => {
        return request.get(`/api/users/${user.id}/translations/${translation.id}`).promisify()
          .then(response => {
            expect(response.status).toEqual(401);
            expect(response.body.error).toMatch('Unauthorized request');
          });
      });
    });
  });

  describe('DELETE #destroy', () => {
    let translation;
    beforeEach(() => factory.create('translation', { user: user.id }).then(created => translation = created));

    describe('when signed in as the owner', () => {
      beforeEach(() => helpers.signIn(user));

      it('removes the translation', () => {
        return request.delete(`/api/users/${user.id}/translations/${translation.id}`).promisify()
          .then(response => expect(response.status).toEqual(204))
          .then(() => Translation.count({ _id: translation.id }))
          .then(count => expect(count).toEqual(0))
          .then(() => User.findById(user))
          .then(user => expect(user.translations.length).toEqual(0));
      });
    });
  });

  describe('POST #update', () => {
    let translation;
    beforeEach(() => {
      return factory.create('translation', { user: user.id, locale: 'en', data: { key: 'value' } })
        .then(created => translation = created);
    });

    describe('when signed in as the owner', () => {
      beforeEach(() => helpers.signIn(user));

      it('when the data is valid updates the translation', () => {
        return request.post(`/api/users/${user.id}/translations/${translation.id}`)
          .send({ locale: 'fr', data: { newKey: 'new value' } }).promisify()
          .then(response => expect(response.status).toEqual(204))
          .then(() => Translation.findById(translation))
          .then(translation => {
            expect(translation.data).toEqual({ newKey: 'new value' });
            expect(translation.locale).toEqual('fr');
          });
      });

      it('when the data is invalid responds with validation errors', () => {
        return request.post(`/api/users/${user.id}/translations/${translation.id}`)
          .send({ locale: '' }).promisify()
          .then(response => {
            expect(response.status).toEqual(422);
            expect(response.body.errors.locale.message).toMatch('Locale is required');
          });
      });
    });
  });

  describe('POST #updateKey', () => {
    let translation;
    beforeEach(() => {
      return factory.create('translation', { user: user.id, data: { en: { common: { name: 'Name' } } } })
        .then(created => translation = created);
    });

    describe('when signed in as the owner', () => {
      beforeEach(() => helpers.signIn(user));

      it('updates the specified key', () => {
        return request.post(`/api/users/${user.id}/translations/${translation.id}/keys/en.common.name`)
          .send({ value: 'Nom' }).promisify()
          .then(response => expect(response.status).toEqual(204))
          .then(() => Translation.findById(translation))
          .then(translation => expect(translation.data.en.common.name).toEqual('Nom'));
      });
    });
  });
});
