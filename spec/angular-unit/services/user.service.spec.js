import angular from 'angular';

describe('UserService', () => {
  beforeEach(angular.mock.module('app.services'));

  let $httpBackend,
      UserService;

  beforeEach(angular.mock.inject((_$httpBackend_, _UserService_) => {
    $httpBackend = _$httpBackend_;
    UserService = _UserService_;
  }));

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation(false);
    $httpBackend.verifyNoOutstandingRequest();
  });

  const userData = { username: 'sherlock', name: 'Sherlock' },
        forward = error => error;

  describe('create', () => {
    it('when the response is successful, resolves with the new user', done => {
      $httpBackend.expectPOST('/api/users', userData).respond(201, { user: userData });
      UserService.create(userData)
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the response is unsuccessful, rejects with errors', done => {
      const errors = { name: 'Too long' };
      $httpBackend.expectPOST('/api/users').respond(422, { errors: errors });
      UserService.create({})
        .catch(forward)
        .then(err => expect(err).toEqual(errors))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });
});
