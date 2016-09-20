describe('AuthController', () => {
  describe('POST #signIn', () => {
    it('when credentials are correct responds successfully', () => {
      return factory.create('user')
        .then(helpers.signIn)
        .then(response => expect(response.status).toEqual(200));
    });

    it('when credentials are incorrect respods with an error', () => {
      return factory.create('user', { username: 'sherock' })
        .then(user => helpers.signIn({ username: 'someone_else', password: user.password }))
        .then(response => {
          expect(response.status).toEqual(401);
          expect(response.body.error).toMatch('Incorrect username');
        });
    });
  });

  describe('GET #signOut', () => {
    it('clears the session', () => {
      return factory.create('user')
        .then(helpers.signIn)
        .then(() => request.get('/auth/signout').promisify())
        .then(response => expect(response.status).toEqual(200))
        .then(() => request.get('/auth/me').promisify())
        .then(helpers.expectUnauthorizedRequest);
    });
  });

  describe('GET #me', () => {
    it('when a user is signed in responds with his data', () => {
      return factory.create('user')
        .then(helpers.signIn)
        .then(() => request.get('/auth/me').promisify())
        .then(response => {
          expect(response.status).toEqual(200);
          ['_id', 'username', 'name'].forEach(attr => {
            expect(response.body.user[attr]).toBeDefined()
          });
        });
    });

    it('when a user is not signed in responds with an error', () => {
      return factory.create('user')
        .then(() => request.get('/auth/me').promisify())
        .then(helpers.expectUnauthorizedRequest);
    });
  });
});
