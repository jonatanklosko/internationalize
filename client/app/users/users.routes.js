(() => {
  angular.module('app.users')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) {
    $stateProvider
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/users/signup/signup.template.html',
        controller: 'SignupController'
      })
      .state('signin', {
        url: '/signin',
        templateUrl: 'app/users/signin/signin.template.html',
        controller: 'SigninController'
      });
  }
})();
