(() => {
  angular.module('app.services')
    .factory('userService', userServiceFactory);

  userServiceFactory.$inject = ['$http', '$q', 'authService'];

  function userServiceFactory($http, $q, authService) {
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
