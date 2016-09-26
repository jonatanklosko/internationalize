(() => {
  angular.module('app.staticPages')
    .config(config);

  function config($stateProvider) {
    'ngInject';

    $stateProvider
      .state('root', {
        url: '/',
        templateUrl: 'app/static-pages/home.template.html'
      });
  }
})();
