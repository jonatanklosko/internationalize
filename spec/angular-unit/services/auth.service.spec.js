describe('authService', () => {
  beforeEach(module('app.services'));

  let $httpBackend,
      authService;

  beforeEach(inject((_$httpBackend_, _authService_) => {
    $httpBackend = _$httpBackend_;
    authService = _authService_
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
      authService.currentUser()
        .then(user => expect(user).toBeNull())
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the request is successful, resolves with the user data', done => {
      $httpBackend.expectGET('/auth/me').respond(200, { user: userData });
      authService.currentUser()
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the user data is alrady loaded, doesn\'t do additional request', done => {
      $httpBackend.expectGET('/auth/me').respond(200, { user: userData });
      authService.currentUser()
        .then(() => authService.currentUser())
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('signUp', () => {
    it('when the response is successful, resolves with the new user', done => {
      $httpBackend.expectPOST('/api/users', userData).respond(201, { user: userData });
      authService.signUp(userData)
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the response is unsuccessful, rejects with errors', done => {
      const errors = { name: 'Too long' };
      $httpBackend.expectPOST('/api/users').respond(422, { errors: errors });
      authService.signUp({})
        .catch(forward)
        .then(err => expect(err).toEqual(errors))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('signIn', () => {
    it('when the response is successful, resolves with the new user', done => {
      $httpBackend.expectPOST('/auth/signin', credentials).respond(200, { user: userData });
      authService.signIn(credentials)
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the response is unsuccessful, rejects with an error', done => {
      const error = 'Invalid credentials.';
      $httpBackend.expectPOST('/auth/signin', credentials).respond(422, { error: error });
      authService.signIn(credentials)
        .catch(forward)
        .then(err => expect(err).toEqual(error))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });

  describe('signOut', () => {
    it('clears the user data cache', done => {
      $httpBackend.expectPOST('/auth/signin', credentials).respond(200, { user: userData });
      $httpBackend.expectDELETE('/auth/signout').respond(200);
      $httpBackend.expectGET('/auth/me').respond(401, { error: 'Unauthorized request.' });
      authService.signIn(credentials)
        .then(user => expect(user).toEqual(userData))
        .then(() => authService.signOut())
        .then(() => authService.currentUser())
        .then(user => expect(user).toBeNull())
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });
});
