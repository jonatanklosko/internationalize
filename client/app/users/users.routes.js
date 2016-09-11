(() => {
  angular.module('app.users')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) {
    $stateProvider
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/users/signup.template.html',
        controller: 'SignupController'
      });
  }
})();
