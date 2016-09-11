(() => {
  angular.module('app.staticPages')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) {
    $stateProvider
      .state('root', {
        url: '/',
        templateUrl: 'app/static-pages/home.template.html'
      });
  }
})();
