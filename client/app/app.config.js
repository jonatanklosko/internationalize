(() => {
  angular.module('app')
    .config(config);

  function config($urlRouterProvider) {
    'ngInject';

    // Set the default route.
    $urlRouterProvider.otherwise('/');
  }
})();
