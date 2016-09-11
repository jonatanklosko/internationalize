(() => {
  angular.module('app.services')
    .factory('usersService', usersServiceFactory);

  usersServiceFactory.$inject = ['$http'];

  function usersServiceFactory($http) {
    return {
      create: user => $http.post('/users', user)
    };
  }
})();
