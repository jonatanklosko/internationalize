/**
 * Helpers meant to be used in Jasmine specs in a promise chain.
 * These are realated to controller specs.
 */
global.helpers = Object.assign(global.helpers || {}, {
  /**
   * Takes a user and sends a request signing him in.
   *
   * @example
   * signIn({ username: 'sherlock', password: 'secret' });
   *
   * @example
   * getUserAsync()
   *   .then(signIn);
   *
   * @param {Object} Should contain a username and a password.
   * @return {Promise} Resolved when the request is finished.
   */
  signIn: user =>
    request.post('/auth/signin')
      .send({ username: user.username, password: user.password })
      .promisify(),

  /**
   * @example
   * makeRequestAsync()
   *   .then(expectUnauthorizedRequest);
   *
   * @param {Object} A response.
   * @return {Object} The response.
   */
  expectUnauthorizedRequest: response => {
    expect(response.status).toEqual(401);
    expect(response.body.error).toMatch('Unauthorized request');
    return response;
  }
});
