import angular from 'angular';

describe('TranslationService', () => {

  let translationAttributes = { name: 'Super project', locale: 'fr' };
  let translation = Object.assign({}, translationAttributes, { _id: 1 });
  let processedData = { hello: { _original: 'hello', _translated: 'salut' } };
  let translationWithData = Object.assign({}, translation, { data: processedData });
  let errors = { name: 'Too long' };
  let forward = error => error;

  beforeEach(angular.mock.module('app.services'));

  beforeEach(angular.mock.module($provide => {
    $provide.factory('AuthService', ($q) => {
      return {
        currentUser: () => $q.resolve({ _id: 1 })
      };
    });
    $provide.factory('TranslationUtils', ($q) => {
      return {
        pullRemoteData: () => $q.resolve({ newData: processedData })
      };
    });
  }));

  let $httpBackend,
      TranslationService;

  beforeEach(angular.mock.inject((_$httpBackend_, _TranslationService_) => {
    $httpBackend = _$httpBackend_;
    TranslationService = _TranslationService_;
  }));

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation(false);
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('create', () => {
    it('when the response is successful, does another request to push a processed data', done => {
      $httpBackend.expectPOST('/api/users/1/translations', translationAttributes).respond(201, { translation: translation });
      $httpBackend.expectPATCH('/api/users/1/translations/1', translationWithData).respond(204);
      TranslationService.create(translationAttributes)
        .then(returnedTranslation => expect(returnedTranslation).toEqual(translationWithData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the response is unsuccessful, rejects with errors', done => {
      $httpBackend.expectPOST('/api/users/1/translations').respond(422, { errors });
      TranslationService.create({})
        .catch(forward)
        .then(err => expect(err).toEqual(errors))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('getAll', () => {
    it('fetches all translations which belong to the current user', done => {
      let translations = [translation];
      $httpBackend.expectGET('/api/users/1/translations').respond(200, { translations });
      TranslationService.getAll()
        .then(returnedTranslations => expect(returnedTranslations).toEqual(translations))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('getTranslation', () => {
    it('fetches a translation by id', done => {
      $httpBackend.expectGET('/api/users/1/translations/1').respond(200, { translation });
      TranslationService.getTranslation(1)
        .then(returnedTranslation => expect(returnedTranslation).toEqual(translation))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('delete', () => {
    it('sends a DELETE request', done => {
      $httpBackend.expectDELETE('/api/users/1/translations/1').respond(204);
      TranslationService.delete(1)
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('update', () => {
    it('when the response is unsuccessful, rejects with errors', done => {
      $httpBackend.expectPATCH('/api/users/1/translations/1').respond(402, { errors });
      TranslationService.update(1, translation)
        .catch(forward)
        .then(err => expect(err).toEqual(errors))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('updateKey', () => {
    it('sends a PATCH request to update a translation key', done => {
      $httpBackend.expectPATCH('/api/users/1/translations/1/keys/en.common.name', { value: 'nom' }).respond(204);
      TranslationService.updateKey(1, 'en.common.name', 'nom')
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });
});
