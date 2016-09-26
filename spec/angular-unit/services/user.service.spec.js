describe('userService', () => {
  beforeEach(module('app.services'));

  let $httpBackend,
      userService;

  beforeEach(inject((_$httpBackend_, _userService_) => {
    $httpBackend = _$httpBackend_;
    userService = _userService_
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
      userService.create(userData)
        .then(user => expect(user).toEqual(userData))
        .then(done, done.fail);
      $httpBackend.flush();
    });

    it('when the response is unsuccessful, rejects with errors', done => {
      const errors = { name: 'Too long' };
      $httpBackend.expectPOST('/api/users').respond(422, { errors: errors });
      userService.create({})
        .catch(forward)
        .then(err => expect(err).toEqual(errors))
        .then(done, done.fail);
      $httpBackend.flush();
    });
  });
});
