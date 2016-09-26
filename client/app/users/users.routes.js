(() => {
  angular.module('app.users')
    .config(config);

  function config($stateProvider) {
    'ngInject';

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
