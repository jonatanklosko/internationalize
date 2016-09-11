(() => {
  angular.module('app')
    .config(config);

  config.$inject = ['$urlRouterProvider'];

  function config($urlRouterProvider) {
    // Set the default route.
    $urlRouterProvider.otherwise('/');
  }
})();
