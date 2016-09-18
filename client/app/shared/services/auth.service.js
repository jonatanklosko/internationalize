(() => {
  angular.module('app.services')
    .factory('authService', authServiceFactory);

  authServiceFactory.$inject = ['$http'];

  function authServiceFactory($http) {
    let user = null;

    const captureUser = res => user = res.data.user;

    return {
      /**
       * @param {Object} A new user data.
       * @return {Promise} Resolved with the user or rejected with validation errors.
       */
      signUp: userData =>
        $http.post('/api/users', userData)
          .then(captureUser)
          .catch(res => Promise.reject(res.data.errors)),

      /**
       * @param {Object} User credentials (username and password).
       * @return {Promise} Resolved with the user or rejected with an error.
       */
      signIn: credentials =>
        $http.post('/auth/signin', credentials)
          .then(captureUser)
          .catch(res => Promise.reject(res.data.error)),

      /**
       * @return {Promise} Resolved when the current user is signed out.
       */
      signOut: () =>
        $http.get('/auth/signout')
          .then(() => user = null),

      /**
       * @return {Promise} Resolved with the current user.
       */
      currentUser: () =>
        user ? Promise.resolve(user)
             : $http.get('/auth/me').then(captureUser).catch(() => null)
    };
  }
})();
