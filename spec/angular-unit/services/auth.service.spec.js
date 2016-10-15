import angular from 'angular';

describe('AuthService', () => {
  beforeEach(angular.mock.module('app.services'));

  let $httpBackend,
      AuthService,
      $rootScope;

  beforeEach(angular.mock.inject((_$httpBackend_, _AuthService_, _$rootScope_) => {
    $httpBackend = _$httpBackend_;
    AuthService = _AuthService_;
    $rootScope = _$rootScope_;
  }));

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation(false);
    $httpBackend.verifyNoOutstandingRequest();
  });

  const userData = { username: 'sherlock', name: 'Sherlock' },
        credentials = { username: 'sherlock', password: 'secret' },
        forward = error => error;

  describe('currentUser', () => {
    it('when the request is unahuthorized, resolves with null', done => {
      $httpBackend.expectGET('/auth/me').respond(401, { error: 'Unauthorized request.' });
      AuthService.currentUser()
        .then(user => expect(user).toBeNull())
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the request is successful, resolves with the user data', done => {
      $httpBackend.expectGET('/auth/me').respond(200, { user: userData });
      AuthService.currentUser()
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('does only one request for a user data', done => {
      $httpBackend.expectGET('/auth/me').respond(200, { user: userData });
      AuthService.currentUser()
        .then(() => AuthService.currentUser())
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('signIn', () => {
    it('when the response is successful, resolves with the new user', done => {
      $httpBackend.expectPOST('/auth/signin', credentials).respond(200, { user: userData });
      AuthService.signIn(credentials)
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the response is unsuccessful, rejects with an error', done => {
      const error = 'Invalid credentials.';
      $httpBackend.expectPOST('/auth/signin', credentials).respond(422, { error: error });
      AuthService.signIn(credentials)
        .catch(forward)
        .then(err => expect(err).toEqual(error))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('signOut', () => {
    it('clears the user data cache', done => {
      $httpBackend.expectDELETE('/auth/signout').respond(200);
      AuthService.setCurrentUser(userData);
      AuthService.signOut()
        .then(() => AuthService.currentUser())
        .then(user => expect(user).toBeNull())
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('watchUser', () => {
    it('calls the function with the current user immediately', done => {
      AuthService.setCurrentUser(userData);
      AuthService.watchUser(user => {
        expect(user).toEqual(userData);
        done();
      });
      $rootScope.$digest(); /* Resolve $q promises. */
    });

    it('calls the function whenever the user changes', done => {
      AuthService.setCurrentUser(userData);
      const callback = jasmine.createSpy('callback');
      AuthService.watchUser(callback)
        .then(() => {
          AuthService.setCurrentUser(null);
          AuthService.setCurrentUser({ username: 'someone' });
          /* The two calls above and the one done by the `watchUser` method. */
          expect(callback.calls.count()).toEqual(3);
          expect(callback.calls.allArgs()).toEqual([[userData], [null], [{ username: 'someone' }]]);
        })
        .then(done, done.fail);
      $rootScope.$digest(); /* Resolve $q promises. */
    });
  });
});
