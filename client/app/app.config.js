(() => {
  angular.module('app')
    .config(config);

  config.$inject = ['$routeProvider'];

  function config($routeProvider) {
    // Set the default route.
    $routeProvider.otherwise({
        redirectTo: '/'
    });
  }
})();
