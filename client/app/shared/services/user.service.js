(() => {
  angular.module('app.services')
    .factory('userService', userServiceFactory);

  function userServiceFactory($http, $q, authService) {
    'ngInject';

    return {
      /**
       * @param {Object} A new user data.
       * @return {Promise} Resolved with the user or rejected with validation errors.
       */
      create: userData =>
        $http.post('/api/users', userData)
          .then(res => authService.setCurrentUser(res.data.user))
          .catch(res => $q.reject(res.data.errors)),
    };
  }
})();
